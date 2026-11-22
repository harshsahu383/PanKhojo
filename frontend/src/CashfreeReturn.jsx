import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle, Mail, ReceiptText } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function readSavedCheckout() {
  try {
    return JSON.parse(sessionStorage.getItem('pankhojo_cashfree_payment') || '{}');
  } catch {
    return {};
  }
}

export default function CashfreeReturn() {
  const saved = useMemo(readSavedCheckout, []);
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id') || (saved.paymentReference || '');
  const [email, setEmail] = useState(() => saved.paymentReference === orderId ? saved.email || '' : '');
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [autoChecking, setAutoChecking] = useState(Boolean(orderId && saved.email && saved.paymentReference === orderId));

  const check = useCallback(async ({ quiet = false } = {}) => {
    if (!orderId || !email) return;
    if (!quiet) setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/payments/cashfree/status/${encodeURIComponent(orderId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to verify payment with Cashfree.');
      setPayment(data.payment || null);
      // A failed attempt can be followed by a successful retry on the same Cashfree order.
      // Keep checking our database briefly so a late success webhook can update this page.
      if (data.payment?.status === 'paid') {
        setAutoChecking(false);
      }
    } catch (err) {
      if (!quiet) setError(err.message || 'Unable to check payment status.');
    } finally {
      if (!quiet) setBusy(false);
    }
  }, [orderId, email]);

  useEffect(() => {
    if (!autoChecking || !orderId || !email) return undefined;
    let pollCount = 0;
    check({ quiet: true });
    const timer = window.setInterval(() => {
      pollCount += 1;
      if (pollCount >= 12) {
        window.clearInterval(timer);
        setAutoChecking(false);
        return;
      }
      check({ quiet: true });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [autoChecking, orderId, email, check]);

  const paid = payment?.status === 'paid';
  const failed = ['failed', 'expired'].includes(payment?.status);
  const pending = payment?.status === 'created' || ['PENDING', 'NOT_ATTEMPTED', 'INCOMPLETE'].includes(payment?.gatewayPaymentStatus);
  const stillChecking = !paid && autoChecking;

  return (
    <main className="min-h-screen bg-[#F5F8FA] px-4 py-10 text-[#24364B] sm:py-14">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-[#E0E8EF] bg-white shadow-[0_18px_55px_rgba(23,54,93,.08)]">
        <div className={`px-6 py-8 text-center sm:px-10 ${paid ? 'bg-gradient-to-br from-[#EAF8F1] to-white' : failed ? 'bg-gradient-to-br from-[#FFF0F0] to-white' : 'bg-gradient-to-br from-[#EEF5FB] to-white'}`}>
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${paid ? 'bg-emerald-100 text-emerald-700' : failed ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
            {paid ? <CheckCircle2 size={31} /> : failed ? <XCircle size={31} /> : <Clock3 size={31} />}
          </span>
          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#159B83]">PANKHOJO PAYMENT CONFIRMATION</p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#17365D] sm:text-3xl">
            {paid ? 'We have received your request!' : failed ? 'Payment was not completed' : pending ? 'Your payment is pending' : 'Confirming your payment'}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#69798D]">
            {paid
              ? 'Your payment has been verified by Cashfree and your PAN-finding request has been created.'
              : failed
                ? 'Cashfree has not confirmed a successful payment. If your account was debited, please contact support before paying again.'
                : pending
                  ? 'We have received your payment attempt. Cashfree is still processing the result. Keep this page open; we will refresh the status automatically for up to one minute.'
                  : 'We are checking your payment directly with Cashfree. Please keep this page open for a moment.'}
          </p>
        </div>

        <div className="space-y-5 px-5 py-6 sm:px-9 sm:py-8">
          <div className="rounded-2xl border border-[#E2EAF0] bg-[#F7F9FB] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#718198]"><ReceiptText size={15} /> Payment details</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs text-[#718198]">PANKhojo payment reference</p><p className="mt-1 break-all text-sm font-extrabold text-[#17365D]">{payment?.paymentReference || orderId || '—'}</p></div>
              <div><p className="text-xs text-[#718198]">Cashfree transaction ID</p><p className="mt-1 break-all text-sm font-extrabold text-[#17365D]">{payment?.transactionId || (paid ? 'Updating' : 'Available after confirmation')}</p></div>
              {payment?.amount != null && <div><p className="text-xs text-[#718198]">Amount paid</p><p className="mt-1 text-sm font-extrabold text-[#17365D]">₹{(Number(payment.amount) / 100).toFixed(2)}</p></div>}
              <div><p className="text-xs text-[#718198]">Current payment status</p><p className={`mt-1 text-sm font-extrabold ${paid ? 'text-emerald-700' : failed ? 'text-rose-700' : 'text-amber-700'}`}>{paid ? 'Successful' : failed ? 'Failed' : payment?.gatewayPaymentStatus || 'Pending confirmation'}</p></div>
              {payment?.verifiedAt && <div><p className="text-xs text-[#718198]">Payment verified</p><p className="mt-1 text-sm font-semibold text-[#17365D]">{new Date(payment.verifiedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>}
            </div>
          </div>

          {payment?.customerName && (
            <div className="rounded-2xl border border-[#E2EAF0] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#718198]">Request details submitted</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div><p className="text-xs text-[#718198]">Customer name</p><p className="mt-1 break-words text-sm font-semibold text-[#17365D]">{payment.customerName}</p></div>
                <div><p className="text-xs text-[#718198]">Registered email</p><p className="mt-1 break-all text-sm font-semibold text-[#17365D]">{payment.customerEmail}</p></div>
                <div><p className="text-xs text-[#718198]">Mobile number</p><p className="mt-1 text-sm font-semibold text-[#17365D]">{payment.customerPhone}</p></div>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#718198]">Your Aadhaar number is not displayed here.</p>
            </div>
          )}

          {pending && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <p className="font-bold">Your payment is being processed.</p>
              <p className="mt-2">Your submitted details are saved against this payment reference. We are waiting for Cashfree's final confirmation. A PAN-finding request number will be generated only after successful payment confirmation.</p>
              <p className="mt-2 text-xs">Please do not make another payment while this transaction is pending. If the page does not update within one minute, use the Check payment status button.</p>
            </div>
          )}

          {paid && (
            <>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">Your PAN-finding request number</p>
                <p className="mt-2 break-all text-2xl font-extrabold text-emerald-950">{payment.requestNumber || 'Request created'}</p>
                <div className="mt-4 flex items-start gap-3 border-t border-emerald-200 pt-4">
                  <Mail size={20} className="mt-0.5 shrink-0 text-emerald-800" />
                  <div>
                    <p className="font-bold text-emerald-950">What happens next?</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">
                      We have received your request. Our team will process it, and you should receive your existing PAN at your registered email address within 1–2 working days. The PAN will be sent as a password-protected PDF.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-emerald-800">Please check your inbox and spam folder. Your PAN will not be displayed on this page.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-[#F4F7FA] p-4 text-sm text-[#52667D]">
                <p><strong>Confirmation email:</strong> A payment receipt and request reference will be sent to your registered email address.</p>
                {email && <p className="mt-1 break-all">{email}</p>}
              </div>
            </>
          )}

          {failed && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-900">
              <p className="font-bold">This payment attempt was not successful.</p>
              <p className="mt-2">Cashfree has reported the payment as {payment.gatewayPaymentStatus || 'failed'}. No PAN-finding request has been created for this unsuccessful payment.</p>
              <p className="mt-2">If your bank account was debited, please do not pay again immediately. Keep the payment reference and contact PANKhojo support so the transaction can be checked.</p>
            </div>
          )}

          {!paid && !failed && (
            <form onSubmit={(event) => { event.preventDefault(); setAutoChecking(false); check(); }} className="space-y-4">
              {!email && <label className="block text-sm font-semibold text-[#24364B]">Registered email address<input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#DCE5ED] px-4 outline-none focus:border-[#159B83]" placeholder="you@example.com" /></label>}
              <button disabled={busy || !orderId || !email} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17365D] text-sm font-bold text-white disabled:opacity-50">
                <RefreshCw size={16} />{busy ? 'Checking with Cashfree…' : stillChecking ? 'Checking payment automatically…' : 'Check payment status'}
              </button>
            </form>
          )}

          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {stillChecking && <p className="flex items-start gap-2 text-xs leading-5 text-[#718198]"><ShieldCheck size={16} className="shrink-0 text-[#159B83]" />{failed ? 'We received a failed-attempt update. We are briefly checking for any later successful retry before closing this confirmation.' : 'Cashfree webhooks are the primary confirmation source. This page refreshes your saved payment details every 5 seconds; backend reconciliation is used only if the webhook is delayed.'}</p>}
          {!paid && !autoChecking && <p className="text-xs leading-5 text-[#718198]">Automatic checking has paused. You can check again manually. If your bank account was debited, do not make another payment until the first transaction is confirmed.</p>}

          <button type="button" onClick={() => window.location.assign('/')} className="h-11 w-full rounded-xl border border-[#DCE5ED] bg-white text-sm font-bold text-[#52667D]">Return to PANKhojo</button>
        </div>
      </section>
    </main>
  );
}
