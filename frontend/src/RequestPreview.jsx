
import { useEffect, useState } from "react";
import "./RequestPreview.css";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CircleHelp, Copy,
  Clock3, Fingerprint, LockKeyhole, Mail, MapPin, Phone,
  ShieldCheck, UserRound, X
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const initial = {
  fullName: "",
  email: "",
  phone: "",
  aadhaarNumber: "",
  dateOfBirth: "",
  fatherName: "",
  city: "",
  state: ""
};

const copy = {
  en: {
    back: "Back to home",
    title: "Find your existing PAN",
    intro: "Submit your details so we can find your existing PAN information.",
    section: "Your information",
    sectionText: "Please provide accurate information so our team can review your request.",
    fullName: "Full name",
    email: "Email address",
    phone: "Mobile number",
    dob: "Date of birth",
    father: "Father's name (optional)",
    city: "City",
    state: "State",
    aadhaar: "Aadhaar number",
    submit: "Continue to UPI payment",
    submitting: "Preparing payment...",
    paymentFailed: "Payment could not be completed. No request has been created.",
    required: "Please complete the required fields and accept both the Privacy Policy and Terms of Service.",
    failed: "Unable to submit your request. Please try again.",
    success: "Your request has been submitted successfully.",
    ref: "Your request reference number",
    note: "Your request is created only after payment is verified.",
    help: "Need help?",
    helpText: "For assistance, please contact our support team.",
    processTitle: "How PANKhojo works",
    processIntro: "We provide a paid PAN-finding service for locating existing PAN details where the request and processing method are lawful and available.",
    process: [
      ["Submit your request", "Enter your contact details and the information required for your request."],
      ["Request review", "Our team reviews your information and checks whether your request can be processed."],
      ["Request processing", "Eligible requests are handled through the applicable authorised process."],
      ["Receive an update", "We contact you with an update using your registered contact details."]
    ],
    eligibilityTitle: "Who can use this service?",
    eligibilityText: "Individuals seeking to find their own existing PAN details. A parent or legally authorised representative may submit a request where legally permitted and with appropriate authority.",
    privacyNoticeTitle: "Your information matters",
    privacyNoticeText: "Your information is used to handle your request in accordance with our Privacy Policy. Please only provide information you are authorised to share.",
    privacyCheck: "I have read and agree to the Privacy Policy.",
    termsCheck: "I have read and agree to the Terms of Service.",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    independent: "PANKhojo is an independent private PAN-finding service. It is not affiliated with or operated by the Government of India or the Income Tax Department.",
    consentRequired: "Please read and accept both documents before submitting your request.",
    close: "Close",
    stepOne: "Your details",
    stepTwo: "Review request",
    stepThree: "Payment",
    reviewTitle: "Review your information",
    reviewIntro: "Check these details carefully before continuing to payment.",
    editDetails: "Edit details",
    payNow: "Continue to UPI payment",
    paymentProcessing: "Verifying payment...",
    serviceFee: "Payment amount",
    feeNotice: "Scan the PANKhojo UPI QR code, pay the exact amount, then submit your UPI transaction reference. Your request is created only after our team verifies the bank credit.",
    maskedAadhaar: "XXXX XXXX",
    optionalNotProvided: "Not provided",
    paymentSuccessTitle: "Payment submitted for verification",
    paymentSuccessText: "We have received your UPI transaction details. Your request will be created after our team verifies the payment in the business bank account.",
    receiptSentText: "You will receive your request reference by email after payment verification.",
    receiptPendingText: "Please do not make another payment while this payment is being checked. Keep your UPI transaction reference for your records.",
    emailNotice: "We will email your request reference after your payment is verified."
  },
  hi: {
    back: "होम पर वापस जाएं",
    title: "अपना मौजूदा PAN खोजें",
    intro: "अपना मौजूदा PAN खोजने के लिए आवश्यक जानकारी सबमिट करें।",
    section: "आपकी जानकारी",
    sectionText: "कृपया सही जानकारी दें ताकि हमारी टीम आपके अनुरोध की समीक्षा कर सके।",
    fullName: "पूरा नाम",
    email: "ईमेल पता",
    phone: "मोबाइल नंबर",
    dob: "जन्म तिथि",
    father: "पिता का नाम (वैकल्पिक)",
    city: "शहर",
    state: "राज्य",
    aadhaar: "आधार नंबर",
    submit: "UPI भुगतान के लिए आगे बढ़ें",
    submitting: "भुगतान तैयार हो रहा है...",
    paymentFailed: "भुगतान पूरा नहीं हुआ। कोई अनुरोध नहीं बनाया गया है।",
    required: "कृपया सभी जरूरी जानकारी भरें और गोपनीयता नीति तथा सेवा की शर्तें स्वीकार करें।",
    failed: "आपका अनुरोध सबमिट नहीं हो सका। कृपया दोबारा प्रयास करें।",
    success: "आपका अनुरोध सफलतापूर्वक सबमिट हो गया है।",
    ref: "आपका अनुरोध रेफरेंस नंबर",
    note: "भुगतान सत्यापित होने के बाद ही आपका अनुरोध बनाया जाएगा।",
    help: "मदद चाहिए?",
    helpText: "सहायता के लिए हमारी सपोर्ट टीम से संपर्क करें।",
    processTitle: "PANKhojo कैसे काम करता है",
    processIntro: "हम मौजूदा PAN जानकारी खोजने की निजी सेवा प्रदान करते हैं, जहां अनुरोध और प्रक्रिया कानूनन अनुमत हो।",
    process: [
      ["अनुरोध सबमिट करें", "अपनी संपर्क जानकारी और आवश्यक विवरण भरें।"],
      ["अनुरोध की समीक्षा", "हमारी टीम आपकी जानकारी की समीक्षा करती है।"],
      ["अनुरोध की प्रक्रिया", "पात्र अनुरोधों को लागू अधिकृत प्रक्रिया के अनुसार संभाला जाता है।"],
      ["अपडेट प्राप्त करें", "हम आपके दिए गए संपर्क विवरण पर आपसे संपर्क करते हैं।"]
    ],
    eligibilityTitle: "इस सेवा का उपयोग कौन कर सकता है?",
    eligibilityText: "वे व्यक्ति जो अपना मौजूदा PAN विवरण खोजना चाहते हैं। माता-पिता या कानूनी रूप से अधिकृत प्रतिनिधि उचित अधिकार होने पर अनुरोध कर सकते हैं।",
    privacyNoticeTitle: "आपकी जानकारी हमारे लिए महत्वपूर्ण है",
    privacyNoticeText: "आपकी जानकारी का उपयोग हमारी गोपनीयता नीति के अनुसार आपके अनुरोध को संभालने के लिए किया जाता है। केवल वही जानकारी दें जिसे साझा करने का आपको अधिकार है।",
    privacyCheck: "मैंने गोपनीयता नीति पढ़ी है और उससे सहमत हूं।",
    termsCheck: "मैंने सेवा की शर्तें पढ़ी हैं और उनसे सहमत हूं।",
    privacy: "गोपनीयता नीति",
    terms: "सेवा की शर्तें",
    independent: "PANKhojo एक स्वतंत्र निजी PAN खोज सेवा है। इसका भारत सरकार या आयकर विभाग से कोई संबंध नहीं है।",
    consentRequired: "कृपया अनुरोध सबमिट करने से पहले दोनों दस्तावेज पढ़कर स्वीकार करें।",
    close: "बंद करें",
    stepOne: "आपकी जानकारी",
    stepTwo: "अनुरोध की समीक्षा",
    stepThree: "भुगतान",
    reviewTitle: "अपनी जानकारी की समीक्षा करें",
    reviewIntro: "भुगतान से पहले कृपया सभी विवरण ध्यान से जांच लें।",
    editDetails: "जानकारी बदलें",
    payNow: "UPI भुगतान के लिए आगे बढ़ें",
    paymentProcessing: "भुगतान सत्यापित हो रहा है...",
    serviceFee: "भुगतान राशि",
    feeNotice: "PANKhojo का UPI QR स्कैन करें, सही राशि का भुगतान करें और UPI ट्रांजैक्शन रेफरेंस सबमिट करें। बैंक में भुगतान सत्यापित होने के बाद ही अनुरोध बनाया जाएगा।",
    maskedAadhaar: "XXXX XXXX",
    optionalNotProvided: "नहीं दिया गया",
    paymentSuccessTitle: "भुगतान सत्यापन के लिए भेजा गया",
    paymentSuccessText: "आपके UPI भुगतान की जानकारी मिल गई है। बैंक में भुगतान सत्यापित होने के बाद ही आपका अनुरोध बनाया जाएगा।",
    receiptSentText: "भुगतान सत्यापन के बाद अनुरोध रेफरेंस आपके ईमेल पर भेजा जाएगा।",
    receiptPendingText: "सत्यापन के दौरान दोबारा भुगतान न करें। UPI ट्रांजैक्शन रेफरेंस अपने पास सुरक्षित रखें।",
    emailNotice: "भुगतान सत्यापित होने के बाद अनुरोध रेफरेंस ईमेल किया जाएगा।"
  }
};

const legalDocuments = {
  privacy: {
    en: [
      ["1. Information we collect", "We may collect your name, email address, mobile number, date of birth, city, state and information necessary to handle your request. Aadhaar information must only be collected and processed where a lawful basis and authorised process have been established."],
      ["2. How we use information", "Information is used to receive, review and process your request, communicate with you, prevent misuse, maintain necessary records and comply with applicable legal requirements."],
      ["3. Sharing of information", "We do not sell personal information. Information may be shared with service providers or other parties only where necessary for the stated purpose and permitted by applicable law."],
      ["4. Data security", "We use reasonable technical and organisational safeguards to protect information. However, no online transmission or storage system can be guaranteed to be completely secure."],
      ["5. Retention and deletion", "Information is retained only for as long as reasonably necessary for the service, support, dispute resolution and legal obligations. You may request deletion, subject to information that must lawfully be retained."],
      ["6. Your rights", "You may contact us to request access, correction, erasure or withdrawal of consent, where applicable. Withdrawal may affect our ability to continue processing your request."],
      ["7. Contact and complaints", "For privacy questions or complaints, contact: [PRIVACY EMAIL]. Grievance contact: [NAME / ROLE / EMAIL / POSTAL ADDRESS]."]
    ],
    hi: [
      ["1. हम कौन-सी जानकारी लेते हैं", "हम आपका नाम, ईमेल, मोबाइल नंबर, जन्म तिथि, शहर, राज्य और अनुरोध के लिए आवश्यक जानकारी एकत्र कर सकते हैं। आधार संबंधी जानकारी केवल वैध आधार और अधिकृत प्रक्रिया होने पर ही ली और उपयोग की जानी चाहिए।"],
      ["2. जानकारी का उपयोग", "जानकारी का उपयोग आपके अनुरोध को प्राप्त करने, उसकी समीक्षा और प्रक्रिया करने, आपसे संपर्क करने, दुरुपयोग रोकने और कानूनी आवश्यकताओं का पालन करने के लिए किया जाता है।"],
      ["3. जानकारी साझा करना", "हम व्यक्तिगत जानकारी बेचते नहीं हैं। जानकारी केवल आवश्यक होने और कानून द्वारा अनुमति दिए जाने पर सेवा प्रदाताओं या अन्य पक्षों के साथ साझा की जा सकती है।"],
      ["4. जानकारी की सुरक्षा", "हम जानकारी की सुरक्षा के लिए उचित तकनीकी और संगठनात्मक उपाय अपनाते हैं। हालांकि, इंटरनेट पर किसी भी प्रणाली की पूर्ण सुरक्षा की गारंटी नहीं दी जा सकती।"],
      ["5. जानकारी रखना और हटाना", "जानकारी केवल सेवा, सहायता, विवाद समाधान और कानूनी आवश्यकताओं के लिए आवश्यक अवधि तक रखी जाती है। कानूनन रखी जाने वाली जानकारी को छोड़कर आप जानकारी हटाने का अनुरोध कर सकते हैं।"],
      ["6. आपके अधिकार", "जहां लागू हो, आप जानकारी देखने, सुधारने, हटाने या सहमति वापस लेने के लिए हमसे संपर्क कर सकते हैं।"],
      ["7. संपर्क और शिकायत", "गोपनीयता संबंधी प्रश्नों या शिकायतों के लिए संपर्क करें: [PRIVACY EMAIL]. शिकायत संपर्क: [NAME / ROLE / EMAIL / POSTAL ADDRESS]."]
    ]
  },
  terms: {
    en: [
      ["1. About PANKhojo", "PANKhojo is an independent private PAN-finding service. It is not a government website, government department or PAN issuing authority."],
      ["2. Service scope", "We provide assistance with requests relating to locating existing PAN details, where the request and processing method are lawful and available. We do not issue PAN numbers or PAN cards."],
      ["3. Eligibility and authority", "You must submit a request for yourself or have valid legal authority to act for the person concerned. You must not submit another person's information without the authority and consent required by law."],
      ["4. Accurate information", "You are responsible for providing accurate information and contact details. You must not impersonate another person, submit false information or use the service for an unlawful purpose."],
      ["5. Processing and third parties", "Requests may require processing through external service providers where legally permitted. Your consent does not authorise any activity prohibited by law. We may decline requests where lawful processing cannot be established."],
      ["6. No guaranteed outcome", "We do not guarantee that a PAN number will be found, that external records will match or that a request will be completed within a particular time. Official PAN services remain with the relevant authorities."],
      ["7. Fees, cancellation and refunds", "The fee is displayed before payment. If you cancel before PAN-finding work begins, you are eligible for a full refund. After work begins, refunds are reviewed case by case and are not automatic. If PANKhojo cancels because the request cannot be processed, a full refund is due. Duplicate payments are refunded. Approved refunds are initiated within 5–7 business days; banks or payment providers may take longer. No refund is generally available after successful secure delivery, except where required by law or a verified service failure. See the full Cancellation & Refund Policy at /refund-policy.html."],
      ["8. Suspension or refusal", "We may pause, refuse or cancel a request where information is incomplete, authority is unclear, misuse is suspected or processing may breach applicable law."],
      ["9. Liability", "Nothing in these terms excludes liability where exclusion is prohibited by law, including liability for fraud or wilful misconduct, or limits rights that cannot legally be waived. To the extent permitted by law, we are not responsible for delays caused by inaccurate customer information or unavailable external systems."],
      ["10. Complaints and disputes", "Please contact [SUPPORT EMAIL] so we can attempt to resolve your concern. Nothing in these terms prevents you from exercising rights available under applicable Indian law or approaching a competent authority or forum."],
      ["11. Governing law", "These terms are governed by the laws of India, subject to mandatory consumer protections and the jurisdiction of competent courts."],
      ["12. Business contact", "Legal business name: [LEGAL BUSINESS NAME]. Address: [BUSINESS ADDRESS]. Support email: [SUPPORT EMAIL]. Grievance contact: [NAME / ROLE / EMAIL]."]
    ],
    hi: [
      ["1. PANKhojo के बारे में", "PANKhojo एक स्वतंत्र निजी PAN खोज सेवा है। यह सरकारी वेबसाइट, सरकारी विभाग या PAN जारी करने वाली संस्था नहीं है।"],
      ["2. सेवा का दायरा", "हम मौजूदा PAN विवरण खोजने की निजी सेवा प्रदान करते हैं, जहां अनुरोध और प्रक्रिया कानूनन अनुमत हों। हम PAN नंबर या PAN कार्ड जारी नहीं करते।"],
      ["3. पात्रता और अधिकार", "आप अपने लिए अनुरोध कर सकते हैं या संबंधित व्यक्ति की ओर से कार्य करने का वैध कानूनी अधिकार होना चाहिए। कानून के अनुसार आवश्यक अधिकार और सहमति के बिना किसी अन्य व्यक्ति की जानकारी न दें।"],
      ["4. सही जानकारी", "सही जानकारी और संपर्क विवरण देना आपकी जिम्मेदारी है। किसी अन्य व्यक्ति का रूप धारण करना, गलत जानकारी देना या गैरकानूनी उद्देश्य से सेवा का उपयोग करना मना है।"],
      ["5. प्रक्रिया और तीसरे पक्ष", "जहां कानून अनुमति देता है, अनुरोध को बाहरी सेवा प्रदाताओं के माध्यम से संभाला जा सकता है। आपकी सहमति किसी गैरकानूनी गतिविधि की अनुमति नहीं देती।"],
      ["6. परिणाम की गारंटी नहीं", "हम PAN मिलने, बाहरी रिकॉर्ड के मेल खाने या निश्चित समय में अनुरोध पूरा होने की गारंटी नहीं देते। आधिकारिक PAN सेवाएं संबंधित सरकारी प्राधिकरणों के अधिकार में रहती हैं।"],
      ["7. शुल्क, रद्दीकरण और रिफंड", "शुल्क भुगतान से पहले दिखाया जाएगा। PAN खोजने का काम शुरू होने से पहले अनुरोध रद्द करने पर पूरा रिफंड मिलेगा। काम शुरू होने के बाद रिफंड की समीक्षा मामले के अनुसार होगी और अपने-आप नहीं मिलेगा। यदि PANKhojo अनुरोध प्रोसेस नहीं कर सकता और उसे रद्द करता है, तो पूरा रिफंड मिलेगा। डुप्लीकेट भुगतान वापस किया जाएगा। स्वीकृत रिफंड 5–7 कार्यदिवसों में शुरू किया जाएगा; बैंक या पेमेंट सेवा को अधिक समय लग सकता है। सफलतापूर्वक जानकारी सुरक्षित रूप से भेजे जाने के बाद सामान्यतः रिफंड नहीं मिलेगा, सिवाय जहां कानून या सत्यापित सेवा विफलता के कारण आवश्यक हो। पूरी नीति /refund-policy.html पर पढ़ें।"],
      ["8. अनुरोध रोकना या अस्वीकार करना", "अधूरी जानकारी, अधिकार स्पष्ट न होने, दुरुपयोग की आशंका या कानून का उल्लंघन होने की स्थिति में हम अनुरोध रोक या अस्वीकार कर सकते हैं।"],
      ["9. जिम्मेदारी", "इन शर्तों से कानून द्वारा सुरक्षित अधिकार समाप्त नहीं होते। धोखाधड़ी या जानबूझकर गलत आचरण जैसी जिम्मेदारियों को कानून के विरुद्ध सीमित नहीं किया जाता।"],
      ["10. शिकायत और विवाद", "अपनी शिकायत के समाधान के लिए [SUPPORT EMAIL] पर संपर्क करें। ये शर्तें भारतीय कानून के अंतर्गत आपके अधिकारों को सीमित नहीं करतीं।"],
      ["11. लागू कानून", "ये शर्तें भारत के कानूनों के अधीन होंगी और अनिवार्य उपभोक्ता अधिकार सुरक्षित रहेंगे।"],
      ["12. व्यवसाय संपर्क", "कानूनी व्यवसाय नाम: [LEGAL BUSINESS NAME]. पता: [BUSINESS ADDRESS]. सपोर्ट ईमेल: [SUPPORT EMAIL]. शिकायत संपर्क: [NAME / ROLE / EMAIL]."]
    ]
  }
};

function Field({ name, label, value, onChange, type = "text", icon: Icon, required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-[#24364B]">
        {label}{required && <span className="text-[#D05B57]"> *</span>}
      </span>
      <span className="relative block">
        {Icon && <Icon size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B9AAF]" />}
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          maxLength={name === "phone" ? 10 : name === "aadhaarNumber" ? 12 : undefined}
          inputMode={(name === "phone" || name === "aadhaarNumber") ? "numeric" : undefined}
          placeholder={label}
          className={`h-[52px] w-full rounded-xl border border-[#DFE6EE] bg-white text-[14px] text-[#26384D] ${Icon ? "pl-11 pr-4" : "px-4"}`}
        />
      </span>
    </label>
  );
}

export default function RequestPreview({ language = "en", onBack }) {
  const t = copy[language] || copy.en;

  const [form, setForm] = useState(initial);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalDocument, setLegalDocument] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [utr, setUtr] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("form");
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [statusCheck, setStatusCheck] = useState(null);
  const [copied, setCopied] = useState("");
  const [showUtrForm, setShowUtrForm] = useState(false);
  const [autoChecking, setAutoChecking] = useState(false);

  const update = (e) => {
    const { name, value } = e.target;
    const next = (name === "phone" || name === "aadhaarNumber")
      ? value.replace(/\D/g, "").slice(0, name === "phone" ? 10 : 12)
      : value;

    setForm(v => ({ ...v, [name]: next }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !/^[6-9]\d{9}$/.test(form.phone) ||
      !/^[0-9]{12}$/.test(form.aadhaarNumber) ||
      !privacyAccepted ||
      !termsAccepted
    ) {
      setError(t.required);
      return;
    }

    setStep("review");
  };

  const startPayment = async () => {
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/payments/create-manual`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consent: true, consentDetails: { privacyAccepted, termsAccepted, privacyVersion: "1.0", termsVersion: "1.0" } })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || t.failed);
      setPaymentDetails(data);
      setSecondsLeft(15 * 60);
      setStatusCheck(null);
      setShowUtrForm(false);
      setAutoChecking(false);
      setStep("payment");
    } catch (err) { setError(err.message || t.failed); }
    finally { setBusy(false); }
  };

  const submitPaymentReference = async () => {
    setError(""); setBusy(true);
    try {
      const response = await fetch(`${API}/api/payments/submit-manual`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReference: paymentDetails.paymentReference, utr })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || t.failed);
      setResult({ message: data.message, email: form.email });
      setAutoChecking(true);
      setStep("complete");
    } catch (err) { setError(err.message || t.failed); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (step !== "payment" || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [step, secondsLeft > 0]);

  const copyPaymentValue = async (value, label) => {
    try { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(""), 1800); }
    catch { setError("Copy is unavailable on this device. Please copy the value manually."); }
  };

  const checkPaymentStatus = async ({ silent = false } = {}) => {
    if (!paymentDetails?.paymentReference || !utr.trim()) return;
    if (!silent) { setBusy(true); setError(""); }
    try {
      const response = await fetch(`${API}/api/payments/status-manual`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReference: paymentDetails.paymentReference, utr })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to check payment status.");
      setStatusCheck(data);
      if (data.status === "verified" || data.status === "rejected") setAutoChecking(false);
    } catch (err) {
      if (!silent) setError(err.message || "Unable to check payment status.");
    } finally { if (!silent) setBusy(false); }
  };

  // After the customer submits a UTR, refresh the server-side verification
  // status periodically. This detects an admin's manual approval; it does not
  // independently detect a bank payment.
  useEffect(() => {
    if (step !== "complete" || !autoChecking || !paymentDetails?.paymentReference || !utr.trim()) return;
    const timer = window.setInterval(() => checkPaymentStatus({ silent: true }), 5000);
    checkPaymentStatus({ silent: true });
    return () => window.clearInterval(timer);
  }, [step, autoChecking, paymentDetails?.paymentReference, utr]);

  const documentContent = legalDocument
    ? legalDocuments[legalDocument][language] || legalDocuments[legalDocument].en
    : [];

  return (
    <main className="pankhojo-request-page min-h-screen bg-[#F3F6F9] text-[#17283D]">
      <header className="border-b border-[#E7ECF1] bg-white">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <button onClick={onBack} className="flex items-center gap-2 font-semibold text-[#52667D]">
            <ArrowLeft size={17} />{t.back}
          </button>
          <strong className="text-xl text-[#17365D]">
            PAN<span className="text-[#16A68A]">Khojo</span>
          </strong>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1440px] lg:grid-cols-[.8fr_1.2fr]">
        <aside className="relative hidden flex-col overflow-hidden bg-[#17365D] px-10 py-12 text-white lg:flex xl:px-14">
          <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A8E7D8]">
            <ShieldCheck size={14} /> PAN FINDER SERVICE
          </div>

          <h1 className="max-w-[490px] text-[42px] font-bold leading-tight">
            Forgot your PAN number? We're here to help.
          </h1>

          <p className="mt-6 max-w-[440px] text-sm leading-7 text-[#C6D4E3]">
            {t.processIntro}
          </p>

          <h3 className="mt-10 text-lg font-bold">{t.processTitle}</h3>

          <div className="mt-5 space-y-6">
            {t.process.map(([heading, description], index) => (
              <div key={heading} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-[#82DEC7]">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{heading}</p>
                  <p className="mt-1 text-xs leading-5 text-[#C6D4E3]">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-white/15 bg-white/[0.06] p-4">
            <h3 className="font-bold">{t.eligibilityTitle}</h3>
            <p className="mt-2 text-xs leading-6 text-[#C6D4E3]">{t.eligibilityText}</p>
          </div>

          <div className="mt-auto border-t border-white/15 pt-7 text-xs leading-6 text-[#C2D0DF]">
            <ShieldCheck className="mb-2 text-[#8CE0CC]" />
            {t.independent}
          </div>
        </aside>

        <section className="px-4 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[760px]">
            <div className="mb-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#159B83]">
                PAN FINDER
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17365D]">
                {t.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#69798D]">{t.intro}</p>
            </div>

            <div className="mb-7 rounded-2xl bg-[#17365D] p-4 text-white sm:p-5">
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                <span className={step === "form" ? "text-[#82DEC7]" : ""}>01 · {t.stepOne}</span>
                <span className={step === "review" ? "text-[#82DEC7]" : ""}>02 · {t.stepTwo}</span>
                <span className={step === "payment" || step === "complete" ? "text-[#82DEC7]" : ""}>03 · {t.stepThree}</span>
              </div>
              <div className="mt-4 h-1 rounded-full bg-white/20">
                <div className="h-full rounded-full bg-[#70D9BE] transition-all" style={{ width: step === "form" ? "33.333%" : step === "review" ? "66.666%" : "100%" }} />
              </div>
            </div>

            <form onSubmit={submit} className="overflow-hidden rounded-[20px] border border-[#E4EAF0] bg-white shadow-[0_14px_40px_rgba(24,48,76,.055)]">
              <div className="border-b border-[#EDF1F5] px-5 py-5 sm:px-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5F2] text-[#148B76]">
                    <UserRound size={19} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#21364D]">{step === "form" ? t.section : step === "review" ? t.reviewTitle : t.stepThree}</h3>
                    <p className="text-xs text-[#8491A1]">{t.sectionText}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-8">
                {step === "form" && <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field name="fullName" label={t.fullName} value={form.fullName} onChange={update} icon={UserRound} required />
                  <Field name="email" label={t.email} value={form.email} onChange={update} type="email" icon={Mail} required />
                  <Field name="phone" label={t.phone} value={form.phone} onChange={update} type="tel" icon={Phone} required />
                  <Field name="aadhaarNumber" label={t.aadhaar} value={form.aadhaarNumber} onChange={update} type="password" icon={Fingerprint} required />
                  <Field name="dateOfBirth" label={t.dob} value={form.dateOfBirth} onChange={update} type="date" icon={CalendarDays} />
                  <Field name="fatherName" label={t.father} value={form.fatherName} onChange={update} icon={UserRound} />
                  <Field name="city" label={t.city} value={form.city} onChange={update} icon={MapPin} />
                  <Field name="state" label={t.state} value={form.state} onChange={update} icon={MapPin} />
                </div>

                <div className="mt-7 rounded-2xl border border-[#DCECE7] bg-[#F3FAF7] p-4">
                  <div className="flex gap-3">
                    <LockKeyhole size={19} className="mt-1 shrink-0 text-[#138B76]" />
                    <div>
                      <h4 className="text-sm font-bold text-[#1D4A43]">{t.privacyNoticeTitle}</h4>
                      <p className="mt-1 text-xs leading-6 text-[#52716A]">{t.privacyNoticeText}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4 rounded-xl border border-[#E4EAF0] p-4">
                  <label className="flex cursor-pointer items-start gap-3 text-xs leading-6 text-[#586A7E]">
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={e => setPrivacyAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#159B83]"
                    />
                    <span>
                      {t.privacyCheck}{" "}
                      <button type="button" onClick={() => setLegalDocument("privacy")} className="font-bold text-[#087F78] underline">
                        {t.privacy}
                      </button>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 text-xs leading-6 text-[#586A7E]">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#159B83]"
                    />
                    <span>
                      {t.termsCheck}{" "}
                      <button type="button" onClick={() => setLegalDocument("terms")} className="font-bold text-[#087F78] underline">
                        {t.terms}
                      </button>
                    </span>
                  </label>
                  <p className="pl-7 text-xs leading-5 text-slate-500">Cancellation & refund: <a href="/refund-policy.html" target="_blank" rel="noreferrer" className="font-bold text-[#087F78] underline">Read the full policy</a></p>
                </div>

                </>}

                {step === "review" && (
                  <div>
                    <h3 className="text-xl font-bold text-[#17365D]">{t.reviewTitle}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#69798D]">{t.reviewIntro}</p>
                    <div className="mt-6 grid gap-4 rounded-xl border border-[#E4EAF0] bg-[#FAFCFE] p-4 sm:grid-cols-2">
                      {[
                        [t.fullName, form.fullName], [t.email, form.email], [t.phone, form.phone],
                        [t.aadhaar, `${t.maskedAadhaar} ${form.aadhaarNumber.slice(-4)}`],
                        [t.dob, form.dateOfBirth || t.optionalNotProvided],
                        [t.father, form.fatherName || t.optionalNotProvided],
                        [t.city, form.city || t.optionalNotProvided], [t.state, form.state || t.optionalNotProvided]
                      ].map(([label, value]) => (
                        <div key={label} className="min-w-0">
                          <p className="text-xs text-[#8491A1]">{label}</p>
                          <p className="mt-1 break-words text-sm font-semibold text-[#26384D]">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 rounded-xl border border-[#DCECE7] bg-[#F3FAF7] p-4">
                      <p className="text-sm font-semibold text-[#1D4A43]">{t.serviceFee}</p>
                      <p className="mt-1 text-xs leading-6 text-[#52716A]">{t.feeNotice} {t.emailNotice}</p>
                    </div>
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                      <button type="button" onClick={() => { setStep("form"); setError(""); }} className="h-12 rounded-xl border border-[#D6E0E9] px-5 text-sm font-bold text-[#43566D]">{t.editDetails}</button>
                      <button type="button" onClick={startPayment} disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#17365D] px-5 text-sm font-bold text-white disabled:opacity-60">{busy ? t.paymentProcessing : t.payNow}<ArrowRight size={17}/></button>
                    </div>
                  </div>
                )}

                {step === "payment" && paymentDetails && (
                  <div className="overflow-hidden rounded-2xl border border-[#DCE5ED] bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-[#17365D] to-[#176B70] px-5 py-5 text-center text-white">
                      <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/15"><ShieldCheck size={23}/></div>
                      <p className="text-xs font-bold uppercase tracking-[.18em] text-white/75">PANKhojo secure checkout</p>
                      <p className="mt-2 text-3xl font-extrabold">₹{(paymentDetails.amount / 100).toFixed(2)}</p>
                      <p className="mt-1 text-xs text-white/80">PAN Finding Service Fee · INR</p>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between rounded-xl border border-[#DCECE7] bg-[#F3FAF7] px-3 py-3">
                        <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#668078]">Payment reference</p><p className="mt-1 break-all text-sm font-extrabold text-[#17365D]">{paymentDetails.paymentReference}</p></div>
                        <button type="button" onClick={() => copyPaymentValue(paymentDetails.paymentReference, "reference")} className="ml-2 rounded-lg border border-[#C9DED6] bg-white px-3 py-2 text-xs font-bold text-[#176B5A]"><Copy size={13} className="mr-1 inline"/>{copied === "reference" ? "Copied" : "Copy"}</button>
                      </div>
                      <div className="mt-4 rounded-2xl border border-[#E4EAF0] bg-[#FAFCFD] p-4 text-center">
                        <p className="text-sm font-extrabold text-[#17365D]">Pay to {paymentDetails.payeeName}</p>
                        <p className="mt-1 text-xs text-[#64758A]">Scan this merchant QR using your UPI app</p>
                        <img src={paymentDetails.qrImage} alt="Merchant UPI QR code" className="mx-auto mt-4 h-52 w-52 rounded-xl border border-[#E5EAF0] bg-white object-contain p-2" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        <p className="mt-3 break-all text-sm font-bold text-[#17365D]">{paymentDetails.upiId}</p>
                        <button type="button" onClick={() => copyPaymentValue(paymentDetails.upiId, "upi")} className="mt-2 rounded-lg border border-[#D8E2EA] bg-white px-3 py-2 text-xs font-bold text-[#43566D]"><Copy size={13} className="mr-1 inline"/>{copied === "upi" ? "Copied" : "Copy UPI ID"}</button>
                        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-left text-[11px] leading-5 text-amber-900">Before paying, confirm the payee name shown inside your UPI app matches <strong>{paymentDetails.payeeName}</strong> and the amount is exactly ₹{(paymentDetails.amount / 100).toFixed(2)}. If it does not match, do not pay and contact support.</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F5F7FA] px-3 py-3">
                        <div><p className="text-xs font-bold text-[#17365D]">Suggested payment window</p><p className="text-[10px] text-[#718198]">15 minutes from checkout</p></div>
                        <p className={`font-mono text-lg font-extrabold ${secondsLeft < 120 ? "text-amber-700" : "text-[#176B5A]"}`}>{String(Math.floor(secondsLeft/60)).padStart(2,"0")}:{String(secondsLeft%60).padStart(2,"0")}</p>
                      </div>
                      {secondsLeft === 0 && <p className="mt-2 text-xs leading-5 text-amber-800">The suggested payment window has passed. This does not prove a payment failed. If you already paid, enter your UTR below and submit it for reconciliation. Do not pay again until you have checked with support.</p>}
                      {!showUtrForm ? (
                        <button type="button" onClick={() => setShowUtrForm(true)} className="mt-5 h-12 w-full rounded-xl bg-[#17365D] px-5 text-sm font-bold text-white">I've completed payment · Verify UTR</button>
                      ) : (
                        <div className="mt-5 rounded-xl border border-[#DCE5ED] bg-[#F8FAFC] p-4">
                          <label className="mb-2 block text-sm font-bold text-[#17365D]">UPI transaction reference / UTR</label>
                          <input value={utr} onChange={(e) => {setUtr(e.target.value.replace(/[^A-Za-z0-9-]/g, "").slice(0,35));setStatusCheck(null);}} placeholder="Enter UPI transaction ID" autoComplete="off" className="h-12 w-full rounded-xl border border-[#D6E0E9] bg-white px-4 text-sm outline-none focus:border-teal-500"/>
                          <p className="mt-2 text-xs leading-5 text-[#6B7C8F]">Find the UTR in your UPI app's transaction details. Never enter your UPI PIN, OTP or banking password. A UTR or screenshot is not proof of payment; our team checks the actual merchant account credit.</p>
                          <button type="button" onClick={submitPaymentReference} disabled={busy || utr.trim().length < 8} className="mt-4 h-12 w-full rounded-xl bg-[#17365D] px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Submitting..." : "Submit UTR for verification"}</button>
                        </div>
                      )}
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E3EAF0] bg-white p-3 text-[11px] leading-5 text-[#62748A]"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#16856F]"/><p>Manual verification: your payment is not confirmed when you submit the UTR. We will verify the credit before creating your PAN-finding request. Please do not make a second payment while the first is being checked.</p></div>
                      <button type="button" onClick={() => { setStep("review"); setPaymentDetails(null); setUtr(""); setStatusCheck(null); }} className="mt-4 w-full text-xs font-semibold text-[#52667D]">Back to review</button>
                    </div>
                  </div>
                )}

                {step === "complete" && result && (
                  <div role="status" className="rounded-xl border border-[#DCE5ED] bg-white px-5 py-6 text-sm text-[#236A50]">
                    <div className="mb-3 flex items-center gap-2"><Clock3 size={20}/><p className="font-bold">{statusCheck?.status === "verified" ? "Payment verified successfully" : statusCheck?.status === "rejected" ? "Payment could not be matched" : "Payment submitted · Awaiting verification"}</p></div>
                    <p>{statusCheck?.message || result.message}</p>
                    <p className="mt-3">Payment reference: <strong>{paymentDetails?.paymentReference}</strong></p>
                    {statusCheck?.status === "verified" && statusCheck?.requestNumber ? (
                      <div className="mt-4 rounded-xl border border-[#CDE9DD] bg-[#F0FAF5] p-4 text-[#236A50]">
                        <p className="font-bold">Your PAN-finding request has been created.</p>
                        <p className="mt-2">Request reference: <strong>{statusCheck.requestNumber}</strong></p>
                        <p className="mt-2 text-xs">We have sent the confirmation details to {form.email || result.email}. You can now track your request on our website.</p>
                      </div>
                    ) : statusCheck?.status === "rejected" ? (
                      <p className="mt-3 text-xs text-[#9A4A36]">Please contact PANKhojo support before making another payment.</p>
                    ) : (
                      <div className="mt-4 rounded-xl border border-[#E3EAF0] bg-[#F8FAFC] p-3 text-xs leading-5 text-[#52667D]">
                        <p className="font-bold">We are checking your payment details.</p>
                        <p className="mt-1">This page automatically checks for an admin verification update every 5 seconds. You can leave this page open. UTR submission is not payment confirmation.</p>
                        <p className="mt-2">Confirmation email: {form.email || result.email}</p>
                      </div>
                    )}
                    <button type="button" onClick={() => checkPaymentStatus()} disabled={busy} className="mt-4 h-11 w-full rounded-xl border border-[#BBD8CD] bg-white px-4 text-sm font-bold text-[#176B5A] disabled:opacity-50">{busy ? "Checking..." : "Refresh payment status"}</button>
                    {autoChecking && <p className="mt-2 text-center text-[11px] text-[#718198]">Auto-refresh is on · every 5 seconds</p>}
                  </div>
                )}

                {error && (
                  <div role="alert" className="mt-5 rounded-xl border border-[#F1D0CC] bg-[#FFF6F5] px-4 py-3 text-xs text-[#A33D35]">
                    {error}
                  </div>
                )}

                {step === "form" && <button
                  type="submit"
                  disabled={busy || !privacyAccepted || !termsAccepted}
                  className="mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#17365D] px-5 text-sm font-bold text-white transition hover:bg-[#1E4A72] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? t.submitting : t.submit}
                  <ArrowRight size={17} />
                </button>}

                {step === "form" && <p className="mt-3 flex items-center justify-center gap-2 text-center text-[10px] text-[#9AA6B4]">
                  <Clock3 size={12} />{t.note}
                </p>}
              </div>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#8794A4]">
              <CircleHelp size={14} />{t.helpText}
            </div>
          </div>
        </section>
      </div>

      {legalDocument && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/65 p-3 sm:p-6"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setLegalDocument(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-title"
            className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 id="legal-title" className="text-lg font-bold text-[#17365D]">
                {legalDocument === "privacy" ? t.privacy : t.terms}
              </h2>
              <button type="button" onClick={() => setLegalDocument(null)} aria-label={t.close}>
                <X size={22} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-7">
              {documentContent.map(([heading, body]) => (
                <section key={heading} className="mb-6">
                  <h3 className="mb-2 text-sm font-bold text-[#17365D]">{heading}</h3>
                  <p className="text-sm leading-7 text-[#526174]">{body}</p>
                </section>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setLegalDocument(null)}
                className="rounded-lg bg-[#17365D] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
