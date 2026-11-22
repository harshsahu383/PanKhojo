import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Activity, ArrowDownUp, BadgeCheck, CalendarDays, CheckCircle2, ChevronDown,
    Clock3, FileSearch, Fingerprint, LayoutDashboard, LogOut, Mail, MapPin,
    Phone, RefreshCw, Search, ShieldCheck, SlidersHorizontal, UserRound,
    Users, X, AlertCircle, Eye, LoaderCircle, ClipboardList, Ban, MessageSquareText,
    Check, AlertTriangle
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const statuses = ["pending", "processing", "completed", "rejected", "cancelled"];

const statusStyles = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    processing: "bg-sky-50 text-sky-700 ring-sky-200",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-rose-50 text-rose-700 ring-rose-200",
    cancelled: "bg-slate-100 text-slate-700 ring-slate-300",
    expired: "bg-rose-50 text-rose-700 ring-rose-200",
};

const prettyStatus = (value = "") =>
    value.charAt(0).toUpperCase() + value.slice(1);

const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
};

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status] || "bg-slate-100 text-slate-600 ring-slate-200"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === "completed" ? "bg-emerald-500" : status === "processing" ? "bg-sky-500" : status === "rejected" ? "bg-rose-500" : status === "cancelled" ? "bg-slate-500" : status === "expired" ? "bg-rose-500" : "bg-amber-500"}`} />
            {prettyStatus(status)}
        </span>
    );
}

function MetricCard({ label, value, hint, icon: Icon, tone }) {
    const tones = {
        navy: "bg-[#edf2fa] text-[#17365d]",
        amber: "bg-amber-50 text-amber-700",
        blue: "bg-sky-50 text-sky-700",
        green: "bg-emerald-50 text-emerald-700",
        rose: "bg-rose-50 text-rose-700",
    };
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,35,65,0.035)]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-[#172b45]">{value}</p>
                    <p className="mt-1 text-xs text-slate-400">{hint}</p>
                </div>
                <span className={`rounded-xl p-3 ${tones[tone] || tones.navy}`}><Icon size={19} /></span>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [token, setToken] = useState(() => sessionStorage.getItem("pk_admin_token") || "");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [admin, setAdmin] = useState(null);
    const [requests, setRequests] = useState([]);
    const [payments, setPayments] = useState([]);
    const [paymentBusy, setPaymentBusy] = useState(false);
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [selected, setSelected] = useState(null);
    const [logs, setLogs] = useState([]);
    const [revealedAadhaar, setRevealedAadhaar] = useState("");
    const [revealBusy, setRevealBusy] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [activeTab, setActiveTab] = useState("requests");
    const [statusEditor, setStatusEditor] = useState(null);
    const [statusRemark, setStatusRemark] = useState("");
    const [customerMessage, setCustomerMessage] = useState("");
    const [panNumber, setPanNumber] = useState("");

    const call = async (path, options = {}) => {
        const response = await fetch(`${API}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers || {}),
            },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Request failed");
        return data;
    };

    const load = useCallback(async (overrides = {}) => {
        setBusy(true);
        setError("");
        try {
            const activeStatus = overrides.status !== undefined ? overrides.status : (activeTab === "remarks" ? "" : status);
            const activeSearch = overrides.search ?? submittedSearch;
            const query = new URLSearchParams({ limit: "100" });
            if (activeStatus) query.set("status", activeStatus);
            if (activeSearch.trim()) query.set("search", activeSearch.trim());
            const data = await call(`/api/requests?${query.toString()}`);
            setRequests(data.requests || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }, [token, status, submittedSearch, activeTab]);

    useEffect(() => {
        if (!token) return;
        call("/api/admin/profile")
            .then((data) => setAdmin(data.admin))
            .catch(() => {
                sessionStorage.removeItem("pk_admin_token");
                setToken("");
            });
    }, []);

    const loadPayments = useCallback(async () => {
        setPaymentBusy(true);
        try { const data = await call("/api/payments/admin"); setPayments(data.payments || []); }
        catch (err) { setError(err.message); }
        finally { setPaymentBusy(false); }
    }, [token]);

    const decidePayment = async (payment, decision) => {
        const message = decision === "verify"
            ? `Confirm that ₹${(payment.amount / 100).toFixed(2)} is visible as a settled credit in the PANKhojo bank account for UTR ${payment.customer_utr}?`
            : payment.status === "created" ? "Close this payment as not received? Confirm that no matching credit is visible in the bank account." : "Reject this payment submission?";
        if (!window.confirm(message)) return;
        const customerMessage = decision === "reject"
            ? (window.prompt("Customer-facing update (do not include internal notes):", "We could not match this payment in the merchant bank account. If money was debited, please contact support with your UTR.") || "").trim()
            : "Your payment has been verified and your PAN-finding request is ready for processing.";
        if (decision === "reject" && customerMessage.length < 5) { setError("Please provide a customer-facing explanation before rejecting the payment."); return; }
        try {
            const data = await call(`/api/payments/admin/${encodeURIComponent(payment.payment_reference)}`, {
                method: "PATCH", body: JSON.stringify({ decision, adminRemark: decision === "verify" ? "Verified against bank credit" : "Could not match payment in bank account", customerMessage })
            });
            setNotice(data.message);

            await loadPayments();
            await load();

            setActiveTab("requests");
        } catch (err) { setError(err.message); }
    };

    useEffect(() => {
        if (!admin) return;
        if (activeTab === "payments") loadPayments();
        else load();
    }, [admin, status, submittedSearch, activeTab, load, loadPayments]);

    const login = async (event) => {
        event.preventDefault();
        setError("");
        try {
            const data = await call("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            sessionStorage.setItem("pk_admin_token", data.token);
            setToken(data.token);
            setAdmin(data.admin);
            setPassword("");
        } catch (err) {
            setError(err.message);
        }
    };

    const openRequest = async (id) => {
        setError("");
        try {
            const data = await call(`/api/requests/${id}`);
            setSelected(data.request);
            setLogs(data.logs || []);
            setRevealedAadhaar("");
        } catch (err) {
            setError(err.message);
        }
    };

    const revealAadhaar = async () => {
        if (!selected) return;
        setRevealBusy(true);
        setError("");
        try {
            const data = await call(`/api/requests/${selected.id}/reveal-aadhaar`, { method: "POST" });
            setRevealedAadhaar(data.aadhaarNumber || "");
            const fresh = await call(`/api/requests/${selected.id}`);
            setLogs(fresh.logs || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setRevealBusy(false);
        }
    };

    const openStatusEditor = (request, nextStatus = request.status) => {
        setStatusRemark("");
        setCustomerMessage("");
        setPanNumber("");
        setStatusEditor({ request, nextStatus });
    };

    const updateStatus = async () => {
        if (!statusEditor) return;
        const { request, nextStatus } = statusEditor;
        const needsReason = ["rejected", "cancelled"].includes(nextStatus);
        if (nextStatus === "completed" && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber.trim().toUpperCase())) { setError("Enter a valid 10-character PAN number before completing the request."); return; }
        if (needsReason && (statusRemark.trim().length < 5 || customerMessage.trim().length < 5)) {
            setError("Add both an internal remark and a customer-facing reason (at least 5 characters each).");
            return;
        }
        setUpdatingId(request.id);
        setError("");
        setNotice("");
        try {
            await call(`/api/requests/${request.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({
                    status: nextStatus,
                    description: statusRemark.trim() || `Status changed to ${nextStatus} from admin dashboard`,
                    customerMessage: customerMessage.trim(),
                    ...(nextStatus === "completed" ? { panNumber: panNumber.trim().toUpperCase() } : {}),
                }),
            });
            setNotice(`Request ${request.request_number} updated to ${prettyStatus(nextStatus)}.`);
            setStatusEditor(null);
            setStatusRemark("");
            setCustomerMessage("");
            setPanNumber("");
            await load({ status: activeTab === "remarks" ? "" : status });
            if (selected?.id === request.id) await openRequest(request.id);
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const logout = () => {
        sessionStorage.removeItem("pk_admin_token");
        setToken("");
        setAdmin(null);
        setRequests([]);
        setSelected(null);
        setRevealedAadhaar("");
    };

    const counts = useMemo(() => ({
        total: requests.length,
        pending: requests.filter((item) => item.status === "pending").length,
        processing: requests.filter((item) => item.status === "processing").length,
        completed: requests.filter((item) => item.status === "completed").length,
        rejected: requests.filter((item) => item.status === "rejected").length,
        cancelled: requests.filter((item) => item.status === "cancelled").length,
    }), [requests]);

    const visibleRequests = useMemo(() => activeTab === "remarks"
        ? requests.filter((item) => ["rejected", "cancelled"].includes(item.status))
        : requests, [requests, activeTab]);

    const applySearch = (event) => {
        event.preventDefault();
        setSubmittedSearch(search);
    };

    if (!admin) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-4 py-10">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(20,42,75,0.12)] md:grid-cols-2">
                    <div className="relative hidden flex-col justify-between overflow-hidden bg-[#142d4e] p-10 text-white md:flex">
                        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[36px] border-white/5" />
                        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full border-[42px] border-teal-300/10" />
                        <div className="relative">
                            <div className="flex items-center gap-3">
                                <span className="rounded-2xl bg-white/10 p-3"><Fingerprint size={26} /></span>
                                <div><p className="text-lg font-extrabold tracking-tight">PANKhojo</p><p className="text-xs text-blue-100/70">ADMIN WORKSPACE</p></div>
                            </div>
                            <div className="mt-24 max-w-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-300">Operations portal</p>
                                <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">Your requests.<br />One clear view.</h1>
                                <p className="mt-5 text-sm leading-6 text-blue-100/75">Manage customer requests, track progress and keep every update organised from one secure workspace.</p>
                            </div>
                        </div>
                        <div className="relative flex items-center gap-2 text-xs text-blue-100/60"><ShieldCheck size={15} /> Secure administrator access</div>
                    </div>
                    <div className="p-7 sm:p-10 md:p-12">
                        <div className="mb-9 md:hidden">
                            <div className="flex items-center gap-3 text-[#17365d]"><span className="rounded-xl bg-[#edf2fa] p-2.5"><Fingerprint /></span><span className="text-lg font-extrabold">PANKhojo Admin</span></div>
                        </div>
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#159b83]">Welcome back</p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#172b45]">Administrator sign in</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the administrator account created by your backend setup script.</p>
                        </div>
                        <form onSubmit={login} className="space-y-5">
                            <label className="block text-sm font-semibold text-slate-700">Email address
                                <span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 focus-within:border-teal-600 focus-within:bg-white">
                                    <Mail size={17} className="text-slate-400" />
                                    <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" className="w-full bg-transparent text-sm font-normal outline-none" />
                                </span>
                            </label>
                            <label className="block text-sm font-semibold text-slate-700">Password
                                <span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 focus-within:border-teal-600 focus-within:bg-white">
                                    <ShieldCheck size={17} className="text-slate-400" />
                                    <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="w-full bg-transparent text-sm font-normal outline-none" />
                                </span>
                            </label>
                            {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
                            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17365d] text-sm font-bold text-white shadow-lg shadow-[#17365d]/15 transition hover:bg-[#102744] focus:outline-none focus:ring-4 focus:ring-teal-500/20">Sign in to dashboard <ChevronDown size={16} className="-rotate-90" /></button>
                        </form>
                        <p className="mt-8 text-center text-xs text-slate-400">PANKhojo · Secure operations workspace</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f7fb] text-[#172b45]">
            <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col bg-[#142d4e] text-white lg:flex">
                <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
                    <span className="rounded-xl bg-white/10 p-2.5 text-teal-300"><Fingerprint size={23} /></span>
                    <div><p className="font-extrabold tracking-tight">PANKhojo</p><p className="text-[10px] font-semibold tracking-[0.18em] text-blue-100/50">ADMIN CONSOLE</p></div>
                </div>
                <div className="px-4 pt-8">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100/40">Workspace</p>
                    <div className="mt-3 space-y-1">
                        <button onClick={() => setActiveTab("requests")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${activeTab === "requests" ? "bg-white/10 text-white" : "text-blue-100/65 hover:bg-white/5 hover:text-white"}`}><LayoutDashboard size={17} className="text-teal-300" /> Requests overview</button>
                        <button onClick={() => { setActiveTab("remarks"); setStatus(""); setSubmittedSearch(""); setSearch(""); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${activeTab === "remarks" ? "bg-white/10 text-white" : "text-blue-100/65 hover:bg-white/5 hover:text-white"}`}><MessageSquareText size={17} className="text-rose-300" /> Remarks & decisions</button>
                        <button onClick={() => setActiveTab("payments")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${activeTab === "payments" ? "bg-white/10 text-white" : "text-blue-100/65 hover:bg-white/5 hover:text-white"}`}><ShieldCheck size={17} className="text-amber-300" /> Payment verification</button>
                    </div>
                </div>
                <div className="mt-auto border-t border-white/10 p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-400/15 text-sm font-bold text-teal-200">{(admin.name || "A").slice(0, 1).toUpperCase()}</div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{admin.name}</p><p className="text-xs text-blue-100/50">Administrator</p></div>
                    </div>
                    <button onClick={logout} className="mt-5 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-blue-100/70 transition hover:bg-white/10 hover:text-white"><LogOut size={16} /> Sign out</button>
                </div>
            </aside>

            <div className="lg:pl-[248px]">
                <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                    <div className="flex min-h-[72px] items-center justify-between px-4 sm:px-7 lg:px-9">
                        <div className="flex items-center gap-3">
                            <span className="rounded-xl bg-[#edf2fa] p-2 text-[#17365d] lg:hidden"><Fingerprint size={20} /></span>
                            <div><p className="text-sm font-bold text-[#172b45]">Operations dashboard</p><p className="text-xs text-slate-500">Manage and track customer requests</p></div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <span className="hidden text-right sm:block"><span className="block text-xs font-semibold text-slate-700">{admin.name}</span><span className="text-[11px] text-slate-400">Administrator</span></span>
                            <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 lg:hidden"><LogOut size={15} /> Logout</button>
                            <button onClick={() => load()} disabled={busy} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={15} className={busy ? "animate-spin" : ""} /> <span className="hidden sm:inline">Refresh</span></button>
                        </div>
                    </div>
                </header>
                <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-3 py-2.5 lg:hidden">
                    <button onClick={() => setActiveTab("requests")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === "requests" ? "bg-[#edf2fa] text-[#17365d]" : "text-slate-500 hover:bg-slate-50"}`}><LayoutDashboard size={14} /> Requests</button>
                    <button onClick={() => { setActiveTab("remarks"); setStatus(""); setSubmittedSearch(""); setSearch(""); }} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === "remarks" ? "bg-rose-50 text-rose-700" : "text-slate-500 hover:bg-slate-50"}`}><MessageSquareText size={14} /> Remarks</button>
                    <button onClick={() => setActiveTab("payments")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === "payments" ? "bg-amber-50 text-amber-700" : "text-slate-500 hover:bg-slate-50"}`}><ShieldCheck size={14} /> Payments</button>
                </div>

                <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
                    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#159b83]">{activeTab === "remarks" ? "Operations · Remarks" : activeTab === "payments" ? "Finance · Verification" : "Overview"}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172b45] sm:text-[30px]">{activeTab === "remarks" ? "Remarks & decisions" : activeTab === "payments" ? "Payment verification" : `Good to see you, ${admin.name?.split(" ")[0] || "Admin"}`}</h1><p className="mt-1.5 text-sm text-slate-500">{activeTab === "remarks" ? "Review the internal reasons recorded for rejected and cancelled applications." : activeTab === "payments" ? "Match each submitted UPI reference against actual bank credits before approving a request." : "Here’s what’s happening with your customer requests."}</p></div>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500"><CalendarDays size={15} /> {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</div>
                    </div>

                    {error && <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}
                    {notice && <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={17} />{notice}<button onClick={() => setNotice("")} className="ml-auto"><X size={16} /></button></div>}

                    {activeTab === "requests" && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard label="Requests shown" value={counts.total} hint="Based on current filters" icon={Users} tone="navy" />
                        <MetricCard label="Pending" value={counts.pending} hint="Awaiting action" icon={Clock3} tone="amber" />
                        <MetricCard label="In progress" value={counts.processing} hint="Currently being handled" icon={Activity} tone="blue" />
                        <MetricCard label="Completed" value={counts.completed} hint="Successfully completed" icon={BadgeCheck} tone="green" />
                    </div>}

                    {activeTab !== "payments" && <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,35,65,0.035)]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                            <div><h2 className="text-base font-bold text-[#172b45]">{activeTab === "remarks" ? "Rejected & cancelled applications" : "Customer requests"}</h2><p className="mt-1 text-xs text-slate-500">{activeTab === "remarks" ? "Internal decision reasons · not visible to customers" : `${requests.length} result${requests.length === 1 ? "" : "s"} in this view`}</p></div>
                            <div className="flex items-center gap-2 text-xs text-slate-400"><SlidersHorizontal size={15} /> {activeTab === "remarks" ? "Decision records" : "Filters & search"}</div>
                        </div>
                        {activeTab === "requests" && <form onSubmit={applySearch} className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:px-6">
                            <div className="flex h-11 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10">
                                <Search size={17} className="shrink-0 text-slate-400" />
                                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or request ID..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
                                {search && <button type="button" onClick={() => { setSearch(""); setSubmittedSearch(""); }} className="text-slate-400 hover:text-slate-700"><X size={15} /></button>}
                            </div>
                            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-teal-500">
                                <option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{prettyStatus(item)}</option>)}
                            </select>
                            <button type="submit" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#17365d] px-5 text-sm font-semibold text-white transition hover:bg-[#102744]"><Search size={15} /> Search</button>
                        </form>}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-white text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                    <tr><th className="px-6 py-4">Request details</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">{activeTab === "remarks" ? "Decision reason" : "Contact"}</th><th className="px-5 py-4">Submitted</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Action</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {visibleRequests.map((request) => (
                                        <tr key={request.id} className="transition hover:bg-[#f8fafc]">
                                            <td className="px-6 py-4"><p className="font-bold text-[#17365d]">{request.request_number}</p><p className="mt-1 text-[11px] text-slate-400">Request ID</p></td>
                                            <td className="px-5 py-4"><p className="font-semibold text-slate-800">{request.full_name}</p><p className="mt-1 text-xs text-slate-400">Customer</p></td>
                                            <td className="px-5 py-4">{activeTab === "remarks" ? <><p className="max-w-[360px] whitespace-normal text-sm leading-5 text-slate-700">{request.latest_status_remark || "No reason recorded"}</p><p className="mt-1 text-xs text-slate-400">Internal remark</p></> : <><p className="text-slate-700">{request.email}</p><p className="mt-1 text-xs text-slate-400">{request.phone}</p></>}</td>
                                            <td className="px-5 py-4 text-xs text-slate-500">{formatDate(request.created_at)}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col items-start gap-2">
                                                    <StatusBadge status={request.status} />
                                                    {activeTab === "requests" && <button onClick={() => openStatusEditor(request)} disabled={updatingId === request.id || Boolean(request.payment_status && !["verified", "paid"].includes(request.payment_status))} title={request.payment_status && !["verified", "paid"].includes(request.payment_status) ? "Payment must be verified before processing this request." : "Update request status"} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-40"><SlidersHorizontal size={12} /> {request.payment_status && !["verified", "paid"].includes(request.payment_status) ? "Payment pending" : "Update status"}</button>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right"><button onClick={() => openRequest(request.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-[#138b76] transition hover:bg-emerald-50"><Eye size={14} /> View details</button></td>
                                        </tr>
                                    ))}
                                    {!visibleRequests.length && <tr><td colSpan="6" className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><FileSearch size={22} /></div><p className="mt-3 text-sm font-semibold text-slate-700">{busy ? "Loading requests..." : activeTab === "remarks" ? "No rejected or cancelled applications" : "No requests found"}</p><p className="mt-1 text-xs text-slate-400">{busy ? "Please wait while we fetch the latest data." : activeTab === "remarks" ? "Decision reasons will appear here when an application is rejected or cancelled." : "Try changing your search or status filter."}</p></td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5 text-xs text-slate-400 sm:px-6">
                            <span>{activeTab === "remarks" ? `${visibleRequests.length} decision records` : "Showing up to 100 requests · Counts reflect current results"}</span>
                            <span className="inline-flex items-center gap-1.5"><ArrowDownUp size={13} /> Latest requests from server</span>
                        </div>
                    </section>}

                    {activeTab === "payments" && <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5"><div><h2 className="font-bold text-[#172b45]">Manual UPI submissions</h2><p className="mt-1 text-xs text-slate-500">Never approve from a screenshot or UTR alone. Match the credit in the bank account.</p></div><button onClick={loadPayments} className="rounded-lg border px-3 py-2 text-xs font-semibold">Refresh</button></div>
                        <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Payment reference</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Customer UTR</th><th className="px-5 py-4">Submitted</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{payments.map(payment => <tr key={payment.id}><td className="px-5 py-4 font-semibold text-[#17365d]">{payment.payment_reference}</td><td className="px-5 py-4"><p className="font-semibold">{payment.customer_name || "—"}</p><p className="text-xs text-slate-400">{payment.customer_email || ""}</p><p className="text-xs text-slate-400">{payment.customer_phone || ""}</p></td><td className="px-5 py-4">₹{(payment.amount / 100).toFixed(2)}</td><td className="px-5 py-4 font-mono text-xs">{payment.customer_utr || "—"}</td><td className="px-5 py-4 text-xs text-slate-500">{formatDate(payment.created_at)}</td><td className="px-5 py-4"><StatusBadge status={payment.status === "created" ? "pending" : payment.status === "submitted" ? "pending" : payment.status === "verified" ? "completed" : payment.status === "rejected" ? "rejected" : payment.status === "expired" ? "expired" : "processing"} /><span className="ml-2 text-xs text-slate-500">{prettyStatus(payment.status)}</span></td><td className="px-5 py-4 text-right">{payment.status === "submitted" ? <div className="flex justify-end gap-2"><button onClick={() => decidePayment(payment, "verify")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Verify bank credit</button><button onClick={() => decidePayment(payment, "reject")} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700">Reject</button></div> : payment.status === "created" ? <button onClick={() => decidePayment(payment, "reject")} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700">Mark not received / close</button> : <span className="text-xs text-slate-400">No action</span>}</td></tr>)}{!payments.length && <tr><td colSpan="7" className="px-5 py-12 text-center text-sm text-slate-400">{paymentBusy ? "Loading payments..." : "No payment submissions yet."}</td></tr>}</tbody></table></div>
                    </section>}
                </main>
            </div>

            {statusEditor && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0c1d33]/65 p-3 backdrop-blur-sm sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !updatingId) setStatusEditor(null); }}>
                    <section className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_24px_80px_rgba(10,31,55,0.28)]">
                        <div className="shrink-0 bg-gradient-to-r from-[#12324a] to-[#087e78] px-5 py-5 text-white sm:px-7">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><ClipboardList size={21} /></div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-100">PANKhojo · Request workflow</p>
                                        <h2 className="mt-1 text-xl font-bold sm:text-2xl">Update request</h2>
                                        <p className="mt-1 text-xs text-white/75">{statusEditor.request.request_number} · {statusEditor.request.full_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setStatusEditor(null)} disabled={!!updatingId} aria-label="Close status editor" className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-50"><X size={18} /></button>
                            </div>
                        </div>

                        <div className="min-h-0 space-y-6 overflow-y-auto p-4 sm:p-7">
                            <section>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div><p className="text-sm font-bold text-slate-800">Choose the new status</p><p className="mt-0.5 text-xs text-slate-500">Select what should happen to this request.</p></div>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Step 1</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {statuses.map((item) => {
                                        const active = statusEditor.nextStatus === item;
                                        const tone = item === "completed" ? "emerald" : item === "rejected" ? "rose" : item === "cancelled" ? "slate" : item === "processing" ? "sky" : "amber";
                                        const toneClasses = {
                                            emerald: active ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/15" : "border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/60",
                                            rose: active ? "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/15" : "border-rose-100 hover:border-rose-300 hover:bg-rose-50/60",
                                            slate: active ? "border-slate-500 bg-slate-100 text-slate-800 ring-2 ring-slate-500/15" : "border-slate-200 hover:border-slate-400 hover:bg-slate-50",
                                            sky: active ? "border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-500/15" : "border-sky-100 hover:border-sky-300 hover:bg-sky-50/60",
                                            amber: active ? "border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/15" : "border-amber-100 hover:border-amber-300 hover:bg-amber-50/60",
                                        };
                                        const Icon = item === "completed" ? BadgeCheck : item === "rejected" || item === "cancelled" ? Ban : item === "processing" ? Activity : Clock3;
                                        return <button type="button" key={item} onClick={() => setStatusEditor((v) => ({ ...v, nextStatus: item }))} className={`flex min-h-[58px] items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${toneClasses[tone]}`}>
                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/80" : "bg-slate-50"}`}><Icon size={16} /></span>
                                            <span>{prettyStatus(item)}</span>
                                            {active && <CheckCircle2 size={16} className="ml-auto shrink-0" />}
                                        </button>;
                                    })}
                                </div>
                            </section>

                            {statusEditor.nextStatus === "completed" && (
                                <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                                    <div className="flex items-start gap-3 border-b border-emerald-100 px-4 py-4 sm:px-5">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><BadgeCheck size={20} /></div>
                                        <div><h3 className="font-bold text-emerald-950">Deliver the PAN result</h3><p className="mt-1 text-xs leading-5 text-emerald-800">Enter the found PAN. PANKhojo will generate the protected PDF and email it to the registered customer.</p></div>
                                        <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">Step 2</span>
                                    </div>
                                    <div className="space-y-3 p-4 sm:p-5">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950" htmlFor="found-pan-number">Found PAN number <span className="text-rose-600">· Required</span></label>
                                        <input id="found-pan-number" value={panNumber} onChange={(event) => setPanNumber(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} maxLength={10} placeholder="ABCDE1234F" autoComplete="off" spellCheck="false" className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3.5 font-mono text-lg font-bold tracking-[0.18em] text-slate-800 outline-none transition placeholder:font-normal placeholder:tracking-widest placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
                                        <div className="flex items-start gap-2 rounded-xl bg-white/80 p-3 text-xs leading-5 text-emerald-900"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-700" />Double-check every character before sending. The PAN will be included in a password-protected PDF; the customer will receive a separate password email.</div>
                                    </div>
                                </section>
                            )}

                            {["rejected", "cancelled"].includes(statusEditor.nextStatus) && (
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-800">Explain the decision</p><p className="mt-0.5 text-xs text-slate-500">Keep the private admin note separate from the customer message.</p></div><span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700">Step 2 · Required</span></div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-700"><ShieldCheck size={17} /></div><div><label htmlFor="internal-status-remark" className="block text-sm font-bold text-slate-800">Internal admin remark</label><p className="text-[11px] text-slate-500">Only authorised admins can see this</p></div></div>
                                            <span className={`text-xs font-semibold ${statusRemark.length >= 5 ? "text-emerald-700" : "text-slate-400"}`}>{statusRemark.length}/500</span>
                                        </div>
                                        <textarea id="internal-status-remark" value={statusRemark} onChange={(event) => setStatusRemark(event.target.value.slice(0, 500))} rows={3} placeholder="Example: Request could not be processed because the submitted details did not match the verification records." className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#087e78] focus:ring-4 focus:ring-teal-500/10" />
                                        <p className="mt-2 text-[11px] text-slate-500">For internal context only. Do not include full Aadhaar or PAN details.</p>
                                    </div>
                                    <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-800"><Mail size={17} /></div><div><label htmlFor="customer-status-message" className="block text-sm font-bold text-sky-950">Message for the customer</label><p className="text-[11px] text-sky-800">Shown in tracking and sent by email</p></div></div>
                                            <span className={`text-xs font-semibold ${customerMessage.length >= 5 ? "text-emerald-700" : "text-slate-400"}`}>{customerMessage.length}/500</span>
                                        </div>
                                        <textarea id="customer-status-message" value={customerMessage} onChange={(event) => setCustomerMessage(event.target.value.slice(0, 500))} rows={3} placeholder="Example: We couldn't complete your request because the submitted information needs clarification. Please contact our support team before submitting another request." className="w-full resize-y rounded-xl border border-sky-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10" />
                                        <p className="mt-2 text-[11px] leading-5 text-sky-800">This is customer-visible. Explain the outcome and next step clearly. Never include Aadhaar, PAN or other sensitive identity details.</p>
                                    </div>
                                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900"><AlertTriangle size={16} className="mt-0.5 shrink-0" />Both explanations are required. The internal remark stays private; only the customer message is emailed and displayed publicly.</div>
                                </section>
                            )}

                            {!["completed", "rejected", "cancelled"].includes(statusEditor.nextStatus) && (
                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 text-slate-800"><MessageSquareText size={17} /><p className="text-sm font-semibold">Optional internal note</p></div>
                                    <textarea value={statusRemark} onChange={(event) => setStatusRemark(event.target.value.slice(0, 500))} rows={2} placeholder="Add a short note for other administrators..." className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
                                    <p className="mt-2 text-[11px] text-slate-500">Visible to authorised administrators only.</p>
                                </section>
                            )}

                            {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
                        </div>

                        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:justify-between sm:px-7">
                            <p className="hidden items-center gap-2 self-center text-[11px] text-slate-400 sm:flex"><ShieldCheck size={14} /> Changes are recorded in the admin activity log.</p>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setStatusEditor(null)} disabled={!!updatingId} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                                <button onClick={updateStatus} disabled={!!updatingId || statusEditor.nextStatus === statusEditor.request.status || (statusEditor.nextStatus === "completed" && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber.trim())) || (["rejected", "cancelled"].includes(statusEditor.nextStatus) && (statusRemark.trim().length < 5 || customerMessage.trim().length < 5))} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${statusEditor.nextStatus === "completed" ? "bg-emerald-700 hover:bg-emerald-800" : ["rejected", "cancelled"].includes(statusEditor.nextStatus) ? "bg-rose-700 hover:bg-rose-800" : "bg-[#17365d] hover:bg-[#102744]"}`}>{updatingId ? <LoaderCircle size={15} className="animate-spin" /> : statusEditor.nextStatus === "completed" ? <Mail size={15} /> : <Check size={15} />} {updatingId ? "Processing..." : statusEditor.nextStatus === "completed" ? "Complete & Send PAN" : "Save status"}</button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#0c1d33]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); setRevealedAadhaar(""); } }}>
                    <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
                        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
                            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#159b83]">Request workspace</p><h2 className="mt-1 text-xl font-bold text-[#172b45]">{selected.request_number}</h2><p className="mt-1 text-xs text-slate-400">Submitted {formatDate(selected.created_at)}</p></div>
                            <button onClick={() => { setSelected(null); setRevealedAadhaar(""); }} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800" aria-label="Close details"><X size={18} /></button>
                        </div>
                        <div className="space-y-6 p-5 sm:p-7">
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 sm:p-5">
                                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current application status</p><div className="mt-2"><StatusBadge status={selected.status} /></div></div>
                                <button onClick={() => openStatusEditor(selected)} disabled={updatingId === selected.id || Boolean(selected.payment_status && selected.payment_status !== "verified")} title={selected.payment_status && selected.payment_status !== "verified" ? "Payment must be verified before processing this request." : "Change request status"} className="inline-flex items-center gap-2 rounded-xl bg-[#17365d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102744] disabled:cursor-not-allowed disabled:opacity-40"><SlidersHorizontal size={15} /> {selected.payment_status && selected.payment_status !== "verified" ? "Payment pending" : "Change status"}</button>
                            </div>
                            <div>
                                <h3 className="mb-3 text-sm font-bold text-[#172b45]">Customer information</h3>
                                <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                                    <Info label="Full name" value={selected.full_name} icon={UserRound} />
                                    <Info label="Email address" value={selected.email} icon={Mail} />
                                    <Info label="Phone number" value={selected.phone} icon={Phone} />
                                    <Info label="Payment verification" value={selected.payment_status ? prettyStatus(selected.payment_status) : "Legacy request / not linked"} icon={ShieldCheck} />
                                    <Info label="Date of birth" value={selected.date_of_birth || "—"} icon={CalendarDays} />
                                    <Info label="Father's name" value={selected.father_name || "—"} icon={UserRound} />
                                    <Info label="City / State" value={`${selected.city || "—"}, ${selected.state || "—"}`} icon={MapPin} />
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-3 text-sm font-bold text-[#172b45]">Consent record</h3>
                                <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                                    <Info
                                        label="Privacy Policy"
                                        value={selected.privacy_consent
                                            ? `Accepted · v${selected.privacy_policy_version}`
                                            : "Not recorded"}
                                        icon={ShieldCheck}
                                    />
                                    <Info
                                        label="Terms of Service"
                                        value={selected.terms_consent
                                            ? `Accepted · v${selected.terms_version}`
                                            : "Not recorded"}
                                        icon={ShieldCheck}
                                    />
                                    <Info
                                        label="Consent recorded"
                                        value={formatDate(selected.consented_at)}
                                        icon={CalendarDays}
                                    />
                                </div>
                            </div>
                            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                                <div className="flex items-start gap-3"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-amber-700" /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-amber-900">Sensitive identity information</p><p className="mt-1 text-xs leading-5 text-amber-800">Aadhaar is masked by default. Reveal only when strictly necessary for an authorised task. Each reveal is recorded in the activity log.</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-3"><span className="font-mono text-sm font-semibold text-amber-950">{selected.aadhaar_last4 ? `XXXX XXXX ${selected.aadhaar_last4}` : "Not available"}</span><button onClick={revealAadhaar} disabled={revealBusy || !selected.aadhaar_last4} className="inline-flex items-center gap-2 rounded-lg bg-[#17365d] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#102744] disabled:opacity-50">{revealBusy ? <LoaderCircle size={14} className="animate-spin" /> : <Eye size={14} />}{revealBusy ? "Loading..." : "Reveal Aadhaar"}</button>{revealedAadhaar && <span className="rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-sm font-bold tracking-wider text-amber-950">{revealedAadhaar}</span>}</div>
                                </div></div>
                            </div>
                            <div>
                                <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-[#172b45]">Activity timeline</h3><span className="text-xs text-slate-400">{logs.length} event{logs.length === 1 ? "" : "s"}</span></div>
                                {logs.length ? <div className="space-y-3">{logs.map((log) => <div key={log.id} className="flex gap-3"><div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf2fa] text-[#17365d]"><Activity size={14} /></div><div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><p className="text-sm font-semibold text-slate-800">{log.action}</p><p className="mt-1 text-xs leading-5 text-slate-600">{log.description}</p><p className="mt-2 text-[10px] text-slate-400">{formatDate(log.created_at)} · {log.admin_name || "System"}</p></div></div>)}</div> : <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">No activity has been recorded yet.</p>}
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

function Info({ label, value, icon: Icon }) {
    return <div className="flex min-w-0 gap-3"><span className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-500"><Icon size={15} /></span><div className="min-w-0"><p className="text-[11px] font-medium text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-800">{value || "—"}</p></div></div>;
}
