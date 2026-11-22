import { useState } from "react";
import { ArrowLeft, Search, ShieldCheck, Clock3, CheckCircle2, Circle, RefreshCw, Fingerprint } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const labels = {
  en: {
    back: "Back to home", title: "Track your request", intro: "Enter the request reference from your PANKhojo email and the email address registered with your request.",
    reference: "Request reference number", email: "Registered email address", submit: "Track request", loading: "Checking status…",
    privacy: "For your privacy, tracking only displays your request status and milestone dates. It never displays Aadhaar, PAN or internal team notes.",
    notFound: "We could not find a request matching those details. Check your reference and registered email.",
    current: "Current status", submitted: "Request submitted", pending: "Pending", processing: "Processing", completed: "Completed", rejected: "Unable to proceed", cancelled: "This request has been cancelled", customerReason: "Reason shared by PANKhojo", refundPolicy: "Cancellation & refund policy", updated: "Last updated", created: "Submitted on", timeline: "Request progress", retry: "Track another request", steps: ["Request submitted", "Processing", "Completed"]
  },
  hi: {
    back: "होम पर वापस जाएं", title: "अपने अनुरोध की स्थिति देखें", intro: "अपने PANKhojo ईमेल में मिला रेफरेंस नंबर और अनुरोध में दर्ज ईमेल पता भरें।",
    reference: "अनुरोध रेफरेंस नंबर", email: "रजिस्टर्ड ईमेल पता", submit: "स्थिति देखें", loading: "स्थिति जांची जा रही है…",
    privacy: "आपकी गोपनीयता के लिए केवल अनुरोध की स्थिति और तारीखें दिखाई जाती हैं। Aadhaar, PAN या टीम के आंतरिक नोट्स नहीं दिखाए जाते।",
    notFound: "इन विवरणों से अनुरोध नहीं मिला। रेफरेंस नंबर और रजिस्टर्ड ईमेल जांचें।",
    current: "वर्तमान स्थिति", submitted: "अनुरोध जमा हुआ", pending: "लंबित", processing: "प्रोसेसिंग", completed: "पूरा हुआ", rejected: "आगे नहीं बढ़ सके", cancelled: "यह अनुरोध रद्द कर दिया गया है", customerReason: "PANKhojo द्वारा बताया गया कारण", refundPolicy: "रद्दीकरण और रिफंड नीति", updated: "आखिरी अपडेट", created: "जमा करने की तारीख", timeline: "अनुरोध की प्रगति", retry: "दूसरा अनुरोध ट्रैक करें", steps: ["अनुरोध जमा हुआ", "प्रोसेसिंग", "पूरा हुआ"]
  }
};

const statusLabel = (status, t) => t[status] || status;
const dateLabel = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function TrackRequest({ language = "en", onBack }) {
  const t = labels[language] || labels.en;
  const [requestNumber, setRequestNumber] = useState("");
  const [email, setEmail] = useState("");
  const [tracking, setTracking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setError(""); setTracking(null);
    try {
      const response = await fetch(`${API}/api/tracking`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestNumber: requestNumber.trim().toUpperCase(), email: email.trim() })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || t.notFound);
      setTracking(data.tracking);
    } catch (err) { setError(err.message || t.notFound); }
    finally { setBusy(false); }
  };

  const history = tracking?.history || [];
  const isRejected = tracking?.status === "rejected";
  const isCancelled = tracking?.status === "cancelled";
  const activeIndex = tracking?.status === "pending" ? 0 : tracking?.status === "processing" ? 1 : tracking?.status === "completed" ? 2 : -1;

  return <main className="min-h-screen bg-[#F3F6F9] text-[#17283D]">
    <header className="border-b border-[#E7ECF1] bg-white"><div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8"><button onClick={onBack} className="flex items-center gap-2 font-semibold text-[#52667D]"><ArrowLeft size={17} />{t.back}</button><strong className="text-xl text-[#17365D]">PAN<span className="text-[#16A68A]">Khojo</span></strong></div></header>
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F4F1] text-[#138B76]"><Search size={25} /></span><p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#159B83]">PANKHOJO REQUEST TRACKING</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17365D]">{t.title}</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#69798D]">{t.intro}</p></div>
      <form onSubmit={submit} className="rounded-2xl border border-[#E4EAF0] bg-white p-5 shadow-[0_14px_40px_rgba(24,48,76,.055)] sm:p-8">
        <label className="mb-5 block text-sm font-semibold text-[#24364B]">{t.reference}<input required value={requestNumber} onChange={e => setRequestNumber(e.target.value)} placeholder="PK-XXXXXXXX" autoComplete="off" className="mt-2 h-12 w-full rounded-xl border border-[#DFE6EE] px-4 font-normal outline-none focus:border-[#159B83]" /></label>
        <label className="mb-6 block text-sm font-semibold text-[#24364B]">{t.email}<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-2 h-12 w-full rounded-xl border border-[#DFE6EE] px-4 font-normal outline-none focus:border-[#159B83]" /></label>
        <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17365D] px-5 text-sm font-bold text-white transition hover:bg-[#244C79] disabled:opacity-60"><Search size={17} />{busy ? t.loading : t.submit}</button>
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#F3FAF7] p-3 text-xs leading-5 text-[#52716A]"><ShieldCheck size={17} className="mt-0.5 shrink-0" />{t.privacy}</div>
      </form>
      {tracking && <section className="mt-6 rounded-2xl border border-[#E4EAF0] bg-white p-5 shadow-sm sm:p-8" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.reference}</p><h2 className="mt-1 text-xl font-extrabold text-[#17365D]">{tracking.requestNumber}</h2></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${isRejected ? "bg-rose-50 text-rose-700" : isCancelled ? "bg-slate-100 text-slate-700" : "bg-[#EAF6F3] text-[#137B69]"}`}>{statusLabel(tracking.status, t)}</span></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-slate-500">{t.created}</p><p className="mt-1 text-sm font-semibold">{dateLabel(tracking.createdAt)}</p></div><div><p className="text-xs text-slate-500">{t.updated}</p><p className="mt-1 text-sm font-semibold">{dateLabel(tracking.updatedAt)}</p></div></div>
        {tracking.paymentStatus === "submitted" && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-900">Payment verification pending</p><p className="mt-1 text-xs leading-5 text-amber-800">Your request reference has been created. Our team will verify the UTR against the business bank account before request processing begins.</p></div>}
        {tracking.paymentStatus === "verified" && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-900">Payment verified</p><p className="mt-1 text-xs leading-5 text-emerald-800">Your request is ready for processing.</p></div>}
        <h3 className="mt-7 font-bold text-[#17365D]">{t.timeline}</h3>
        {(isRejected || isCancelled) ? <><div className={`mt-4 flex items-center gap-3 rounded-xl p-4 text-sm font-semibold ${isRejected ? "bg-rose-50 text-rose-800" : "bg-slate-100 text-slate-700"}`}><Circle size={18} />{isRejected ? t.rejected : t.cancelled}</div>{tracking.customerMessage && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-800">{t.customerReason}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-950">{tracking.customerMessage}</p></div>}<a href="/refund-policy" className="mt-4 inline-flex text-sm font-bold text-[#176C5D] underline underline-offset-4">{t.refundPolicy}</a></> : <div className="mt-5 grid gap-3 sm:grid-cols-3">{t.steps.map((step, index) => { const reached = index <= activeIndex; const event = history.find(item => item.status === (index === 0 ? "pending" : index === 1 ? "processing" : "completed")); return <div key={step} className={`rounded-xl border p-4 ${reached ? "border-[#B9DED4] bg-[#F3FAF7]" : "border-slate-200 bg-slate-50"}`}><div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full ${reached ? "bg-[#D9F0E9] text-[#137B69]" : "bg-white text-slate-400"}`}>{reached ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}</div><p className={`text-sm font-bold ${reached ? "text-[#176C5D]" : "text-slate-400"}`}>{step}</p><p className="mt-1 text-xs text-slate-500">{event ? dateLabel(event.changed_at) : index === 0 ? dateLabel(tracking.createdAt) : "—"}</p></div> })}</div>}
        <button type="button" onClick={() => { setTracking(null); setRequestNumber(""); setEmail(""); setError(""); }} className="mt-6 flex items-center gap-2 text-sm font-bold text-[#176C5D]"><RefreshCw size={15} />{t.retry}</button>
      </section>}
      <p className="mt-6 text-center text-xs leading-5 text-slate-400"><Fingerprint size={14} className="mr-1 inline" />PANKhojo is an independent private PAN-finding service.</p>
    </section>
  </main>;
}
