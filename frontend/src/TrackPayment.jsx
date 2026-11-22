import { useState } from "react";
import { ArrowLeft, Search, ShieldCheck, Clock3, CheckCircle2, AlertCircle, RefreshCw, CreditCard } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const labels = {
  created: { title: "Payment not yet submitted", tone: "amber", icon: Clock3 },
  expired: { title: "Checkout expired and cancelled", tone: "red", icon: AlertCircle },
  submitted: { title: "Payment verification in progress", tone: "blue", icon: Clock3 },
  verified: { title: "Payment verified", tone: "green", icon: CheckCircle2 },
  paid: { title: "Payment successful", tone: "green", icon: CheckCircle2 },
  rejected: { title: "Payment could not be matched", tone: "red", icon: AlertCircle },
  failed: { title: "Payment not completed", tone: "red", icon: AlertCircle },
};
const dateLabel = value => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function TrackPayment({ onBack }) {
  const [paymentReference, setPaymentReference] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const check = async event => {
    event?.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch(`${API}/api/payments/track`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentReference: paymentReference.trim().toUpperCase(), email: email.trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to find this payment.");
      setResult(data.payment);
    } catch (err) { setError(err.message || "Unable to check payment status."); }
    finally { setBusy(false); }
  };

  const status = result ? (labels[result.status] || labels.created) : null;
  const tone = status?.tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : status?.tone === "red" ? "border-rose-200 bg-rose-50 text-rose-800" : status?.tone === "blue" ? "border-sky-200 bg-sky-50 text-sky-800" : "border-amber-200 bg-amber-50 text-amber-800";
  const Icon = status?.icon || CreditCard;

  return <main className="min-h-screen bg-[#F3F6F9] text-[#17283D]">
    <header className="border-b border-[#E7ECF1] bg-white"><div className="mx-auto flex h-[76px] max-w-5xl items-center justify-between px-5 sm:px-8"><button onClick={onBack} className="flex items-center gap-2 font-semibold text-[#52667D]"><ArrowLeft size={17} />Back to home</button><strong className="text-xl text-[#17365D]">PAN<span className="text-[#16A68A]">Khojo</span></strong></div></header>
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F4F1] text-[#138B76]"><CreditCard size={25} /></span><p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#159B83]">PANKHOJO PAYMENT TRACKING</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17365D]">Track your payment</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#69798D]">Enter the payment reference shown at checkout and the email address used for your PAN-finding request.</p></div>
      <form onSubmit={check} className="rounded-2xl border border-[#E4EAF0] bg-white p-5 shadow-[0_14px_40px_rgba(24,48,76,.055)] sm:p-8">
        <label className="mb-5 block text-sm font-semibold text-[#24364B]">Payment reference<input required value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="PKC-XXXXXXXX" autoComplete="off" className="mt-2 h-12 w-full rounded-xl border border-[#DFE6EE] px-4 font-normal outline-none focus:border-[#159B83]" /></label>
        <label className="mb-6 block text-sm font-semibold text-[#24364B]">Registered email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-2 h-12 w-full rounded-xl border border-[#DFE6EE] px-4 font-normal outline-none focus:border-[#159B83]" /></label>
        <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17365D] px-5 text-sm font-bold text-white disabled:opacity-60"><Search size={17} />{busy ? "Checking…" : "Check payment status"}</button>
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#F3FAF7] p-3 text-xs leading-5 text-[#52716A]"><ShieldCheck size={17} className="mt-0.5 shrink-0" />For privacy, payment details are shown only when both the payment reference and registered email match. Internal admin notes are never displayed.</div>
      </form>
      {result && <section className="mt-6 rounded-2xl border border-[#E4EAF0] bg-white p-5 shadow-sm sm:p-8" aria-live="polite">
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${tone}`}><Icon size={22} className="mt-0.5 shrink-0" /><div><h2 className="font-bold">{status.title}</h2><p className="mt-1 text-sm leading-6">{result.message}</p></div></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-slate-500">Payment reference</p><p className="mt-1 break-all text-sm font-bold text-[#17365D]">{result.paymentReference}</p></div><div><p className="text-xs text-slate-500">Amount</p><p className="mt-1 text-sm font-bold">₹{(Number(result.amount) / 100).toFixed(2)}</p></div><div><p className="text-xs text-slate-500">Created</p><p className="mt-1 text-sm font-semibold">{dateLabel(result.createdAt)}</p></div><div><p className="text-xs text-slate-500">Last update</p><p className="mt-1 text-sm font-semibold">{dateLabel(result.updatedAt)}</p></div></div>
        {result.customerMessage && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Update from PANKhojo</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-950">{result.customerMessage}</p></div>}
        {result.requestNumber && <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-sky-800">PAN-finding request reference</p><p className="mt-1 break-all text-lg font-extrabold text-sky-900">{result.requestNumber}</p><p className="mt-2 text-sm text-sky-800">{(result.status === "verified" || result.status === "paid") ? "Payment is verified. You can track the request using this reference." : result.status === "rejected" ? "This request has been closed following payment review." : "Your request has been created and is awaiting processing."}</p></div>}
        <button type="button" onClick={check} disabled={busy} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#BBD8CD] bg-white px-4 text-sm font-bold text-[#176C5D] disabled:opacity-50"><RefreshCw size={15} />{busy ? "Checking…" : "Refresh payment status"}</button>
        <p className="mt-4 text-center text-xs text-slate-400">If money was debited but the status is not updated, please contact PANKhojo support and do not pay again until the transaction is checked.</p>
      </section>}
      <p className="mt-6 text-center text-xs text-slate-400">PANKhojo is an independent private PAN-finding service.</p>
    </section>
  </main>;
}
