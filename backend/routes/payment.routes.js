import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateAdmin } from '../middleware/auth.middleware.js';
import { createManualPayment, submitManualPayment, checkCustomerPaymentStatus, trackCustomerPayment, getManualPayments, decideManualPayment } from '../controllers/payment.controller.js';
import { createCashfreeOrder, getCashfreePaymentStatus } from '../controllers/cashfree.controller.js';
const router = Router();
const createOrderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { success: false, message: 'Too many payment attempts. Please try again after 15 minutes.' }
});
const paymentStatusLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { success: false, message: 'Too many status checks. Please wait a moment and try again.' }
});
const legacyPaymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { success: false, message: 'Too many payment attempts. Please try again later.' }
});
// Cashfree webhooks are handled before JSON parsing in server.js and are not browser-rate-limited here.
// Cashfree checkout creation and status polling have separate limits.
router.post('/cashfree/create-order', createOrderLimiter, createCashfreeOrder);
router.post('/cashfree/status/:reference', paymentStatusLimiter, getCashfreePaymentStatus);
// Manual UPI routes remain temporarily for legacy records only.
router.post('/create-manual', legacyPaymentLimiter, createManualPayment);
router.post('/submit-manual', legacyPaymentLimiter, submitManualPayment);
router.post('/status-manual', legacyPaymentLimiter, checkCustomerPaymentStatus);
router.post('/track', legacyPaymentLimiter, trackCustomerPayment);
router.get('/admin', authenticateAdmin, getManualPayments);
router.patch('/admin/:reference', authenticateAdmin, decideManualPayment);
export default router;
