import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { encryptAadhaar } from '../utils/aadhaar.crypto.js';
import { sendPaymentReceiptEmail, sendAdminNewRequestEmail } from '../services/email.service.js';
import { insertCashfreeOrder, getCashfreeOrder, finalizeCashfreePayment, markCashfreePaymentFailed, markCashfreePaymentPending, markCashfreePaymentExpired, getCashfreePublicStatus } from '../models/payment.model.js';

const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';
const cashfreeBase = () => process.env.CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
const credentialsReady = () => Boolean(process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET && ['sandbox', 'production'].includes(process.env.CASHFREE_ENV));
const headers = (idempotencyKey) => ({
  'Content-Type': 'application/json', 'x-api-version': apiVersion,
  'x-client-id': process.env.CASHFREE_CLIENT_ID, 'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
  ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {})
});
const customerSchema = z.object({
  fullName: z.string().trim().min(2).max(150), email: z.string().trim().email().max(255),
  phone: z.string().trim().regex(/^[6-9][0-9]{9}$/), aadhaarNumber: z.string().regex(/^[0-9]{12}$/),
  dateOfBirth: z.string().trim().max(10).optional().default(''), fatherName: z.string().trim().max(150).optional().default(''),
  city: z.string().trim().max(100).optional().default(''), state: z.string().trim().max(100).optional().default(''),
  consent: z.literal(true), consentDetails: z.object({
    privacyAccepted: z.literal(true), termsAccepted: z.literal(true),
    privacyVersion: z.string().trim().min(1).max(50), termsVersion: z.string().trim().min(1).max(50)
  }).strict()
}).strict();

async function cashfreeFetch(path, options = {}) {
  const response = await fetch(`${cashfreeBase()}${path}`, { ...options, headers: { ...headers(options.idempotencyKey), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.type || 'Cashfree payment service returned an error.');
    error.status = response.status; error.details = data;
    throw error;
  }
  return data;
}

export const createCashfreeOrder = async (req, res) => {
  if (process.env.CUSTOMER_INTAKE_ENABLED !== 'true') return res.status(503).json({ success: false, message: 'Customer intake is temporarily unavailable.' });
  if (!credentialsReady()) return res.status(503).json({ success: false, message: 'Cashfree Sandbox is not configured. Add Sandbox credentials to the backend environment.' });
  if (!process.env.AADHAAR_ENCRYPTION_KEY) return res.status(503).json({ success: false, message: 'Secure request storage is not configured.' });
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Please check the request details and required consent.', errors: parsed.error.flatten().fieldErrors });
  try {
    const amountPaise = Number(process.env.PANKHOJO_SERVICE_FEE_PAISE || 0);
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) return res.status(503).json({ success: false, message: 'The service fee is not configured.' });
    const customer = parsed.data;
    const paymentReference = `PKC-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const amount = Number((amountPaise / 100).toFixed(2));
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const backendPublicUrl = (process.env.BACKEND_PUBLIC_URL || '').replace(/\/$/, '');
    if (!/^https:\/\//i.test(frontendUrl) && process.env.NODE_ENV === 'production') throw new Error('FRONTEND_URL must be an HTTPS URL in production.');
    if (!/^https:\/\//i.test(backendPublicUrl) && process.env.NODE_ENV === 'production') throw new Error('BACKEND_PUBLIC_URL must be an HTTPS URL in production.');
    const requestPayload = {
      fullName: customer.fullName, email: customer.email, phone: customer.phone,
      dateOfBirth: customer.dateOfBirth, fatherName: customer.fatherName, city: customer.city, state: customer.state,
      aadhaarEncrypted: encryptAadhaar(customer.aadhaarNumber), aadhaarLast4: customer.aadhaarNumber.slice(-4),
      privacyPolicyVersion: customer.consentDetails.privacyVersion, termsVersion: customer.consentDetails.termsVersion
    };
    const orderMeta = {
      return_url: `${frontendUrl}/payment-return?order_id={order_id}`,
      notify_url: `${backendPublicUrl}/api/payments/cashfree/webhook`
    };
    const orderBody = {
      order_id: paymentReference, order_amount: amount, order_currency: 'INR',
      customer_details: { customer_id: `pk_${customer.phone}`, customer_name: customer.fullName, customer_email: customer.email, customer_phone: customer.phone },
      order_meta: orderMeta, order_note: 'PANKhojo existing PAN finding service',
      order_expiry_time: new Date(Date.now() + CHECKOUT_EXPIRY_MINUTES * 60 * 1000).toISOString()
    };
    const cfOrder = await cashfreeFetch('/orders', { method: 'POST', body: JSON.stringify(orderBody), idempotencyKey: randomUUID() });
    if (!cfOrder.payment_session_id) throw new Error('Cashfree did not return a payment session.');
    await insertCashfreeOrder({ paymentReference, amount: amountPaise, customerPayload: requestPayload, gatewayOrderId: cfOrder.order_id, paymentSessionId: cfOrder.payment_session_id });
    return res.status(201).json({ success: true, paymentReference, orderId: cfOrder.order_id, paymentSessionId: cfOrder.payment_session_id, amount: amountPaise, currency: 'INR', environment: process.env.CASHFREE_ENV });
  } catch (error) {
    console.error('Cashfree order creation failed:', error.message, error.details || '');
    return res.status(error.status && error.status < 500 ? error.status : 502).json({ success: false, message: 'Unable to create a secure Cashfree checkout. Please try again.' });
  }
};

// Cashfree order expiry prevents new attempts after five minutes. A pending attempt is
// never failed solely because this local timer elapsed; we require Cashfree's final state.
const CHECKOUT_EXPIRY_MINUTES = 16;

// Browser polling is only a fallback when a webhook has not updated the order.
// Keep this in-process cooldown so one customer refresh cannot call Cashfree repeatedly.
const lastFallbackCheckAt = new Map();
const FALLBACK_CHECK_COOLDOWN_MS = 15000;
const WEBHOOK_GRACE_PERIOD_MS = 12000;

async function reconcileCashfreeOrder(paymentReference) {
  const order = await getCashfreeOrder(paymentReference);
  if (!order) return null;

  const cfOrder = await cashfreeFetch(`/orders/${encodeURIComponent(order.gateway_order_id)}`, { method: 'GET' });
  const payments = await cashfreeFetch(`/orders/${encodeURIComponent(order.gateway_order_id)}/payments`, { method: 'GET' });
  const paymentList = Array.isArray(payments) ? payments : [];

  // Any successful payment wins over earlier failed attempts on the same Cashfree order.
  const successful = paymentList.find((item) => item.payment_status === 'SUCCESS');
  if (successful) {
    return finalizeCashfreePayment({
      paymentReference,
      paymentId: String(successful.cf_payment_id || ''),
      paymentStatus: 'SUCCESS',
      paidAmount: successful.payment_amount,
      paidCurrency: successful.payment_currency || 'INR',
      eventId: null
    });
  }

  const latestAttempt = paymentList.length ? paymentList[paymentList.length - 1] : null;
  if (latestAttempt && ['FAILED', 'USER_DROPPED'].includes(latestAttempt.payment_status)) {
    await markCashfreePaymentFailed({
      paymentReference,
      paymentId: String(latestAttempt.cf_payment_id || ''),
      paymentStatus: latestAttempt.payment_status
    });
    return { updated: false, orderStatus: cfOrder.order_status, paymentStatus: latestAttempt.payment_status };
  }

  if (latestAttempt && ['PENDING', 'NOT_ATTEMPTED', 'INCOMPLETE'].includes(latestAttempt.payment_status)) {
    await markCashfreePaymentPending({
      paymentReference,
      paymentId: String(latestAttempt.cf_payment_id || ''),
      paymentStatus: latestAttempt.payment_status
    });
    return { updated: false, orderStatus: cfOrder.order_status, paymentStatus: latestAttempt.payment_status };
  }

  // A pending/late-authorisation attempt must remain pending even after the order's
  // five-minute window. Cashfree can still report a delayed SUCCESS for an attempt
  // started before expiry. Expire only when Cashfree confirms the order is terminal
  // and there is no in-flight payment attempt.
  if (['EXPIRED', 'TERMINATED'].includes(cfOrder.order_status)) {
    if (!latestAttempt || ['NOT_ATTEMPTED'].includes(latestAttempt.payment_status)) {
      await markCashfreePaymentExpired({ paymentReference, paymentStatus: cfOrder.order_status });
      return { updated: false, orderStatus: cfOrder.order_status, paymentStatus: 'EXPIRED' };
    }
  }

  return { updated: false, orderStatus: cfOrder.order_status, paymentStatus: latestAttempt?.payment_status || 'PENDING' };
}

export const getCashfreePaymentStatus = async (req, res) => {
  const schema = z.object({ email: z.string().trim().email().max(255) }).strict();
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Enter the email address used for this request.' });

  try {
    let status = await getCashfreePublicStatus(req.params.reference, parsed.data.email);
    if (!status) return res.status(404).json({ success: false, message: 'Payment reference and registered email do not match.' });

    // Webhook is the primary source of truth. Only reconcile an order still marked
    // "created" after a short grace period, and no more than once per cooldown.
    if (['created', 'failed', 'expired'].includes(status.status) && credentialsReady()) {
      const createdAt = new Date(status.created_at).getTime();
      const oldEnoughForFallback = Number.isFinite(createdAt) && Date.now() - createdAt >= WEBHOOK_GRACE_PERIOD_MS;
      const lastCheckedAt = lastFallbackCheckAt.get(req.params.reference) || 0;
      const cooldownPassed = Date.now() - lastCheckedAt >= FALLBACK_CHECK_COOLDOWN_MS;

      if (oldEnoughForFallback && cooldownPassed) {
        lastFallbackCheckAt.set(req.params.reference, Date.now());
        try {
          const reconciled = await reconcileCashfreeOrder(req.params.reference);
          if (reconciled?.updated && reconciled.request) {
            await sendPaymentReceiptEmail({
              email: reconciled.request.email,
              fullName: reconciled.request.full_name,
              requestNumber: reconciled.request.request_number,
              paymentId: reconciled.paymentId || '',
              orderId: req.params.reference,
              amount: reconciled.amount,
              currency: reconciled.currency,
              paidAt: new Date()
            }).catch((error) => console.error('Cashfree receipt email failed:', error.message));
            await sendAdminNewRequestEmail({
              fullName: reconciled.request.full_name, email: reconciled.request.email,
              phone: reconciled.request.phone || '', requestNumber: reconciled.request.request_number,
              paymentReference: req.params.reference, paymentId: reconciled.paymentId || '',
              amount: reconciled.amount, currency: reconciled.currency, createdAt: new Date()
            }).catch((error) => console.error('Admin new-request email failed:', error.message));
          }
        } catch (fallbackError) {
          // Do not fail the customer status page just because the fallback API check failed.
          console.error('Cashfree fallback reconciliation failed:', fallbackError.message);
        }
      }
    }

    status = await getCashfreePublicStatus(req.params.reference, parsed.data.email);
    if (!status) return res.status(404).json({ success: false, message: 'Payment reference and registered email do not match.' });

    return res.json({
      success: true,
      payment: {
        paymentReference: status.payment_reference,
        amount: status.amount,
        currency: status.currency,
        status: status.status,
        gatewayPaymentStatus: status.gateway_payment_status,
        transactionId: status.gateway_payment_id || null,
        requestNumber: status.request_number,
        customerName: status.customer_name,
        customerEmail: status.customer_email,
        customerPhone: status.customer_phone,
        createdAt: status.created_at,
        verifiedAt: status.verified_at
      }
    });
  } catch (error) {
    console.error('Cashfree status check failed:', error.message);
    return res.status(502).json({ success: false, message: 'Unable to confirm payment status right now. Please refresh shortly.' });
  }
};

function verifyCashfreeSignature(rawBody, timestamp, signature) {
  if (!process.env.CASHFREE_CLIENT_SECRET || !Buffer.isBuffer(rawBody) || !timestamp || !signature) return false;
  const expected = createHmac('sha256', process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody.toString('utf8')}`).digest('base64');
  const a = Buffer.from(expected); const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const cashfreeWebhook = async (req, res) => {
  const rawBody = req.body;
  const timestamp = req.get('x-webhook-timestamp');
  const signature = req.get('x-webhook-signature');
  if (!verifyCashfreeSignature(rawBody, timestamp, signature)) return res.status(400).send('Invalid webhook signature');
  let event;
  try { event = JSON.parse(rawBody.toString('utf8')); } catch { return res.status(400).send('Invalid webhook JSON'); }
  const paymentReference = event?.data?.order?.order_id;
  const payment = event?.data?.payment;
  if (!paymentReference || !payment?.payment_status) return res.status(200).send('Ignored');
  try {
    if (payment.payment_status === 'SUCCESS') {
      const result = await finalizeCashfreePayment({ paymentReference, paymentId: String(payment.cf_payment_id || ''), paymentStatus: 'SUCCESS', paidAmount: payment.payment_amount, paidCurrency: payment.payment_currency || 'INR', eventId: String(event?.event_id || event?.type || '') });
      if (result.updated && result.request) {
        const emailResult = await sendPaymentReceiptEmail({ email: result.request.email, fullName: result.request.full_name, requestNumber: result.request.request_number, paymentId: String(payment.cf_payment_id || ''), orderId: paymentReference, amount: result.amount, currency: result.currency, paidAt: new Date() }).catch((error) => { console.error('Cashfree receipt email failed:', error.message); return { sent: false }; });
        const adminEmailResult = await sendAdminNewRequestEmail({
          fullName: result.request.full_name, email: result.request.email, phone: result.request.phone || '',
          requestNumber: result.request.request_number, paymentReference, paymentId: String(payment.cf_payment_id || ''),
          amount: result.amount, currency: result.currency, createdAt: new Date()
        }).catch((error) => { console.error('Admin new-request email failed:', error.message); return { sent: false }; });
        console.info('Cashfree payment confirmed; request created. Receipt email sent:', Boolean(emailResult.sent), 'Admin notification sent:', Boolean(adminEmailResult.sent));
      }
    } else if (['FAILED', 'USER_DROPPED'].includes(payment.payment_status)) {
      await markCashfreePaymentFailed({
        paymentReference,
        paymentId: String(payment.cf_payment_id || ''),
        paymentStatus: payment.payment_status,
        eventId: String(event?.event_id || event?.type || '')
      });
    } else if (['PENDING', 'NOT_ATTEMPTED', 'INCOMPLETE'].includes(payment.payment_status)) {
      await markCashfreePaymentPending({
        paymentReference,
        paymentId: String(payment.cf_payment_id || ''),
        paymentStatus: payment.payment_status,
        eventId: String(event?.event_id || event?.type || '')
      });
    }
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Cashfree webhook processing failed:', error.message);
    return res.status(500).send('Webhook processing failed');
  }
};
