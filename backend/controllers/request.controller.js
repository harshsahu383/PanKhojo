
import { z } from "zod";
import { decryptAadhaar, encryptAadhaar } from "../utils/aadhaar.crypto.js";
import { randomBytes } from "node:crypto";
import { createProtectedPanPdf } from "../services/pan-pdf.service.js";
import { sendPanResultEmail, sendPanPdfPasswordEmail } from "../services/email.service.js";
import { sendRequestConfirmation, sendRequestStatusUpdate } from "../services/email.service.js";

import {
    createRequest,
    getRequests,
    getRequestById,
    getEncryptedAadhaarById,
    updateRequestStatus,
    completeRequestWithPan,
    markPanDeliverySent,
    getRequestLogs,
    recordAadhaarAccess
} from "../models/request.model.js";

const createRequestSchema = z.object({
    fullName: z.string().trim().min(2).max(150),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().regex(/^[0-9+\-\s]{8,20}$/),
    aadhaarNumber: z.string().regex(/^[0-9]{12}$/),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
    fatherName: z.string().trim().max(150).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    consent: z.literal(true),
    consentDetails: z.object({
        privacyAccepted: z.literal(true),
        termsAccepted: z.literal(true),
        privacyVersion: z.string().trim().min(1).max(50),
        termsVersion: z.string().trim().min(1).max(50)
    }).strict(),
    testMode: z.literal(true)
}).strict();

const statusSchema = z.object({
    status: z.enum([
        "pending",
        "processing",
        "completed",
        "rejected",
        "cancelled"
    ]),
    description: z.string().trim().max(500).optional(),
    customerMessage: z.string().trim().max(500).optional(),
    panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/).optional()
}).superRefine((value, ctx) => {
    if (value.status === "completed" && !value.panNumber) ctx.addIssue({ code: "custom", path: ["panNumber"], message: "Enter a valid PAN number to complete and deliver this request." });
    if (["rejected", "cancelled"].includes(value.status)) {
        if (!value.description || value.description.trim().length < 5) ctx.addIssue({ code: "custom", path: ["description"], message: "An internal remark of at least 5 characters is required." });
        if (!value.customerMessage || value.customerMessage.trim().length < 5) ctx.addIssue({ code: "custom", path: ["customerMessage"], message: "A customer-facing reason of at least 5 characters is required." });
    }
});

export const submitRequest = async (req, res) => {
    if (process.env.TEST_REQUESTS_ENABLED !== "true" || req.body?.testMode !== true) {
        return res.status(503).json({
            success: false,
            message: "Test request intake is disabled. Enable TEST_REQUESTS_ENABLED for local development only."
        });
    }

    try {
        const validation = createRequestSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Please check the submitted information.",
                errors: validation.error.flatten().fieldErrors
            });
        }

        if (!process.env.AADHAAR_ENCRYPTION_KEY) {
            return res.status(503).json({ success: false, message: "Secure Aadhaar storage is not configured. Set AADHAAR_ENCRYPTION_KEY on the backend." });
        }

        const { aadhaarNumber, consentDetails, ...customerData } = validation.data;
        const result = await createRequest({
            ...customerData,
            privacyConsent: consentDetails.privacyAccepted,
            termsConsent: consentDetails.termsAccepted,
            privacyPolicyVersion: consentDetails.privacyVersion,
            termsVersion: consentDetails.termsVersion,
            aadhaarEncrypted: encryptAadhaar(aadhaarNumber),
            aadhaarLast4: aadhaarNumber.slice(-4)
        });

        // Email delivery is best-effort: a provider outage must not undo a saved request.
        const emailResult = await sendRequestConfirmation({
            email: customerData.email,
            fullName: customerData.fullName,
            requestNumber: result.requestNumber
        }).catch((error) => {
            console.error("Request confirmation email error:", error.message);
            return { sent: false, reason: "send_error" };
        });

        return res.status(201).json({
            success: true,
            message: "Request received.",
            request: result,
            emailSent: emailResult.sent
        });
    } catch (error) {
        console.error("Request submission error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to submit the request."
        });
    }
};

export const listRequests = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

        const allowedStatuses = [
            "pending",
            "processing",
            "completed",
            "rejected",
            "cancelled"
        ];

        const status = req.query.status || undefined;
        const search = String(req.query.search || "").trim().slice(0, 100);

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid request status."
            });
        }

        const result = await getRequests({
            page,
            limit,
            status,
            search: search || undefined
        });

        return res.status(200).json({
            success: true,
            ...result,
            totalPages: Math.ceil(result.total / limit)
        });
    } catch (error) {
        console.error("List requests error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve requests."
        });
    }
};

export const getRequestDetails = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        const request = await getRequestById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        const logs = await getRequestLogs(id);

        return res.status(200).json({
            success: true,
            request,
            logs
        });
    } catch (error) {
        console.error("Request details error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve request details."
        });
    }
};

export const revealRequestAadhaar = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ success: false, message: "Invalid request ID." });
        }
        const encrypted = await getEncryptedAadhaarById(id);
        if (!encrypted) {
            return res.status(404).json({ success: false, message: "Aadhaar value not found for this request." });
        }
        const aadhaarNumber = decryptAadhaar(encrypted);
        await recordAadhaarAccess({ requestId: id, adminId: req.admin.id });
        return res.status(200).json({ success: true, aadhaarNumber });
    } catch (error) {
        console.error("Aadhaar reveal error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to reveal Aadhaar. Check encryption configuration." });
    }
};

export const changeRequestStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        const validation = statusSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid status update.",
                errors: validation.error.flatten().fieldErrors
            });
        }

        const { status, description, customerMessage, panNumber } = validation.data;
        if (status === "completed") {
            const normalizedPan = panNumber.toUpperCase();
            const updated = await completeRequestWithPan({ requestId: id, adminId: req.admin.id, panEncrypted: encryptAadhaar(normalizedPan) });
            if (!updated.found) return res.status(404).json({ success: false, message: "Request not found." });
            if (updated.alreadyDelivered) return res.status(409).json({ success: false, message: "PAN result has already been delivered for this request." });
            const request = await getRequestById(id);
            const password = randomBytes(9).toString("base64url");
            const pdfBuffer = await createProtectedPanPdf({ fullName: request.full_name, requestNumber: request.request_number, panNumber: normalizedPan, password });
            const delivery = await sendPanResultEmail({ email: request.email, fullName: request.full_name, requestNumber: request.request_number, pdfBuffer });
            if (!delivery.sent) return res.status(502).json({ success: false, message: "Request marked completed, but the result email could not be sent. Please check email configuration and retry with support." });
            const passwordDelivery = await sendPanPdfPasswordEmail({ email: request.email, fullName: request.full_name, requestNumber: request.request_number, password });
            if (!passwordDelivery.sent) return res.status(502).json({ success: true, emailSent: true, passwordEmailSent: false, message: "PDF was emailed, but the separate password email failed. Contact the customer through a verified alternate channel before sharing the password." });
            await markPanDeliverySent(id);
            return res.status(200).json({ success: true, message: "Request completed. Password-protected PAN PDF and separate password email sent.", emailSent: true, passwordEmailSent: true });
        }
        const updated = await updateRequestStatus({ requestId: id, adminId: req.admin.id, status, description, customerMessage });
        if (!updated) return res.status(404).json({ success: false, message: "Request not found." });
        const request = await getRequestById(id);
        const emailResult = request ? await sendRequestStatusUpdate({ email: request.email, fullName: request.full_name, requestNumber: request.request_number, status, customerMessage: ["rejected", "cancelled"].includes(status) ? customerMessage : "" }).catch((error) => { console.error("Request status email error:", error.message); return { sent: false }; }) : { sent: false };
        return res.status(200).json({ success: true, message: emailResult.sent ? "Request status updated and customer notified." : "Request status updated. Email could not be sent; the customer can still see the status on the tracking page.", emailSent: emailResult.sent });
    } catch (error) {
        console.error("Update request status error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update request status."
        });
    }
};
