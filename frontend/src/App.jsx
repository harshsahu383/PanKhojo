
import { useState } from "react";
import RequestPreview from "./RequestPreview.jsx";
import TrackRequest from "./TrackRequest.jsx";
import TrackPayment from "./TrackPayment.jsx";
import {
  Fingerprint,
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  LockKeyhole,
  FileText,
  CheckCircle2,
  Clock3,
  Headset,
  ChevronDown,
  ChevronRight,
  Mail,
  Languages,
  IndianRupee,
  ClipboardCheck,
  MapPin,
  Building2,
  CircleHelp,
} from "lucide-react";

const translations = {
  en: {
    nav: ["Home", "How it works", "Why PANKhojo", "FAQs"],
    contact: "Contact us",
    eyebrow: "INDEPENDENT PAN FINDER SERVICE",
    title: "Forgot your PAN number? Let's make recovery simpler.",
    subtitle:
      "A dedicated PAN-finding service for people who have lost or forgotten their existing PAN number.",
    primary: "Discover how it works",
    secondary: "Why PANKhojo",
    existing: "For existing PAN holders only",
    cardTitle: "Lost your PAN number?",
    cardDesc:
      "We help find your existing PAN number through a guided request process.",
    status: "PAN finding service",
    statusDesc:
      "A guided process to find your existing PAN number.",
    disabled: "Start your request",
    trust: ["Clear process", "Transparent pricing", "Privacy focused"],
    processEyebrow: "SIMPLE & TRANSPARENT",
    processTitle: "A clear process at every step.",
    processDesc:
      "We believe customers should always understand what happens to their request.",
    steps: [
      {
        title: "Submit your request",
        desc: "Provide the necessary information through our secure request system.",
      },
      {
        title: "Request processing",
        desc: "Our team reviews the details and follows the applicable verification process.",
      },
      {
        title: "Receive your PAN number",
        desc: "If the existing PAN is lawfully retrieved and your identity is verified, the result will be delivered through a secure channel.",
      },
    ],
    whyEyebrow: "THE PANKHOJO APPROACH",
    whyTitle: "Designed around clarity and responsibility.",
    whyDesc:
      "Important identity information deserves a professional and transparent experience.",
    benefits: [
      {
        title: "Simple experience",
        desc: "A straightforward service without confusing steps or unnecessary complexity.",
      },
      {
        title: "Transparent charges",
        desc: "Applicable service charges and conditions will be explained before payment.",
      },
      {
        title: "Privacy matters",
        desc: "Personal information should only be collected when necessary and handled responsibly.",
      },
      {
        title: "Customer assistance",
        desc: "A dedicated support channel for questions and service-related concerns.",
      },
    ],
    privacyEyebrow: "YOUR INFORMATION MATTERS",
    privacyTitle: "Your identity deserves careful protection.",
    privacyDesc:
      "PAN and Aadhaar information is sensitive. Our service is being designed around data minimization, informed consent and responsible information handling.",
    privacyPoints: [
      "Only necessary information",
      "Clear explanation of data usage",
      "Restricted access to authorized personnel",
      "Defined retention and deletion policies",
    ],
    warning:
      "Never share your Aadhaar OTP, passwords or identity documents with unknown people.",
    faqEyebrow: "NEED MORE CLARITY?",
    faqTitle: "Frequently asked questions.",
    faqDesc:
      "Answers to common questions about PANKhojo’s PAN-finding service.",
    faqs: [
      {
        q: "What is PANKhojo?",
        a: "PANKhojo is an independent private PAN-finding service for people who have forgotten or misplaced their existing PAN number.",
      },
      {
        q: "Can I apply for a new PAN?",
        a: "PANKhojo is a private service that helps locate an existing PAN number. It does not provide new PAN applications or e-PAN downloads.",
      },
      {
        q: "Is PANKhojo a government website?",
        a: "No. PANKhojo is an independent private initiative. It is not affiliated with or endorsed by the Government of India, the Income Tax Department, Protean or UTIITSL.",
      },
      {
        q: "Will I have to pay?",
        a: "Any applicable service charge will be shown clearly before you decide to proceed with a request.",
      },
      {
        q: "How long does PAN recovery take?",
        a: "Our usual PAN-finding time is 2–3 days. This is an estimate, not a guarantee; delays may occur if additional verification or external records take longer. We will notify you when your request is completed.",
      },
      {
        q: "Will I need to share my Aadhaar OTP?",
        a: "Never share your Aadhaar OTP with an agent or another person. Any required authentication must be completed through an authorized and secure process.",
      },
    ],
    ctaTitle: "Good service starts with trust.",
    ctaDesc:
      "We're preparing a transparent and responsible PAN finding service experience.",
    ctaButton: "Call support",
    supportPhoneLabel: "Call support",
    supportEmailLabel: "Email support",
    supportHours: "For questions about payments, requests or delivery, contact our support team.",
    footerDesc:
      "Making PAN finding service simpler, clearer and more accessible.",
    quickLinks: "Explore",
    resources: "Useful links",
    official: "Income Tax Department",
    contactTitle: "Our presence",
    location: "Rajasthan, India",
    disclaimer:
      "PANKhojo is an independent private initiative and is not a government website or government representative. It is not affiliated with the Income Tax Department, Protean or UTIITSL. PANKhojo is a private PAN-finding service for existing PAN numbers. It is not a government service and does not guarantee that every request can be completed.",
    rights: "All rights reserved.",
    privacy: "Privacy",
    home: "Home",
    faqLabel: "Question",
  },

  hi: {
    nav: ["होम", "कैसे काम करता है", "हमें क्यों चुनें", "सवाल-जवाब"],
    contact: "संपर्क करें",
    eyebrow: "स्वतंत्र PAN खोज सेवा",
    title: "PAN नंबर भूल गए? आइए, रिकवरी आसान बनाएं।",
    subtitle:
      "उन लोगों के लिए PAN खोज सेवा जिन्होंने अपना मौजूदा PAN नंबर खो दिया है या भूल गए हैं।",
    primary: "प्रक्रिया जानें",
    secondary: "PANKhojo क्यों?",
    existing: "केवल मौजूदा PAN धारकों के लिए",
    cardTitle: "PAN नंबर खो गया?",
    cardDesc:
      "अपने मौजूदा PAN नंबर को खोजने के लिए जरूरी जानकारी और प्रक्रिया प्राप्त करें।",
    status: "PAN खोज सेवा",
    statusDesc:
      "जिन लोगों का मौजूदा PAN नंबर खो गया है या याद नहीं है, उनके लिए सरल PAN खोज प्रक्रिया।",
    disabled: "अनुरोध शुरू करें",
    trust: ["स्पष्ट प्रक्रिया", "पारदर्शी शुल्क", "गोपनीयता"],
    processEyebrow: "सरल और पारदर्शी",
    processTitle: "हर चरण में स्पष्ट प्रक्रिया।",
    processDesc:
      "हमारा मानना है कि ग्राहकों को अपने अनुरोध की प्रक्रिया की पूरी जानकारी होनी चाहिए।",
    steps: [
      {
        title: "अपना अनुरोध जमा करें",
        desc: "सुरक्षित अनुरोध प्रणाली के माध्यम से जरूरी जानकारी दें।",
      },
      {
        title: "अनुरोध की प्रोसेसिंग",
        desc: "हमारी टीम आपके विवरण की समीक्षा करेगी और लागू सत्यापन प्रक्रिया का पालन करेगी।",
      },
      {
        title: "अपना PAN नंबर प्राप्त करें",
        desc: "सफल प्रोसेसिंग के बाद परिणाम आपके सत्यापित संपर्क पर सुरक्षित रूप से भेजा जाएगा।",
      },
    ],
    whyEyebrow: "PANKHOJO की सोच",
    whyTitle: "स्पष्टता और जिम्मेदारी के साथ तैयार।",
    whyDesc:
      "पहचान से जुड़ी महत्वपूर्ण जानकारी के लिए पेशेवर और पारदर्शी अनुभव जरूरी है।",
    benefits: [
      {
        title: "आसान अनुभव",
        desc: "बिना उलझन और अनावश्यक चरणों के सरल सेवा।",
      },
      {
        title: "पारदर्शी शुल्क",
        desc: "भुगतान से पहले सभी लागू शुल्क और शर्तें स्पष्ट होंगी।",
      },
      {
        title: "गोपनीयता महत्वपूर्ण",
        desc: "व्यक्तिगत जानकारी केवल आवश्यकता होने पर ली जाएगी।",
      },
      {
        title: "ग्राहक सहायता",
        desc: "सवालों और सेवा से जुड़ी समस्याओं के लिए सहायता माध्यम।",
      },
    ],
    privacyEyebrow: "आपकी जानकारी महत्वपूर्ण है",
    privacyTitle: "आपकी पहचान की सुरक्षा जरूरी है।",
    privacyDesc:
      "PAN और Aadhaar की जानकारी संवेदनशील है। हमारी सेवा न्यूनतम डेटा, स्पष्ट सहमति और जिम्मेदार जानकारी प्रबंधन पर आधारित होगी।",
    privacyPoints: [
      "केवल आवश्यक जानकारी",
      "डेटा उपयोग की स्पष्ट जानकारी",
      "अधिकृत कर्मचारियों तक सीमित पहुंच",
      "डेटा रखने और हटाने की निर्धारित नीति",
    ],
    warning:
      "अपना Aadhaar OTP, पासवर्ड या पहचान दस्तावेज अनजान लोगों के साथ साझा न करें।",
    faqEyebrow: "और जानकारी चाहिए?",
    faqTitle: "अक्सर पूछे जाने वाले सवाल।",
    faqDesc: "PANKhojo की PAN खोज सेवा से जुड़े सामान्य सवालों के जवाब।",
    faqs: [
      {
        q: "PANKhojo क्या है?",
        a: "PANKhojo एक स्वतंत्र निजी PAN खोज सेवा है, जो भूले हुए या खोए हुए मौजूदा PAN नंबर को खोजती है।",
      },
      {
        q: "क्या मैं नया PAN बनवा सकता हूं?",
        a: "PANKhojo एक निजी सेवा है जो मौजूदा PAN नंबर खोजती है। नई PAN एप्लिकेशन और e-PAN डाउनलोड इस सेवा में शामिल नहीं हैं।",
      },
      {
        q: "क्या PANKhojo सरकारी वेबसाइट है?",
        a: "नहीं। PANKhojo एक स्वतंत्र निजी पहल है। इसका भारत सरकार, आयकर विभाग, Protean या UTIITSL से कोई आधिकारिक संबंध नहीं है।",
      },
      {
        q: "क्या इसके लिए भुगतान करना होगा?",
        a: "आगे बढ़ने से पहले लागू सेवा शुल्क आपको स्पष्ट रूप से बताए जाएंगे।",
      },
      {
        q: "PAN रिकवरी में कितना समय लगेगा?",
        a: "PAN खोजने में सामान्यतः 2–3 दिन लगते हैं। यह अनुमान है, गारंटी नहीं। अतिरिक्त सत्यापन या बाहरी रिकॉर्ड के कारण देरी हो सकती है। अनुरोध पूरा होने पर आपको सूचित किया जाएगा।",
      },
      {
        q: "क्या मुझे Aadhaar OTP देना होगा?",
        a: "अपना Aadhaar OTP किसी एजेंट या अन्य व्यक्ति को न बताएं। आवश्यक प्रमाणीकरण केवल अधिकृत और सुरक्षित प्रक्रिया से होना चाहिए।",
      },
    ],
    ctaTitle: "अच्छी सेवा की शुरुआत भरोसे से होती है।",
    ctaDesc:
      "मौजूदा PAN खोज सेवा के लिए स्पष्ट और सरल प्रक्रिया।",
    ctaButton: "सहायता से कॉल करें",
    supportPhoneLabel: "सहायता के लिए कॉल करें",
    supportEmailLabel: "ईमेल सहायता",
    supportHours: "भुगतान, अनुरोध या डिलीवरी से जुड़े सवालों के लिए हमारी सहायता टीम से संपर्क करें।",
    footerDesc:
      "मौजूदा PAN नंबर खोजना आसान और स्पष्ट बनाना।",
    quickLinks: "जानकारी",
    resources: "उपयोगी लिंक",
    official: "आयकर विभाग",
    contactTitle: "हमारी उपस्थिति",
    location: "राजस्थान, भारत",
    disclaimer:
      "PANKhojo एक स्वतंत्र निजी पहल है, सरकारी वेबसाइट या सरकारी प्रतिनिधि नहीं। इसका आयकर विभाग, Protean या UTIITSL से कोई संबंध नहीं है। PANKhojo मौजूदा PAN नंबर खोजने की एक स्वतंत्र निजी सेवा है। यह सरकारी सेवा नहीं है और हर अनुरोध पूरा होने की गारंटी नहीं देता।",
    rights: "सर्वाधिकार सुरक्षित।",
    privacy: "गोपनीयता",
    home: "होम",
    faqLabel: "सवाल",
  },
};

const officialUrl = "https://www.incometax.gov.in/";

function Brand({ light = false }) {
  return (
    <a href="#home" className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17365D] text-white shadow-sm">
        <Fingerprint size={26} strokeWidth={1.8} />
      </div>
      <div>
        <div
          className={`font-display text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-[#17365D]"
            }`}
        >
          <span>PAN</span><span className="text-[#16A68A]">Khojo</span>
        </div>
        <div
          className={`mt-0.5 text-[9px] font-bold tracking-[0.17em] ${light ? "text-blue-200" : "text-slate-400"
            }`}
        >
          PAN FINDER SERVICE
        </div>
      </div>
    </a>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#168F7A]">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-[#172438] sm:text-[40px]">
        {title}
      </h2>
      <p className="mx-auto mt-5 max-w-xl text-[15px] leading-8 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function App() {
  const [language, setLanguage] = useState("en");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);
  const [showRequestPreview, setShowRequestPreview] = useState(false);
  const [showTracking, setShowTracking] = useState(new URLSearchParams(window.location.search).get("track") === "1");
  const [showPaymentTracking, setShowPaymentTracking] = useState(new URLSearchParams(window.location.search).get("payment") === "1");

  const t = translations[language];

  if (showRequestPreview) {
    return <RequestPreview language={language} onBack={() => setShowRequestPreview(false)} />;
  }
  if (showTracking) {
    return <TrackRequest language={language} onBack={() => { setShowTracking(false); window.history.replaceState({}, "", window.location.pathname); }} />;
  }
  if (showPaymentTracking) {
    return <TrackPayment onBack={() => { setShowPaymentTracking(false); window.history.replaceState({}, "", window.location.pathname); }} />;
  }
  const navIds = ["home", "how-it-works", "why-us", "faqs"];

  const benefitIcons = [
    ClipboardCheck,
    IndianRupee,
    LockKeyhole,
    Headset,
  ];

  const closeMenu = () => setMobileOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFBFD] text-[#172438]">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-[#E8ECF1] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Brand />

          <nav className="hidden items-center gap-9 lg:flex">
            {t.nav.map((item, index) => (
              <a
                key={item}
                href={`#${navIds[index]}`}
                className="text-[13px] font-semibold text-slate-600 transition hover:text-[#17365D]"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              onClick={() =>
                setLanguage(language === "en" ? "hi" : "en")
              }
              className="flex items-center gap-2 rounded-lg border border-[#E3E8EF] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Languages size={17} />
              {language === "en" ? "हिन्दी" : "English"}
            </button>

            <button
              onClick={() => setShowTracking(true)}
              className="rounded-lg border border-[#DCE5EE] px-4 py-2.5 text-sm font-bold text-[#17365D] transition hover:bg-slate-50"
            >
              Track Request
            </button>
            <button onClick={() => setShowPaymentTracking(true)} className="rounded-lg border border-[#DCE5EE] px-4 py-2.5 text-sm font-bold text-[#176B5A] transition hover:bg-slate-50">Track Payment</button>
            <a
              href="#contact"
              className="flex items-center gap-2 rounded-lg bg-[#17365D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#244C79]"
            >
              {t.contact}
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() =>
                setLanguage(language === "en" ? "hi" : "en")
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"
            >
              {language === "en" ? "हिन्दी" : "EN"}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2.5 transition hover:bg-slate-100"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-slate-100 bg-white px-5 py-4 lg:hidden">
            {t.nav.map((item, index) => (
              <a
                key={item}
                href={`#${navIds[index]}`}
                onClick={closeMenu}
                className="block rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {item}
              </a>
            ))}
            <button
              onClick={() => { closeMenu(); setShowTracking(true); }}
              className="mt-2 block w-full rounded-lg border border-[#DCE5EE] px-4 py-3 text-center text-sm font-bold text-[#17365D]"
            >
              Track Request
            </button>
            <button onClick={() => { closeMenu(); setShowPaymentTracking(true); }} className="mt-2 block w-full rounded-lg border border-[#DCE5EE] px-4 py-3 text-center text-sm font-bold text-[#176B5A]">Track Payment</button>
            <a
              href="#contact"
              onClick={closeMenu}
              className="mt-2 block rounded-lg bg-[#17365D] px-4 py-3 text-center text-sm font-bold text-white"
            >
              {t.contact}
            </a>
          </nav>
        )}
      </header>

      <main>

        {/* HERO SECTION */}

        <section
          id="home"
          className="scroll-mt-24 border-b border-[#E9EDF2] bg-white"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[1.05fr_.95fr] lg:px-10">

            <div>
              <div className="mb-8 inline-flex items-center gap-2.5 rounded-md bg-[#EAF6F3] px-3.5 py-2">
                <span className="h-2 w-2 rounded-full bg-[#52749A]" />
                <span className="text-[10px] font-extrabold tracking-[0.15em] text-[#167A6A] sm:text-[11px]">
                  {t.eyebrow}
                </span>
              </div>

              <h1 className="max-w-2xl font-display text-[39px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#172438] sm:text-5xl lg:text-[58px]">
                {t.title}
              </h1>

              <p className="mt-7 max-w-xl text-[16px] leading-8 text-slate-500">
                {t.subtitle}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#17365D] px-7 py-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#244C79] hover:shadow-lg"
                >
                  {t.primary}
                  <ArrowRight size={17} />
                </a>

                <a
                  href="#why-us"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#DCE3EA] bg-white px-7 py-4 text-sm font-bold text-[#29415D] transition hover:bg-[#F5F8FB]"
                >
                  {t.secondary}
                  <ChevronRight size={17} />
                </a>
              </div>

              <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CheckCircle2 size={16} className="text-emerald-600" />
                {t.existing}
              </div>
            </div>

            {/* SERVICE PANEL */}

            <div className="mx-auto w-full max-w-[475px]">
              <div className="overflow-hidden rounded-2xl border border-[#E5EAF0] bg-white shadow-[0_14px_45px_rgba(20,40,70,0.07)]">

                <div className="border-b border-[#E9EDF2] px-6 py-7 sm:px-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF6F3] text-[#17365D]">
                      <Fingerprint size={27} />
                    </div>

                    <div className="flex-1">
                      <h2 className="font-display text-lg font-extrabold text-[#172438]">
                        {t.cardTitle}
                      </h2>
                      <p className="mt-1 text-xs text-slate-400">
                        {t.existing}
                      </p>
                    </div>

                    <ShieldCheck size={24} className="text-[#168F7A]" />
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <p className="text-sm leading-7 text-slate-500">
                    {t.cardDesc}
                  </p>

                  <div className="mt-7 rounded-xl border border-[#DCECE7] bg-[#F3FAF7] p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        size={21}
                        className="mt-0.5 shrink-0 text-[#168F7A]"
                      />
                      <div>
                        <p className="text-sm font-bold text-[#1D4A43]">
                          {language === "en" ? "PAN finding for existing PAN holders" : "मौजूदा PAN धारकों के लिए PAN खोज"}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-[#52716A]">
                          {language === "en" ? "For individuals who have forgotten or misplaced their PAN number. New PAN applications are not included." : "उन लोगों के लिए जो अपना PAN नंबर भूल गए हैं या खो चुके हैं। नई PAN एप्लिकेशन इसमें शामिल नहीं हैं।"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowRequestPreview(true)}
                    className="mt-5 w-full rounded-lg bg-[#17365D] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#244C79]"
                  >
                    {language === "en" ? "Start your request" : "अनुरोध शुरू करें"}
                  </button>

                  <div className="mt-7 grid grid-cols-3 divide-x divide-[#E9EDF2] border-t border-[#E9EDF2] pt-6">
                    {t.trust.map((item, index) => {
                      const icons = [
                        ClipboardCheck,
                        IndianRupee,
                        LockKeyhole,
                      ];
                      const Icon = icons[index];

                      return (
                        <div key={item} className="px-2 text-center">
                          <Icon
                            size={19}
                            className="mx-auto text-[#168F7A]"
                          />
                          <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-500">
                            {item}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] text-slate-400">
                Independent private service · Rajasthan, India
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}

        <section
          id="how-it-works"
          className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow={t.processEyebrow}
              title={t.processTitle}
              description={t.processDesc}
            />

            <div className="grid gap-6 md:grid-cols-3">
              {t.steps.map((step, index) => {
                const icons = [FileText, ClipboardCheck, Mail];
                const Icon = icons[index];

                return (
                  <article
                    key={step.title}
                    className="border border-[#E5EAF0] bg-white p-8 transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(20,40,70,0.06)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF6F3] text-[#167A6A]">
                        <Icon size={23} />
                      </div>
                      <span className="font-display text-3xl font-extrabold text-[#E7EDF3]">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-7 font-display text-lg font-extrabold text-[#172438]">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {step.desc}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* WHY PANKHOJO */}

        <section
          id="why-us"
          className="scroll-mt-24 border-y border-[#E9EDF2] bg-white px-5 py-24 sm:px-8 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow={t.whyEyebrow}
              title={t.whyTitle}
              description={t.whyDesc}
            />

            <div className="grid gap-0 border border-[#E5EAF0] sm:grid-cols-2 lg:grid-cols-4">
              {t.benefits.map((benefit, index) => {
                const Icon = benefitIcons[index];

                return (
                  <article
                    key={benefit.title}
                    className={`p-7 sm:p-8 ${index !== 0 ? "border-t border-[#E5EAF0] sm:border-l sm:border-t-0" : ""
                      }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EAF6F3] text-[#167A6A]">
                      <Icon size={22} />
                    </div>

                    <h3 className="mt-6 font-display text-base font-extrabold text-[#172438]">
                      {benefit.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {benefit.desc}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRIVACY */}

        <section
          id="privacy"
          className="scroll-mt-24 bg-[#142F4E] px-5 py-24 text-white sm:px-8 lg:px-10"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">

            <div>
              <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#9DE3D3]">
                {t.privacyEyebrow}
              </p>

              <h2 className="max-w-xl font-display text-3xl font-extrabold leading-tight sm:text-[40px]">
                {t.privacyTitle}
              </h2>

              <p className="mt-6 max-w-xl text-[15px] leading-8 text-blue-100/75">
                {t.privacyDesc}
              </p>

              <div className="mt-9 grid gap-5 sm:grid-cols-2">
                {t.privacyPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-[#65D6B5]"
                    />
                    <span className="text-sm font-medium leading-6 text-blue-50">
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-white/15 bg-white/[0.05] p-8 sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-[#D2E3F5]">
                <LockKeyhole size={27} />
              </div>

              <h3 className="mt-7 font-display text-xl font-extrabold">
                Your information matters.
              </h3>

              <p className="mt-4 text-sm leading-7 text-blue-100/70">
                {t.warning}
              </p>

              <div className="mt-8 border-t border-white/15 pt-6">
                <div className="flex items-center gap-3 text-sm font-semibold text-blue-100">
                  <ShieldCheck size={19} />
                  Responsible information handling
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}

        <section
          id="faqs"
          className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-10"
        >
          <div className="mx-auto max-w-3xl">
            <SectionHeading
              eyebrow={t.faqEyebrow}
              title={t.faqTitle}
              description={t.faqDesc}
            />

            <div className="border-t border-[#E5EAF0]">
              {t.faqs.map((faq, index) => {
                const isOpen = activeFaq === index;

                return (
                  <div
                    key={faq.q}
                    className="border-b border-[#E5EAF0]"
                  >
                    <button
                      onClick={() =>
                        setActiveFaq(isOpen ? -1 : index)
                      }
                      className="flex w-full items-center justify-between gap-5 py-6 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="font-display text-[15px] font-bold leading-6 text-[#172438] sm:text-base">
                        {faq.q}
                      </span>

                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-[#168F7A] transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="pb-7 pr-8">
                        <p className="text-sm leading-8 text-slate-500">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CONTACT CTA */}

        <section
          id="contact"
          className="scroll-mt-24 px-5 pb-24 sm:px-8 lg:px-10"
        >
          <div className="mx-auto max-w-7xl border border-[#E2E8F0] bg-white px-7 py-14 text-center sm:px-12 sm:py-16">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF6F3] text-[#167A6A]">
              <Headset size={24} />
            </div>

            <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-[#172438] sm:text-4xl">
              {t.ctaTitle}
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
              {t.ctaDesc}
            </p>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
              {t.supportHours}
            </p>

            <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
              <a
                href="tel:+917725943124"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#17365D] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#244C79]"
              >
                <Headset size={18} />
                <span className="text-left">
                  <span className="block">{t.supportPhoneLabel}</span>
                  <span className="mt-0.5 block text-xs font-medium text-blue-100">7725943124</span>
                </span>
              </a>
              <a
                href="mailto:support.pankhojo.in@gmail.com"
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-[#DCE5EE] bg-[#FAFBFD] px-6 py-4 text-sm font-bold text-[#17365D] transition hover:bg-[#F0F5F8]"
              >
                <Mail size={18} />
                <span className="text-left">
                  <span className="block">{t.supportEmailLabel}</span>
                  <span className="mt-0.5 block break-all text-xs font-medium text-slate-500">support.pankhojo.in@gmail.com</span>
                </span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}

      <footer className="bg-[#10253E] px-5 pb-8 pt-16 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-12 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">

            <div>
              <Brand light />
              <p className="mt-6 max-w-xs text-sm leading-7 text-slate-400">
                {t.footerDesc}
              </p>
            </div>

            <div>
              <h4 className="mb-6 text-sm font-extrabold">
                {t.quickLinks}
              </h4>

              <div className="flex flex-col gap-4 text-sm text-slate-400">
                {t.nav.map((item, index) => (
                  <a
                    key={item}
                    href={`#${navIds[index]}`}
                    className="transition hover:text-white"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-6 text-sm font-extrabold">
                {t.resources}
              </h4>

              <a
                href={officialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
              >
                {t.official}
                <ArrowUpRight size={14} />
              </a>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <a href="/refund-policy.html" className="transition hover:text-white">Cancellation & Refund Policy</a>
                <a href="/terms.html" className="transition hover:text-white">Terms & Conditions</a>
              </div>
            </div>

            <div>
              <h4 className="mb-6 text-sm font-extrabold">
                {t.contactTitle}
              </h4>

              <div className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin size={17} />
                {t.location}
              </div>

              <a
                href="tel:+917725943124"
                className="mt-4 flex items-center gap-3 text-sm text-slate-400 transition hover:text-white"
              >
                <Headset size={16} />
                <span>7725943124</span>
              </a>
              <a
                href="mailto:support.pankhojo.in@gmail.com"
                className="mt-3 flex items-start gap-3 break-all text-sm text-slate-400 transition hover:text-white"
              >
                <Mail size={16} className="mt-0.5 shrink-0" />
                <span>support.pankhojo.in@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="border-b border-white/10 py-7">
            <p className="text-xs leading-7 text-slate-500">
              {t.disclaimer}
            </p>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 pt-7 text-xs text-slate-500 sm:flex-row">
            <p>
              © {new Date().getFullYear()} PANKhojo. {t.rights}
            </p>

            <div className="flex gap-6">
              <a href="#privacy" className="hover:text-white">
                {t.privacy}
              </a>
              <a href="#home" className="hover:text-white">
                {t.home}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
