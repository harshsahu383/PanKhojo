import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, CheckCircle2,
  Clock3, FileText, Fingerprint, Headset, HelpCircle, LockKeyhole, Mail,
  MapPin, ShieldCheck, UserRoundCheck
} from "lucide-react";

const SITE = "https://pankhojo.in";
const SUPPORT_EMAIL = "harshsahu1917@gmail.com";
const SUPPORT_PHONE = "+917725943124";

const pageMeta = {
  "/how-pankhojo-works": {
    title: "How PANKhojo Works | PAN Finding Process",
    description: "See how PANKhojo’s independent private PAN-finding assistance works, who it is for, what information may be requested and what to expect after submitting a request."
  },
  "/pan-number-guide": {
    title: "Forgot Your PAN Number? Official Ways to Find It | PANKhojo",
    description: "Forgot or misplaced your PAN? Learn the official ways to check your existing PAN, understand safe recovery options and avoid applying for a duplicate PAN."
  },
  "/about-us": {
    title: "About PANKhojo | Independent PAN Finding Assistance",
    description: "Learn about PANKhojo, an independent private service helping people understand options for locating their own existing PAN number."
  },
  "/contact-us": {
    title: "Contact PANKhojo | PAN Request and Payment Support",
    description: "Contact PANKhojo for help with an existing PAN-finding request, payment, delivery, cancellation or privacy question."
  },
  "/privacy-policy": {
    title: "Privacy Policy | PANKhojo",
    description: "Read PANKhojo’s privacy information about personal data, Aadhaar number handling where required, request processing, security and customer choices."
  },
  "/terms-and-conditions": {
    title: "Terms and Conditions | PANKhojo",
    description: "Review the terms, eligibility, limitations and conditions for using PANKhojo’s independent private existing PAN-finding assistance service."
  },
  "/refund-policy": {
    title: "Cancellation and Refund Policy | PANKhojo",
    description: "Understand PANKhojo’s cancellation, payment issue and refund process before submitting an existing PAN-finding request."
  }
};

function usePageMeta(path) {
  useEffect(() => {
    const meta = pageMeta[path];
    if (!meta) return;
    document.title = meta.title;
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content = meta.description;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE}${path}`;
    let robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.content = "index,follow,max-image-preview:large";
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = meta.title;
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = meta.description;
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = `${SITE}${path}`;
  }, [path]);
}

function Brand() {
  return <a href="/" className="inline-flex items-center gap-3" aria-label="PANKhojo home">
    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#173F6D] text-white"><Fingerprint size={25} /></span>
    <span><span className="block font-display text-[21px] font-extrabold tracking-tight text-[#153B68]">PAN<span className="text-[#20A786]">Khojo</span></span><span className="block text-[9px] font-bold tracking-[.17em] text-slate-400">EXISTING PAN ASSISTANCE</span></span>
  </a>;
}

function SiteLayout({ children, current }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    ["/how-pankhojo-works", "How it works"],
    ["/pan-number-guide", "PAN knowledge"],
    ["/about-us", "About us"],
    ["/contact-us", "Contact"]
  ];
  return <div className="min-h-screen bg-[#F7FAFD] text-[#183653]">
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Brand />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map(([url, label]) => <a key={url} href={url} aria-current={current === url ? "page" : undefined} className={`text-[13px] font-bold transition hover:text-[#16866D] ${current === url ? "text-[#16866D]" : "text-slate-600"}`}>{label}</a>)}
        </nav>
        <a href="/" className="hidden rounded-xl bg-[#173F6D] px-5 py-3 text-xs font-extrabold text-white transition hover:bg-[#245985] lg:inline-flex">Back to homepage <ArrowUpRight size={14} className="ml-2" /></a>
        <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen} className="rounded-lg border border-slate-200 p-2 text-[#173F6D] lg:hidden"><span className="block h-0.5 w-5 bg-current" /><span className="mt-1.5 block h-0.5 w-5 bg-current" /><span className="mt-1.5 block h-0.5 w-5 bg-current" /></button>
      </div>
      {menuOpen && <nav className="border-t border-slate-100 bg-white px-5 py-3 lg:hidden" aria-label="Mobile navigation">{links.map(([url, label]) => <a key={url} href={url} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{label}</a>)}<a href="/" className="mt-2 block rounded-xl bg-[#173F6D] px-4 py-3 text-center text-sm font-bold text-white">Back to homepage</a></nav>}
    </header>
    {children}
    <footer className="bg-[#102A45] px-5 pb-8 pt-12 text-white sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-9 border-b border-white/10 pb-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div><Brand /><p className="mt-5 max-w-xs text-sm leading-7 text-blue-100/60">Independent private assistance for people seeking to locate their own existing PAN number.</p><p className="mt-4 flex items-center gap-2 text-xs text-blue-100/50"><MapPin size={14} />Rajasthan, India</p></div>
        <div><h3 className="mb-4 text-xs font-extrabold uppercase tracking-[.15em] text-white/80">Explore</h3><div className="flex flex-col gap-3 text-sm text-blue-100/60">{links.map(([url, label]) => <a key={url} href={url} className="hover:text-white">{label}</a>)}</div></div>
        <div><h3 className="mb-4 text-xs font-extrabold uppercase tracking-[.15em] text-white/80">Policies</h3><div className="flex flex-col gap-3 text-sm text-blue-100/60"><a href="/privacy-policy" className="hover:text-white">Privacy policy</a><a href="/terms-and-conditions" className="hover:text-white">Terms & conditions</a><a href="/refund-policy" className="hover:text-white">Refund policy</a><a href="https://www.incometax.gov.in/" target="_blank" rel="noreferrer" className="hover:text-white">Official Income Tax portal ↗</a></div></div>
        <div><h3 className="mb-4 text-xs font-extrabold uppercase tracking-[.15em] text-white/80">Contact</h3><div className="flex flex-col gap-3 text-sm text-blue-100/60"><a href={`tel:${SUPPORT_PHONE}`} className="inline-flex items-center gap-2 hover:text-white"><Headset size={15} />+91 77259 43124</a><a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 break-all hover:text-white"><Mail size={15} />{SUPPORT_EMAIL}</a></div></div>
      </div>
      <div className="mx-auto max-w-7xl border-b border-white/10 py-6 text-xs leading-6 text-blue-100/45">PANKhojo is an independent private service. It is not a government website or representative and is not affiliated with the Income Tax Department, Protean, UTIITSL or UIDAI. PANKhojo does not issue PAN numbers and does not guarantee that every request can be completed.</div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 pt-5 text-xs text-blue-100/40 sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} PANKhojo. All rights reserved.</span><span>Independent private service · India</span></div>
    </footer>
  </div>;
}

function PageHero({ eyebrow, title, intro, icon: Icon = FileText }) {
  return <section className="relative overflow-hidden bg-white">
    <div className="absolute -right-32 -top-44 h-96 w-96 rounded-full bg-[#E6F3FF] blur-3xl" />
    <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
      <div className="max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D7ECE5] bg-[#F0FAF6] px-4 py-2 text-[10px] font-extrabold tracking-[.15em] text-[#167B68]"><Icon size={15} />{eyebrow}</div>
        <h1 className="font-display text-4xl font-extrabold leading-[1.12] tracking-[-.055em] text-[#142E4A] sm:text-5xl lg:text-[58px]">{title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">{intro}</p>
      </div>
    </div>
  </section>;
}

function ContentSection({ title, children }) {
  return <section className="border-b border-slate-100 py-7 last:border-0"><h2 className="font-display text-xl font-extrabold text-[#183653]">{title}</h2><div className="mt-3 space-y-3 text-sm leading-8 text-slate-600">{children}</div></section>;
}

function InfoCard({ icon: Icon, title, children, number }) {
  return <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_8px_35px_rgba(20,53,86,.04)]"><div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF4FC] text-[#245D8F]"><Icon size={23} /></span>{number && <span className="font-display text-4xl font-extrabold text-slate-100">{number}</span>}</div><h2 className="mt-6 font-display text-lg font-extrabold text-[#183653]">{title}</h2><div className="mt-3 text-sm leading-7 text-slate-500">{children}</div></article>;
}

function CTA() {
  return <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10"><div className="flex flex-col items-start justify-between gap-6 rounded-[28px] bg-gradient-to-br from-[#EAF4FC] via-white to-[#E8F7F1] p-8 sm:p-11 md:flex-row md:items-center"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#16866D]">PANKHOJO SUPPORT</p><h2 className="mt-3 font-display text-2xl font-extrabold text-[#183653] sm:text-3xl">Have a question before you proceed?</h2><p className="mt-2 text-sm leading-7 text-slate-600">Contact our team for help understanding the service, process or policies.</p></div><a href="/contact-us" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#173F6D] px-6 py-4 text-sm font-extrabold text-white">Contact support <ArrowRight size={16} /></a></div></section>;
}

export function HowItWorksPage() {
  const path = "/how-pankhojo-works"; usePageMeta(path);
  const steps = [
    ["Read the service information", "Review who the service is for, what information may be requested, the applicable charge and the service limitations before starting.", BookOpen],
    ["Submit your own request", "If you decide to continue, provide accurate details through the request form. Where required by an eligible authorised process, enter your 12-digit Aadhaar number only. No Aadhaar photo or document is requested.", FileText],
    ["Request review", "The request is reviewed to determine whether it can be handled through an available and lawful process. A request may be declined if eligibility or authority cannot be established.", UserRoundCheck],
    ["Receive an update", "Use the reference details provided to follow up. Processing time can vary and successful retrieval is not guaranteed.", Clock3]
  ];
  return <SiteLayout current={path}><PageHero eyebrow="THE CUSTOMER JOURNEY" title="How PANKhojo works" intro="A step-by-step explanation for people who have forgotten or misplaced their own existing PAN number. Read the details and limitations before deciding whether to submit a request." icon={Fingerprint} /><main className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"><div className="grid gap-5 sm:grid-cols-2">{steps.map(([title, desc, Icon], i) => <InfoCard key={title} icon={Icon} title={title} number={`0${i + 1}`}>{desc}</InfoCard>)}</div><div className="mt-12 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl bg-[#143657] p-8 text-white"><ShieldCheck size={28} className="text-[#9AE2CC]" /><h2 className="mt-5 font-display text-xl font-extrabold">Important eligibility and safety notes</h2><ul className="mt-4 space-y-3 text-sm leading-7 text-blue-100/80"><li>• This service is intended for locating your own existing PAN.</li><li>• PANKhojo does not issue a new PAN or provide government services.</li><li>• Never share an Aadhaar OTP, password or account credentials.</li><li>• A result or completion time cannot be guaranteed.</li></ul></div><div className="rounded-3xl border border-slate-200 bg-white p-8"><h2 className="font-display text-xl font-extrabold">Check official options first</h2><p className="mt-3 text-sm leading-7 text-slate-600">You may be able to retrieve or verify your PAN through official Income Tax Department services. A private assistance service is optional and does not replace official channels.</p><a href="https://www.incometax.gov.in/" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#16866D]">Visit the Income Tax Department <ArrowUpRight size={15} /></a></div></div></main><CTA /></SiteLayout>;
}

export function PanGuidePage() {
  const path = "/pan-number-guide"; usePageMeta(path);
  return <SiteLayout current={path}><PageHero eyebrow="PAN KNOWLEDGE CENTRE" title="Forgot your PAN number? Start with the official options." intro="A practical guide to understanding your existing PAN, checking official services and avoiding unsafe ways of sharing identity information." icon={BookOpen} /><main className="mx-auto max-w-4xl px-5 py-14 sm:px-8 lg:px-10"><ContentSection title="What is a PAN?"><p>Permanent Account Number (PAN) is a ten-character alphanumeric identifier issued by the Income Tax Department. It is used for income-tax and specified financial and identity-related transactions.</p></ContentSection><ContentSection title="What should I do if I have forgotten my PAN?"><p>Start with official Income Tax Department services and records already available to you. Check your e-filing account, previous income-tax documents, Form 16, bank or investment records where PAN may have been provided, and official PAN-related facilities.</p><p>Use only official government websites for authentication or changes to your PAN records. Do not rely on unsolicited calls, messages or websites promising guaranteed retrieval.</p></ContentSection><ContentSection title="Can Aadhaar help me locate my PAN?"><p>The Income Tax Department provides official facilities for certain PAN-related tasks. Whether Aadhaar can be used depends on the specific official service, your eligibility and the applicable rules. For PANKhojo requests, where an authorised process requires it, only the 12-digit Aadhaar number is requested—not an Aadhaar photo or document. Never share your Aadhaar OTP or account credentials.</p></ContentSection><ContentSection title="What if I already have a PAN but cannot remember the number?"><p>Do not apply for another PAN simply because you cannot remember the existing number. A person should not hold more than one PAN. Use official channels to locate or verify your existing PAN and seek guidance from the Income Tax Department if you are unsure.</p></ContentSection><ContentSection title="How PANKhojo may help"><p>PANKhojo is an independent private assistance service for people seeking help locating their own existing PAN. The service is not a government service, does not issue PAN numbers and cannot guarantee that a request will be successful. Read the process, eligibility conditions and privacy information before deciding whether to proceed.</p></ContentSection><div className="mt-9 rounded-2xl border border-[#D7ECE5] bg-[#F0FAF6] p-6"><h2 className="font-display font-extrabold text-[#183653]">Use official resources</h2><p className="mt-2 text-sm leading-7 text-slate-600">For official PAN services, visit the Income Tax Department website.</p><a href="https://www.incometax.gov.in/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-[#16866D]">incometax.gov.in <ArrowUpRight size={15} /></a></div></main><CTA /></SiteLayout>;
}

export function AboutPage() {
  const path = "/about-us"; usePageMeta(path);
  return <SiteLayout current={path}><PageHero eyebrow="ABOUT PANKHOJO" title="A clearer way to seek help finding an existing PAN." intro="PANKhojo is an independent private assistance initiative designed for people who have forgotten or misplaced their own existing PAN number." icon={Fingerprint} /><main className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-3xl bg-[#143657] p-8 text-white sm:p-10"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-[#A7E9D5]"><BadgeCheck size={27} /></span><h2 className="mt-7 font-display text-2xl font-extrabold">Independent private assistance</h2><p className="mt-4 text-sm leading-8 text-blue-100/75">We aim to explain the service clearly, show applicable charges before payment, and provide customers with a way to ask questions and follow up on a submitted request.</p></div><div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10"><h2 className="font-display text-2xl font-extrabold">What we do — and what we don't</h2><ul className="mt-5 space-y-4 text-sm leading-7 text-slate-600"><li className="flex gap-3"><CheckCircle2 className="mt-1 shrink-0 text-[#16866D]" size={18} />Provide private assistance for requests to locate an existing PAN, where a lawful process is available.</li><li className="flex gap-3"><CheckCircle2 className="mt-1 shrink-0 text-[#16866D]" size={18} />Explain request steps, applicable charges and limitations.</li><li className="flex gap-3"><HelpCircle className="mt-1 shrink-0 text-slate-400" size={18} />We do not issue PAN cards, approve PAN applications or represent a government department.</li><li className="flex gap-3"><HelpCircle className="mt-1 shrink-0 text-slate-400" size={18} />We do not guarantee successful retrieval or a fixed completion time.</li></ul></div></div><div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8"><h2 className="font-display text-xl font-extrabold">Our service principles</h2><div className="mt-6 grid gap-6 sm:grid-cols-3"><div><ShieldCheck className="text-[#16866D]" size={24} /><h3 className="mt-3 font-bold">Transparency</h3><p className="mt-2 text-sm leading-7 text-slate-500">Explain the process, scope, fees and limitations before a customer proceeds.</p></div><div><LockKeyhole className="text-[#16866D]" size={24} /><h3 className="mt-3 font-bold">Careful handling</h3><p className="mt-2 text-sm leading-7 text-slate-500">Treat identity-related information as sensitive and limit collection to what is necessary and authorised.</p></div><div><Headset className="text-[#16866D]" size={24} /><h3 className="mt-3 font-bold">Support</h3><p className="mt-2 text-sm leading-7 text-slate-500">Provide a clear channel for questions about requests, payments and service conditions.</p></div></div></div></main><CTA /></SiteLayout>;
}

export function ContactPage() {
  const path = "/contact-us"; usePageMeta(path);
  return <SiteLayout current={path}><PageHero eyebrow="CUSTOMER SUPPORT" title="Contact PANKhojo" intro="Have a question about the service, a submitted request, a payment or our policies? Reach our support team using the contact details below." icon={Headset} /><main className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:px-10"><div className="rounded-3xl bg-[#143657] p-8 text-white"><h2 className="font-display text-2xl font-extrabold">We're here to help.</h2><p className="mt-3 text-sm leading-7 text-blue-100/75">Please include your request or payment reference when contacting us. Do not email Aadhaar OTPs, passwords or unnecessary identity documents.</p><div className="mt-8 space-y-5"><a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-start gap-3 text-sm text-white"><Mail size={19} className="mt-0.5 text-[#9AE2CC]" /><span><b className="block">Email support</b><span className="mt-1 block break-all text-blue-100/70">{SUPPORT_EMAIL}</span></span></a><a href={`tel:${SUPPORT_PHONE}`} className="flex items-start gap-3 text-sm text-white"><Headset size={19} className="mt-0.5 text-[#9AE2CC]" /><span><b className="block">Phone support</b><span className="mt-1 block text-blue-100/70">+91 77259 43124</span></span></a><div className="flex items-start gap-3 text-sm text-white"><MapPin size={19} className="mt-0.5 text-[#9AE2CC]" /><span><b className="block">Service location</b><span className="mt-1 block text-blue-100/70">Rajasthan, India</span></span></div></div></div><div className="rounded-3xl border border-slate-200 bg-white p-8"><h2 className="font-display text-xl font-extrabold">Before you contact us</h2><div className="mt-5 space-y-5 text-sm leading-7 text-slate-600"><p><b className="text-[#183653]">Request status:</b> Keep your request reference and registered email available. Use the request tracking option on the homepage for status updates.</p><p><b className="text-[#183653]">Payment questions:</b> Keep the payment reference and transaction confirmation. Never send card details, UPI PINs or OTPs.</p><p><b className="text-[#183653]">Privacy questions:</b> Tell us what information your question relates to, but do not include sensitive identity numbers in an ordinary email unless specifically required through an approved secure process.</p><p><b className="text-[#183653]">Complaints:</b> Email us with the subject “Customer Complaint” and include the relevant reference number where applicable.</p></div><a href={`mailto:${SUPPORT_EMAIL}?subject=PANKhojo%20Customer%20Support`} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#173F6D] px-6 py-3.5 text-sm font-extrabold text-white">Email PANKhojo support <ArrowUpRight size={15} /></a></div></main><CTA /></SiteLayout>;
}

export function PrivacyPage() {
  const path = "/privacy-policy"; usePageMeta(path);
  const sections = [
    ["Information that may be collected", "Depending on the service and whether it is lawfully enabled, information may include your name, contact details, request details and identity-related information that is necessary for the stated purpose. The specific fields and purpose should be shown in the request form before submission."],
    ["How information is used", "Information is used to receive and review a request, communicate with you, process payments where applicable, provide customer support, prevent misuse, maintain required records and meet legal obligations."],
    ["Sensitive identity information", "PAN and Aadhaar information is sensitive. Where a lawful basis, required permissions and an authorised processing method have been confirmed, PANKhojo requests the Aadhaar number only—not an Aadhaar photo or document. Never share an Aadhaar OTP, password or account credentials."],
    ["Sharing and service providers", "Information may be handled by hosting, communications, payment or other service providers where necessary for the stated service and permitted by law. Relevant provider roles and safeguards should be explained before live processing. PANKhojo does not sell personal information."],
    ["Security and access", "Reasonable technical and organisational safeguards should be applied, including access restrictions, encryption where appropriate, secure credential handling, audit records and incident response procedures. No online system can be guaranteed to be completely secure."],
    ["Retention and deletion", "Personal information should be retained only for the period necessary for the stated purpose, support, disputes and applicable legal requirements. Requests for deletion can be sent to the support email, subject to records that must lawfully be retained."],
    ["Your choices and requests", "You may contact PANKhojo to ask about your information or request correction or deletion where applicable. Withdrawal of consent may mean the service cannot continue if the information is necessary for the request."],
    ["Contact", "For privacy questions, email " + SUPPORT_EMAIL + ". Please do not send Aadhaar OTPs, passwords or sensitive identity details in ordinary email."]
  ];
  return <SiteLayout current={path}><PageHero eyebrow="YOUR INFORMATION MATTERS" title="Privacy policy" intro="This page explains PANKhojo's approach to personal information. Review the information shown in the request form before submitting any details." icon={LockKeyhole} /><main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:px-10">{sections.map(([title, body]) => <ContentSection key={title} title={title}><p>{body}</p></ContentSection>)}<p className="mt-8 text-xs text-slate-400">Last reviewed: November 2026. This page should be updated whenever the service or data practices change.</p></main></SiteLayout>;
}

export function TermsPage() {
  const path = "/terms-and-conditions"; usePageMeta(path);
  const sections = [
    ["About PANKhojo", "PANKhojo is an independent private assistance service for individuals seeking help locating their own existing PAN number. It is not a government website or representative and is not affiliated with the Government of India, the Income Tax Department, Protean, UTIITSL or UIDAI."],
    ["Service scope", "The service is intended only to assist with locating an existing PAN where an authorised and lawful process is available. PANKhojo does not issue PAN numbers, provide new PAN applications or replace official government services."],
    ["Eligibility and authority", "You must submit a request for yourself or have valid legal authority to act for the person concerned. Do not submit another person's personal information without the authority and consent required by law. PANKhojo may decline requests where eligibility or authority is unclear."],
    ["Customer responsibilities", "You are responsible for providing accurate information, using contact details you control and responding to reasonable follow-up questions. Do not impersonate another person, provide false information or use the service for unlawful purposes."],
    ["Fees and payment", "Any applicable private service charge and its scope must be displayed before payment. A private service charge must not be represented as a government fee. Payment does not guarantee that a PAN will be located or that a request will be completed."],
    ["No guarantee", "Results depend on eligibility, the availability of a permitted process and successful review. No particular outcome or completion time is guaranteed. Official confirmation and statutory PAN services remain with the relevant government authority."],
    ["Refusal or cancellation", "A request may be paused, declined or cancelled if information is incomplete, authority cannot be established, misuse is suspected, an authorised process is unavailable or processing may breach applicable law. Any refund will be handled under the published refund policy and applicable law."],
    ["Contact and disputes", "For questions or complaints, contact " + SUPPORT_EMAIL + ". These terms are subject to applicable laws of India and do not remove any consumer rights that cannot legally be excluded."]
  ];
  return <SiteLayout current={path}><PageHero eyebrow="SERVICE TERMS" title="Terms and conditions" intro="Please read these terms before using PANKhojo or submitting a service request." icon={FileText} /><main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:px-10">{sections.map(([title, body]) => <ContentSection key={title} title={title}><p>{body}</p></ContentSection>)}</main></SiteLayout>;
}

export function RefundPage() {
  const path = "/refund-policy"; usePageMeta(path);
  const sections = [
    ["Before payment", "Review the service scope, eligibility, applicable charge and limitations before paying. Payment is for the private assistance service, not a government fee, unless expressly identified otherwise."],
    ["When a refund may be considered", "A refund may be considered where a payment is duplicated, a payment is received but the request cannot be created due to a technical failure, or PANKhojo determines that it cannot proceed with a request before meaningful processing has begun. Each case will be reviewed against the actual service status and applicable law."],
    ["Requests that cannot be completed", "A successful PAN retrieval is not guaranteed. The applicable refund treatment for a request that cannot be completed must be displayed clearly before payment and will be assessed in accordance with the customer-facing terms and applicable consumer law."],
    ["How to request help", "Email " + SUPPORT_EMAIL + " with the payment reference, request reference if available, registered email address and a brief explanation. Do not include UPI PINs, card security codes or OTPs."],
    ["Payment reversals and timelines", "Approved refunds are sent through the payment method or payment provider's supported process. The time taken for the amount to appear depends on the payment provider and banking network. We will communicate the status where possible."],
    ["Cancellations and disputes", "If you believe a payment is incorrect or duplicated, contact support promptly. You may also use the dispute or complaint channels provided by your bank or payment provider."]
  ];
  return <SiteLayout current={path}><PageHero eyebrow="PAYMENT TRANSPARENCY" title="Refund and cancellation policy" intro="Understand how payment issues, cancellation requests and refund enquiries are handled before proceeding." icon={FileText} /><main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:px-10">{sections.map(([title, body]) => <ContentSection key={title} title={title}><p>{body}</p></ContentSection>)}</main></SiteLayout>;
}

export function NotFoundPage() {
  return <SiteLayout><main className="mx-auto max-w-3xl px-5 py-24 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF4FC] text-[#245D8F]"><HelpCircle size={26} /></span><h1 className="mt-6 font-display text-4xl font-extrabold text-[#183653]">Page not found</h1><p className="mt-4 text-sm leading-7 text-slate-500">The page you're looking for may have moved or is not available.</p><a href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#173F6D] px-6 py-3.5 text-sm font-extrabold text-white">Back to homepage <ArrowRight size={16} /></a></main></SiteLayout>;
}
