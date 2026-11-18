import { randomUUID } from "node:crypto";
import { z } from "zod";
import { encryptAadhaar } from "../utils/aadhaar.crypto.js";
import { sendPaymentReceiptEmail } from "../services/email.service.js";
import { insertManualPayment, getPaymentOrder, submitCustomerUtr, listManualPayments, finalizeManualPayment, getCustomerPaymentStatus, getPublicPaymentTracking } from "../models/payment.model.js";

const customerSchema = z.object({
  fullName: z.string().trim().min(2).max(150), email: z.string().trim().email().max(255),
  phone: z.string().trim().regex(/^[6-9][0-9]{9}$/), aadhaarNumber: z.string().regex(/^[0-9]{12}$/),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  fatherName: z.string().trim().max(150).optional(), city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(), consent: z.literal(true),
  consentDetails: z.object({
    privacyAccepted: z.literal(true), termsAccepted: z.literal(true),
    privacyVersion: z.string().trim().min(1).max(50), termsVersion: z.string().trim().min(1).max(50)
  }).strict()
}).strict();

export const createManualPayment = async (req, res) => {
  try {
    if (process.env.CUSTOMER_INTAKE_ENABLED !== "true") return res.status(503).json({ success: false, message: "Customer intake is temporarily unavailable." });
    const validation = customerSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ success: false, message: "Please check the submitted information.", errors: validation.error.flatten().fieldErrors });
    const amount = Number(process.env.PANKHOJO_SERVICE_FEE_PAISE || 0);
    if (!Number.isSafeInteger(amount) || amount < 100 || !process.env.PANKHOJO_UPI_ID || !process.env.PANKHOJO_UPI_NAME || !process.env.PANKHOJO_UPI_QR_IMAGE) {
      return res.status(503).json({ success: false, message: "Manual UPI payment is not configured yet. Please contact PANKhojo support." });
    }
    // At checkout creation, persist only the three lead contact fields.
    // The remaining request details are sent securely only when the customer submits the UTR.
    const customerPayload = {
      fullName: validation.data.fullName,
      email: validation.data.email,
      phone: validation.data.phone
    };
    const paymentReference = `PKP-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    await insertManualPayment({ paymentReference, amount, customerPayload });
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    return res.status(201).json({ success: true, paymentReference, amount, currency: "INR", upiId: process.env.PANKHOJO_UPI_ID, payeeName: process.env.PANKHOJO_UPI_NAME, qrImage: process.env.PANKHOJO_UPI_QR_IMAGE, expiresAt });
  } catch (error) {
    console.error("Create manual payment error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to prepare payment. Please try again." });
  }
};

export const submitManualPayment = async (req, res) => {
  const schema = z.object({
    paymentReference: z.string().trim().min(8).max(80),
    utr: z.string().trim().regex(/^[A-Za-z0-9-]{8,35}$/),
    paymentConfirmed: z.literal(true),
    requestData: customerSchema
  }).strict();
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Enter a valid UPI transaction reference (UTR)." });
  try {
    const order = await getPaymentOrder(parsed.data.paymentReference);
    if (!order) return res.status(404).json({ success: false, message: "Payment reference not found." });
    if (!process.env.AADHAAR_ENCRYPTION_KEY) {
      return res.status(503).json({ success: false, message: "Secure request storage is not configured. Please contact support." });
    }
    const { aadhaarNumber, consentDetails, ...requestFields } = parsed.data.requestData;
    const customerPayload = {
      ...requestFields,
      aadhaarEncrypted: encryptAadhaar(aadhaarNumber),
      aadhaarLast4: aadhaarNumber.slice(-4),
      privacyPolicyVersion: consentDetails.privacyVersion,
      termsVersion: consentDetails.termsVersion
    };
    const submission = await submitCustomerUtr({
      paymentReference: parsed.data.paymentReference,
      utr: parsed.data.utr,
      customerPayload
    });
    if (!submission.updated) return res.status(409).json({ success: false, message: submission.reason === "not_found" ? "Payment reference not found." : submission.reason === "expired" ? "This checkout expired after five minutes and has been cancelled. If you already paid, do not pay again; contact support with your payment reference." : "Payment details have already been submitted or this reference is no longer active." });
    return res.status(200).json({
      success: true,
      message: "Your request has been created and your UTR is awaiting manual payment verification.",
      requestNumber: submission.requestNumber,
      paymentReference: parsed.data.paymentReference,
      verificationTime: process.env.PANKHOJO_PAYMENT_VERIFICATION_TIME || "Within 24 hours."
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ success: false, message: "This UPI transaction reference has already been submitted." });
    console.error("Submit manual payment error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to submit payment details." });
  }
};

export const getManualPayments = async (_req, res) => {
  try { return res.json({ success: true, payments: await listManualPayments() }); }
  catch (error) { console.error(error.message); return res.status(500).json({ success: false, message: "Unable to load payments." }); }
};

export const decideManualPayment = async (req, res) => {
  const parsed = z.object({ decision: z.enum(["verify", "reject"]), adminRemark: z.string().trim().max(500).optional(), customerMessage: z.string().trim().max(500).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid payment decision." });
  try {
    const existingOrder = await getPaymentOrder(req.params.reference);
    if (!existingOrder) return res.status(404).json({ success: false, message: "Payment record not found." });
    const result = await finalizeManualPayment({ paymentReference: req.params.reference, adminId: req.admin.id, decision: parsed.data.decision === "verify" ? "verify" : "reject", adminRemark: parsed.data.adminRemark || "", customerMessage: parsed.data.customerMessage || "" });
    if (result.request) {
      const request = result.request;
      const emailResult = await sendPaymentReceiptEmail({ email: request.email, fullName: request.fullName, requestNumber: request.requestNumber, paymentId: existingOrder.customer_utr, orderId: req.params.reference, amount: existingOrder.amount, currency: existingOrder.currency, paidAt: new Date() }).catch((error) => { console.error("Payment receipt email error:", error.message); return { sent: false }; });
      return res.json({ success: true, message: "Payment verified. The request is now ready for processing.", request, emailSent: emailResult.sent });
    }
    return res.json({ success: true, message: "Payment marked as rejected." });
  } catch (error) { return res.status(409).json({ success: false, message: error.message || "Unable to update payment." }); }
};

export const trackCustomerPayment = async (req, res) => {
  const parsed = z.object({ paymentReference: z.string().trim().min(8).max(80), email: z.string().trim().email().max(255) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Enter a valid payment reference and registered email address." });
  try {
    const payment = await getPublicPaymentTracking(parsed.data);
    if (!payment) return res.status(404).json({ success: false, message: "We could not find a payment matching those details. Check your reference and registered email." });
    const messages = {
      created: "We have created your payment reference, but have not yet received your UTR. The checkout expires after five minutes.",
      expired: "This checkout expired after five minutes. If you already transferred money, do not pay again; contact support with your payment reference and UTR if available.",
      submitted: "Your request has been created. Your UTR is being checked against the merchant bank account.",
      verified: "Payment verified successfully. Your PAN-finding request is ready for processing.",
      rejected: "We could not match the submitted payment. Please read the update below and contact support before paying again.",
      failed: "The payment could not be completed. Please contact support if money was debited."
    };
    return res.json({ success: true, payment: { paymentReference: payment.payment_reference, amount: payment.amount, currency: payment.currency, status: payment.status, createdAt: payment.created_at, updatedAt: payment.verified_at || payment.created_at, requestNumber: payment.request_number || null, customerMessage: payment.customer_message || null, message: messages[payment.status] || "Your payment status is being updated." } });
  } catch (error) {
    console.error("Public payment tracking error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to check payment status right now. Please try again later." });
  }
};

export const checkCustomerPaymentStatus = async (req, res) => {
  const parsed = z.object({ paymentReference: z.string().min(8).max(80), utr: z.string().trim().regex(/^[A-Za-z0-9-]{8,35}$/) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Enter the payment reference and UTR used during submission." });
  try {
    const payment = await getCustomerPaymentStatus(parsed.data);
    if (!payment) return res.status(404).json({ success: false, message: "We could not find a matching submission. Check the payment reference and UTR." });
    const statusMessages = { submitted: "Your request has been created. Your payment details are awaiting manual bank verification.", verified: "Payment verified successfully. Your request is ready for processing.", rejected: "The submitted payment could not be matched. Please contact support before making another payment.", expired: "This checkout expired after five minutes and was cancelled. If you already transferred money, do not pay again; contact support." };
    return res.json({ success: true, status: payment.status, message: statusMessages[payment.status] || "Payment status is being updated.", requestCreated: Boolean(payment.request_id), requestId: payment.request_id || null, requestNumber: payment.request_number || null, verifiedAt: payment.verified_at || null });
  } catch (error) {
    console.error("Customer payment status error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to check payment status right now." });
  }
};
