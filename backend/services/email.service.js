const RESEND_API_URL = "https://api.resend.com/emails";

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const emailLayout = ({ title, name, message, requestNumber, statusLabel }) => `
<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#17243b">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden">
<tr><td style="background:#10243e;padding:24px 30px;color:#fff;font-size:22px;font-weight:700">PANKhojo</td></tr>
<tr><td style="padding:30px"><h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(title)}</h1>
<p style="font-size:15px;line-height:1.6">Hello ${escapeHtml(name)},</p>
<p style="font-size:15px;line-height:1.6">${escapeHtml(message)}</p>
<div style="background:#f1f6fb;border-radius:10px;padding:16px;margin:22px 0">
<div style="font-size:12px;color:#607089">REQUEST REFERENCE</div><div style="font-size:18px;font-weight:700;margin-top:5px">${escapeHtml(requestNumber)}</div>
${statusLabel ? `<div style="font-size:13px;margin-top:10px;color:#35516e">Current status: <strong>${escapeHtml(statusLabel)}</strong></div>` : ""}
</div>
<p style="font-size:13px;line-height:1.6;color:#607089">Please keep this reference number for future communication. For your security, we never include Aadhaar or PAN numbers in email notifications.</p>
<p style="font-size:14px;line-height:1.6">Regards,<br><strong>PANKhojo Support</strong></p>
</td></tr><tr><td style="padding:16px 30px;background:#f8fafc;color:#8190a4;font-size:11px">This is an automated service message from PANKhojo.</td></tr>
</table></td></tr></table></body></html>`;

export const sendTransactionalEmail = async ({ to, subject, html, text, attachments }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
        console.info("Email skipped: configure RESEND_API_KEY and EMAIL_FROM to enable Resend.");
        return { sent: false, reason: "not_configured" };
    }

    const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ from, to: [to], subject, html, text, ...(attachments?.length ? { attachments } : {}) }),
        signal: AbortSignal.timeout(10000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        console.error("Resend email failed:", response.status, result.name || result.message || "Provider error");
        return { sent: false, reason: "provider_error" };
    }
    return { sent: true, id: result.id };
};

export const sendRequestConfirmation = async ({ email, fullName, requestNumber }) => {
    const baseUrl = (process.env.FRONTEND_URL || "https://pankhojo.in").replace(/\/$/, "");
    const trackingUrl = `${baseUrl}/?track=1`;
    const refundUrl = `${baseUrl}/refund-policy.html`;
    const safeName = escapeHtml(fullName || "Customer");
    const safeRequest = escapeHtml(requestNumber);
    const safeTracking = escapeHtml(trackingUrl);
    const safeRefund = escapeHtml(refundUrl);
    const message = "Your PANKhojo PAN-finding request has been received. Our expected processing time is 1–2 working days. After processing, your existing PAN will be sent to this registered email address as a password-protected PDF. Additional verification or external service delays may take longer.";
    const html = `<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#17243b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden"><tr><td style="background:#10243e;padding:24px 30px;color:#fff;font-size:22px;font-weight:700">PANKhojo · PAN Finder</td></tr><tr><td style="padding:30px"><h1 style="font-size:22px;margin:0 0 16px">Your request has been received</h1><p>Hello ${safeName},</p><p style="font-size:15px;line-height:1.6">${escapeHtml(message)}</p><div style="background:#f1f6fb;border-radius:10px;padding:16px;margin:22px 0"><div style="font-size:12px;color:#607089">YOUR REQUEST REFERENCE</div><div style="font-size:20px;font-weight:700;margin-top:5px">${safeRequest}</div></div><p><a href="${safeTracking}" style="display:inline-block;background:#17365d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Track your request</a></p><p style="font-size:13px;line-height:1.6;color:#607089">You can track your request using this reference number and your registered email address. Please review our <a href="${safeRefund}">Cancellation & Refund Policy</a>.</p><p style="font-size:13px;line-height:1.6;color:#607089">For your security, Aadhaar and PAN numbers are never included in email notifications.</p><p>Regards,<br><strong>PANKhojo Support</strong></p></td></tr></table></td></tr></table></body></html>`;
    const text = `Hello ${fullName || "Customer"},\n\n${message}\n\nRequest reference: ${requestNumber}\nTrack your request: ${trackingUrl}\nCancellation & Refund Policy: ${refundUrl}\n\nPANKhojo Support`;
    return sendTransactionalEmail({ to: email, subject: `PANKhojo PAN-finding request received — ${requestNumber}`, html, text });
};

const statusMessages = {
    pending: "Your request is awaiting review.",
    processing: "Your request is now being processed by our team.",
    completed: "Your request has been marked as completed. Please contact our support team if you need help with the delivery.",
    rejected: "We are unable to proceed with your request at this time. Please contact our support team for more information."
};

export const sendRequestStatusUpdate = async ({ email, fullName, requestNumber, status, customerMessage = "" }) => {
    const labels = { pending: "Pending", processing: "Processing", completed: "Completed", rejected: "Unable to proceed", cancelled: "Cancelled" };
    const titles = {
        pending: "Your PAN-finding request is pending",
        processing: "We are finding your PAN",
        completed: "Your PAN-finding request is completed",
        rejected: "We cannot proceed with your PAN-finding request",
        cancelled: "Your PAN-finding request was cancelled"
    };
    const messages = {
        pending: "Your PAN-finding request is awaiting review.",
        processing: "Our team has started processing your PAN-finding request.",
        completed: "Your PAN-finding request has been marked as completed. Please check the secure delivery instructions shared by our team.",
        rejected: "We are unable to proceed with your PAN-finding request. The reason shared with you is included below.",
        cancelled: "Your PANKhojo PAN-finding request has been cancelled. Please review the reason and refund policy below. If a refund is eligible and approved, we will initiate it within 5–7 business days; your bank or payment provider may take additional time to credit it."
    };
    const baseUrl = (process.env.FRONTEND_URL || "https://pankhojo.in").replace(/\/$/, "");
    const trackingUrl = `${baseUrl}/?track=1`;
    const refundUrl = `${baseUrl}/refund-policy.html`;
    const safeName = escapeHtml(fullName || "Customer");
    const safeRequest = escapeHtml(requestNumber);
    const safeMessage = escapeHtml(customerMessage || "Please contact PANKhojo support for more information.");
    const needsReason = ["rejected", "cancelled"].includes(status);
    const title = titles[status] || "Your PANKhojo request has been updated";
    const message = messages[status] || "Your request status has been updated.";
    const html = `<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#17243b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden"><tr><td style="background:#10243e;padding:24px 30px;color:#fff;font-size:22px;font-weight:700">PANKhojo · PAN Finder</td></tr><tr><td style="padding:30px"><h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(title)}</h1><p style="font-size:15px;line-height:1.6">Hello ${safeName},</p><p style="font-size:15px;line-height:1.6">${escapeHtml(message)}</p>${needsReason ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin:20px 0"><strong style="font-size:13px">Reason shared with you</strong><p style="font-size:14px;line-height:1.6;margin:8px 0 0">${safeMessage}</p></div>` : ""}<div style="background:#f1f6fb;border-radius:10px;padding:16px;margin:22px 0"><div style="font-size:12px;color:#607089">REQUEST REFERENCE</div><div style="font-size:18px;font-weight:700;margin-top:5px">${safeRequest}</div><div style="font-size:13px;margin-top:10px;color:#35516e">Current status: <strong>${escapeHtml(labels[status] || status)}</strong></div></div><p><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#17365d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Track your request</a></p>${status === "cancelled" ? `<p style="font-size:13px;line-height:1.6"><a href="${escapeHtml(refundUrl)}">Read our cancellation and refund policy</a>.</p>` : ""}<p style="font-size:13px;line-height:1.6;color:#607089">For your security, we never include Aadhaar or PAN numbers in email notifications. Internal team notes are not shared in customer emails.</p><p style="font-size:14px;line-height:1.6">Regards,<br><strong>PANKhojo Support</strong></p></td></tr><tr><td style="padding:16px 30px;background:#f8fafc;color:#8190a4;font-size:11px">This is an automated service message from PANKhojo.</td></tr></table></td></tr></table></body></html>`;
    const text = `Hello ${fullName || "Customer"},\n\n${message}${needsReason ? `\n\nReason shared with you: ${customerMessage || "Please contact PANKhojo support for more information."}` : ""}\n\nRequest reference: ${requestNumber}\nStatus: ${labels[status] || status}\nTrack your request: ${trackingUrl}${status === "cancelled" ? `\nCancellation and refund policy: ${refundUrl}` : ""}\n\nPANKhojo Support`;
    return sendTransactionalEmail({ to: email, subject: `PANKhojo ${labels[status] || "request"} update — ${requestNumber}`, html, text });
};

// Sent once after an administrator has matched a UPI payment to the business bank credit. No Aadhaar or PAN is included.
export const sendPaymentReceiptEmail = async ({
    email,
    fullName,
    requestNumber,
    paymentId,
    orderId,
    amount,
    currency = "INR",
    paidAt = new Date()
}) => {
    const amountInMajorUnits = (Number(amount) / 100).toFixed(2);
    const formattedAmount = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        minimumFractionDigits: 2
    }).format(Number(amount) / 100);
    const paidDate = new Date(paidAt);
    const formattedDate = Number.isNaN(paidDate.getTime())
        ? new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        : paidDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const safeName = escapeHtml(fullName);
    const safeRequest = escapeHtml(requestNumber);
    const safePaymentId = escapeHtml(paymentId);
    const safeOrderId = escapeHtml(orderId);
    const safeAmount = escapeHtml(formattedAmount);
    const safeDate = escapeHtml(formattedDate);
    const subject = `PANKhojo payment receipt — ${requestNumber}`;
    const trackingUrl = `${(process.env.FRONTEND_URL || "https://pankhojo.in").replace(/\/$/, "")}/?track=1`;
    const safeTrackingUrl = escapeHtml(trackingUrl);
    const html = `
<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#17243b">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden">
<tr><td style="background:#10243e;padding:24px 30px;color:#fff;font-size:22px;font-weight:700">PANKhojo</td></tr>
<tr><td style="padding:30px">
<h1 style="font-size:22px;margin:0 0 16px">Payment successful</h1>
<p style="font-size:15px;line-height:1.6">Hello ${safeName},</p>
<p style="font-size:15px;line-height:1.6">We have verified your payment and created your PANKhojo PAN-finding request. Please keep this receipt and your request reference for future communication.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:22px 0;background:#f5f8fb;border-radius:10px">
<tr><td colspan="2" style="padding:16px 16px 8px;font-size:12px;color:#607089;font-weight:700;letter-spacing:.06em">PAYMENT RECEIPT</td></tr>
<tr><td style="padding:8px 16px;color:#607089;font-size:13px">Amount paid</td><td align="right" style="padding:8px 16px;font-size:17px;font-weight:700">${safeAmount}</td></tr>
<tr><td style="padding:8px 16px;color:#607089;font-size:13px">Payment status</td><td align="right" style="padding:8px 16px;font-size:13px;font-weight:700;color:#16845b">Successful</td></tr>
<tr><td style="padding:8px 16px;color:#607089;font-size:13px">Payment date (IST)</td><td align="right" style="padding:8px 16px;font-size:13px">${safeDate}</td></tr>
<tr><td style="padding:8px 16px;color:#607089;font-size:13px">Cashfree transaction ID</td><td align="right" style="padding:8px 16px;font-size:12px;word-break:break-all">${safePaymentId}</td></tr>
<tr><td style="padding:8px 16px 16px;color:#607089;font-size:13px">PANKhojo payment reference</td><td align="right" style="padding:8px 16px 16px;font-size:12px;word-break:break-all">${safeOrderId}</td></tr>
</table>
<div style="background:#edf5fb;border-radius:10px;padding:16px;margin:22px 0">
<div style="font-size:12px;color:#607089">YOUR REQUEST REFERENCE</div>
<div style="font-size:20px;font-weight:700;margin-top:5px">${safeRequest}</div>
</div>
<p style="margin:22px 0"><a href="${safeTrackingUrl}" style="display:inline-block;background:#17365d;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700">Track your request</a></p>
<p style="font-size:13px;line-height:1.6;color:#607089">Our expected PAN-finding processing time is 1–2 working days. We will send your existing PAN to this registered email address as a password-protected PDF after processing is complete. If additional verification or an external service delay occurs, we will update you.</p>
<p style="font-size:13px;line-height:1.6;color:#607089">Please review our <a href="${escapeHtml((process.env.FRONTEND_URL || "https://pankhojo.in").replace(/\/$/, "") + "/refund-policy.html")}">cancellation and refund policy</a> before contacting support.</p>
<p style="font-size:13px;line-height:1.6;color:#607089">This email is your PANKhojo payment confirmation. It is not a tax invoice. For your security, Aadhaar and PAN numbers are never included in payment emails.</p>
<p style="font-size:14px;line-height:1.6">Regards,<br><strong>PANKhojo Support</strong></p>
</td></tr><tr><td style="padding:16px 30px;background:#f8fafc;color:#8190a4;font-size:11px">This is an automated payment receipt from PANKhojo. Please retain it for your records.</td></tr>
</table></td></tr></table></body></html>`;
    const text = `PANKhojo payment receipt\n\nHello ${fullName},\n\nYour payment was successful and your PAN-finding request has been created. Our expected processing time is 1–2 working days. After processing, we will send your existing PAN to this registered email address as a password-protected PDF.\n\nAmount paid: ${formattedAmount}\nPayment status: Successful\nPayment date (IST): ${formattedDate}\nCashfree transaction ID: ${paymentId}\nPANKhojo payment reference: ${orderId}\nRequest reference: ${requestNumber}\nTrack your request: ${trackingUrl}\nExpected processing time: 1–2 working days. Your existing PAN will be sent to this registered email as a password-protected PDF after processing.\nCancellation and refund policy: ${(process.env.FRONTEND_URL || "https://pankhojo.in").replace(/\/$/, "")}/refund-policy.html\n\nThis is a payment confirmation, not a tax invoice. Aadhaar and PAN numbers are not included in this email.\n\nPANKhojo Support`;

    return sendTransactionalEmail({ to: email, subject, html, text });
};


export const sendPanResultEmail = async ({ email, fullName, requestNumber, pdfBuffer }) => {
    const safeName = escapeHtml(fullName || "Customer");
    const safeRequest = escapeHtml(requestNumber);
    const baseUrl = (process.env.FRONTEND_URL || "https://pankhojo.in").replace(/\/$/, "");
    const trackingUrl = `${baseUrl}/?track=1`;
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;color:#17243b;padding:24px"><div style="max-width:560px;margin:auto;background:#fff;padding:28px;border-radius:14px"><h2 style="color:#17365d">Congratulations from PANKhojo!</h2><p>Hello ${safeName},</p><p>We have completed your PAN-finding request. Your password-protected PAN result PDF is attached to this email.</p><p><strong>Request reference:</strong> ${safeRequest}</p><p>Please use the separate password message sent by PANKhojo to open the PDF. Keep the document confidential.</p><p><a href="${escapeHtml(trackingUrl)}">Track your request</a></p><p>Regards,<br><strong>PANKhojo Support</strong></p></div></body></html>`;
    const text = `Congratulations ${fullName || "Customer"},\n\nYour PAN-finding request ${requestNumber} is completed. Your password-protected PDF is attached. The PDF password will be sent in a separate email. Keep the document confidential.\nTrack your request: ${trackingUrl}\n\nPANKhojo Support`;
    const attachment = { filename: `PANKhojo-${requestNumber}-PAN-Result.pdf`, content: pdfBuffer.toString("base64") };
    const result = await sendTransactionalEmail({ to: email, subject: `Your PAN finding is complete — ${requestNumber}`, html, text, attachments: [attachment] });
    return result;
};

export const sendPanPdfPasswordEmail = async ({ email, fullName, requestNumber, password }) => {
    const html = `<p>Hello ${escapeHtml(fullName || "Customer")},</p><p>Your password to open the PANKhojo PAN result PDF for request <strong>${escapeHtml(requestNumber)}</strong> is:</p><p style="font-size:22px;font-weight:bold;letter-spacing:2px">${escapeHtml(password)}</p><p>Keep this password confidential and delete this message after opening the PDF.</p><p>PANKhojo Support</p>`;
    const text = `Your PANKhojo PDF password for ${requestNumber}: ${password}. Keep it confidential.`;
    return sendTransactionalEmail({ to: email, subject: `Separate PDF password — ${requestNumber}`, html, text });
};
