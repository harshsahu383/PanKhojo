
import { useEffect, useState } from "react";
import "./RequestPreview.css";
import {
  ArrowLeft, ArrowRight, Check, CircleHelp, Copy,
  Clock3, Eye, EyeOff, Fingerprint, LockKeyhole, Mail, Phone,
  ShieldCheck, UserRound, X, CalendarDays, MapPin, ChevronDown
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

// QR image paths are served by the backend. Absolute HTTPS URLs and image data URLs
// are also supported. Relative values such as /public/upi-qr.png resolve against API.
const resolveQrImageUrl = (value) => {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^(https?:\/\/|data:image\/)/i.test(source)) return source;
  return new URL(source.replace(/^\/+/, ""), `${API.replace(/\/+$/, "")}/`).toString();
};

const createMaskedPanPreview = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const randomLetter = () => letters[Math.floor(Math.random() * letters.length)];
  const randomDigit = () => digits[Math.floor(Math.random() * digits.length)];
  const pan = [
    randomLetter(), randomLetter(), randomLetter(), randomLetter(), randomLetter(),
    randomDigit(), randomDigit(), randomDigit(), randomDigit(), randomLetter()
  ].join("");
  return `${pan.slice(0, 2)}••••${pan.slice(6, 9)}${pan.slice(9)}`;
};

const loadCashfreeSdk = () => new Promise((resolve, reject) => {
  if (window.Cashfree) return resolve(window.Cashfree);
  const script = document.createElement("script");
  script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
  script.async = true;
  script.onload = () => window.Cashfree ? resolve(window.Cashfree) : reject(new Error("Cashfree checkout could not be initialized."));
  script.onerror = () => reject(new Error("Unable to load secure payment checkout."));
  document.head.appendChild(script);
});

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
    intro: "Submit the information requested to help locate your existing PAN. Where an authorised process requires Aadhaar, we ask for the 12-digit number only—not a photo or document.",
    section: "Your information",
    sectionText: "Only four details are needed to submit your request. Never share your Aadhaar OTP.",
    fullName: "Full name",
    email: "Email address",
    phone: "Mobile number",
    aadhaar: "Aadhaar number",
    fullNamePlaceholder: "Enter your full name",
    emailPlaceholder: "you@example.com",
    phonePlaceholder: "Enter 10-digit mobile number",
    aadhaarPlaceholder: "Enter 12-digit Aadhaar number",
    dateOfBirthPlaceholder: "Select date of birth",
    fatherNamePlaceholder: "Enter father's name",
    cityPlaceholder: "Enter city",
    statePlaceholder: "Enter state",
    aadhaarHint: "Enter the 12-digit number only. No Aadhaar photo or document is required. Never share your Aadhaar OTP.",
    showAadhaar: "Show Aadhaar number",
    hideAadhaar: "Hide Aadhaar number",
    submit: "Continue to secure payment",
    submitting: "Preparing secure checkout...",
    paymentFailed: "Payment could not be completed. No request has been created.",
    required: "Please complete the required fields and accept both the Privacy Policy and Terms of Service.",
    failed: "Unable to submit your request. Please try again.",
    success: "Your request has been submitted successfully.",
    ref: "Your request reference number",
    note: "Your request is created after UTR submission. Processing starts only after payment verification.",
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
    privacyNoticeText: "For Aadhaar, we request the number only—not an Aadhaar photo or document. Your information is handled under the Privacy Policy and should only be submitted where you are authorised to do so.",
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
    panPreviewTitle: "Your PAN preview",
    panPreviewStatus: "Sample PAN format",
    panPreviewMask: "ABCDE1234F",
    panPreviewIllustrative: "Sample PAN format for illustration only. This is not a PAN retrieved for your request.",
    panPreviewUnlock: "Your PAN result is shared with you after your request is processed.",
    additionalTitle: "Additional details",
    additionalHint: "Optional — add these details only if they are relevant to your request.",
    dateOfBirth: "Date of birth",
    fatherName: "Father's name",
    city: "City",
    state: "State",
    panPreviewDelivery: "After processing, we will send your PAN to your registered email address as a password-protected PDF. It will not be displayed on this website.",
    editDetails: "Edit details",
    payNow: "Continue to secure payment",
    paymentProcessing: "Opening Cashfree checkout...",
    serviceFee: "Payment amount",
    feeNotice: "Pay securely through Cashfree. Your request is created only after Cashfree confirms the payment.",
    maskedAadhaar: "XXXX XXXX",
    optionalNotProvided: "Not provided",
    paymentSuccessTitle: "Payment submitted for verification",
    paymentSuccessText: "We have received your UPI transaction details and created your request reference. Request processing will begin only after our team verifies the payment in the business bank account.",
    receiptSentText: "Your request reference is available on the confirmation page. We will send payment confirmation after verification.",
    receiptPendingText: "Please do not make another payment while this payment is being checked. Keep your payment and request references for your records.",
    emailNotice: "We will send a payment confirmation email after verification."
  },
  hi: {
    back: "होम पर वापस जाएं",
    title: "अपना मौजूदा PAN खोजें",
    intro: "अपना मौजूदा PAN खोजने के लिए आवश्यक जानकारी दें। अधिकृत प्रक्रिया में Aadhaar की जरूरत होने पर केवल 12 अंकों का नंबर मांगा जाता है—फोटो या दस्तावेज़ नहीं।",
    section: "आपकी जानकारी",
    sectionText: "अनुरोध के लिए केवल चार जानकारी जरूरी हैं। अपना Aadhaar OTP कभी साझा न करें।",
    fullName: "पूरा नाम",
    email: "ईमेल पता",
    phone: "मोबाइल नंबर",
    aadhaar: "आधार नंबर",
    fullNamePlaceholder: "अपना पूरा नाम दर्ज करें",
    emailPlaceholder: "you@example.com",
    phonePlaceholder: "10 अंकों का मोबाइल नंबर दर्ज करें",
    aadhaarPlaceholder: "12 अंकों का आधार नंबर दर्ज करें",
    dateOfBirthPlaceholder: "जन्म तिथि चुनें",
    fatherNamePlaceholder: "पिता का नाम दर्ज करें",
    cityPlaceholder: "शहर दर्ज करें",
    statePlaceholder: "राज्य दर्ज करें",
    aadhaarHint: "केवल 12 अंकों का नंबर दर्ज करें। Aadhaar फोटो या दस्तावेज़ की जरूरत नहीं है। अपना Aadhaar OTP कभी साझा न करें।",
    showAadhaar: "Aadhaar नंबर दिखाएं",
    hideAadhaar: "Aadhaar नंबर छिपाएं",
    submit: "सुरक्षित भुगतान के लिए आगे बढ़ें",
    submitting: "भुगतान तैयार हो रहा है...",
    paymentFailed: "भुगतान पूरा नहीं हुआ। कोई अनुरोध नहीं बनाया गया है।",
    required: "कृपया सभी जरूरी जानकारी भरें और गोपनीयता नीति तथा सेवा की शर्तें स्वीकार करें।",
    failed: "आपका अनुरोध सबमिट नहीं हो सका। कृपया दोबारा प्रयास करें।",
    success: "आपका अनुरोध सफलतापूर्वक सबमिट हो गया है।",
    ref: "आपका अनुरोध रेफरेंस नंबर",
    note: "UTR सबमिट करने के बाद आपका अनुरोध बनेगा। प्रोसेसिंग भुगतान सत्यापन के बाद शुरू होगी।",
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
    privacyNoticeText: "Aadhaar के लिए केवल नंबर मांगा जाता है—फोटो या दस्तावेज़ नहीं। जानकारी का उपयोग गोपनीयता नीति के अनुसार होगा। केवल वही जानकारी दें जिसे साझा करने का आपको अधिकार है।",
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
    panPreviewTitle: "आपका PAN प्रीव्यू",
    panPreviewStatus: "PAN का नमूना फॉर्मेट",
    panPreviewMask: "ABCDE1234F",
    panPreviewIllustrative: "यह केवल उदाहरण है। यह आपके अनुरोध से प्राप्त वास्तविक PAN नहीं है।",
    panPreviewUnlock: "आपका PAN अनुरोध की प्रक्रिया पूरी होने के बाद साझा किया जाएगा।",
    additionalTitle: "अतिरिक्त जानकारी",
    additionalHint: "वैकल्पिक — केवल तभी भरें जब ये जानकारी आपके अनुरोध के लिए जरूरी हो।",
    dateOfBirth: "जन्म तिथि",
    fatherName: "पिता का नाम",
    city: "शहर",
    state: "राज्य",
    panPreviewDelivery: "प्रोसेसिंग पूरी होने के बाद आपका PAN आपके रजिस्टर्ड ईमेल पर पासवर्ड-सुरक्षित PDF के रूप में भेजा जाएगा। यह वेबसाइट पर नहीं दिखाया जाएगा।",
    editDetails: "जानकारी बदलें",
    payNow: "Cashfree से सुरक्षित भुगतान करें",
    paymentProcessing: "पेमेंट पेज तैयार हो रहा है...",
    serviceFee: "भुगतान राशि",
    feeNotice: "Cashfree के माध्यम से सुरक्षित भुगतान करें। Cashfree द्वारा भुगतान की पुष्टि होने के बाद ही आपका अनुरोध बनाया जाएगा।",
    maskedAadhaar: "XXXX XXXX",
    optionalNotProvided: "नहीं दिया गया",
    paymentSuccessTitle: "भुगतान सत्यापन के लिए भेजा गया",
    paymentSuccessText: "आपके UPI भुगतान की जानकारी मिल गई है और अनुरोध रेफरेंस बना दिया गया है। बैंक में भुगतान सत्यापित होने के बाद ही प्रोसेसिंग शुरू होगी।",
    receiptSentText: "आपका अनुरोध रेफरेंस पुष्टि पेज पर उपलब्ध है। भुगतान सत्यापन के बाद ईमेल से पुष्टि भेजी जाएगी।",
    receiptPendingText: "सत्यापन के दौरान दोबारा भुगतान न करें। भुगतान और अनुरोध रेफरेंस सुरक्षित रखें।",
    emailNotice: "भुगतान सत्यापित होने के बाद ईमेल से पुष्टि भेजी जाएगी।"
  }
};

const legalDocuments = {
  privacy: {
    en: [
      ["1. Information we collect", "We collect your name, email address, mobile number and, where a lawful basis and authorised process have been established, your 12-digit Aadhaar number to handle an eligible request. We do not ask you to upload an Aadhaar photo or document."],
      ["2. How we use information", "Information is used to receive, review and process your request, communicate with you, prevent misuse, maintain necessary records and comply with applicable legal requirements."],
      ["3. Sharing of information", "We do not sell personal information. Information may be shared with service providers or other parties only where necessary for the stated purpose and permitted by applicable law."],
      ["4. Data security", "We use reasonable technical and organisational safeguards to protect information. However, no online transmission or storage system can be guaranteed to be completely secure."],
      ["5. Retention and deletion", "Information is retained only for as long as reasonably necessary for the service, support, dispute resolution and legal obligations. You may request deletion, subject to information that must lawfully be retained."],
      ["6. Your rights", "You may contact us to request access, correction, erasure or withdrawal of consent, where applicable. Withdrawal may affect our ability to continue processing your request."],
      ["7. Contact and complaints", "For privacy questions or complaints, contact: [PRIVACY EMAIL]. Grievance contact: [NAME / ROLE / EMAIL / POSTAL ADDRESS]."]
    ],
    hi: [
      ["1. हम कौन-सी जानकारी लेते हैं", "हम आपका नाम, ईमेल पता, मोबाइल नंबर और जहां वैध आधार तथा अधिकृत प्रक्रिया उपलब्ध हो, पात्र अनुरोध के लिए आपका 12 अंकों का Aadhaar नंबर लेते हैं। हम Aadhaar फोटो या दस्तावेज़ अपलोड करने के लिए नहीं कहते।"],
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

function Field({ name, label, placeholder, value, onChange, type = "text", icon: Icon, required = false, hint, autoComplete, showToggle = false, visible = false, onToggle, toggleLabel, hideLabel }) {
  const inputType = showToggle ? (visible ? "text" : "password") : type;
  return (
    <label className="pk-field block">
      <span className="mb-2 block text-[13px] font-semibold text-[#24364B]">
        {label}{required && <span className="text-[#D05B57]"> *</span>}
      </span>
      <span className="relative block">
        {Icon && <Icon size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B9AAF]" />}
        <input
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete || "off"}
          minLength={name === "fullName" ? 2 : undefined}
          maxLength={name === "phone" ? 10 : name === "aadhaarNumber" ? 12 : undefined}
          pattern={name === "phone" ? "[6-9][0-9]{9}" : name === "aadhaarNumber" ? "[0-9]{12}" : undefined}
          inputMode={(name === "phone" || name === "aadhaarNumber") ? "numeric" : undefined}
          aria-label={label}
          className={`h-[52px] w-full rounded-xl border border-[#DFE6EE] bg-white text-[14px] text-[#26384D] ${Icon ? "pl-11" : "pl-4"} ${showToggle ? "pr-14" : "pr-4"}`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={visible ? hideLabel : toggleLabel}
            aria-pressed={visible}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#718196] transition hover:bg-[#F1F5F8] hover:text-[#17365D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#159B83]"
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
      {hint && <span className="mt-1.5 block text-[11px] leading-5 text-[#718196]">{hint}</span>}
    </label>
  );
}

export default function RequestPreview({ language = "en", onBack, initialValues = null }) {
  const t = copy[language] || copy.en;

  const [form, setForm] = useState(() => ({ ...initial, ...(initialValues || {}) }));
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalDocument, setLegalDocument] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [utr, setUtr] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("form");
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);
  const [qrImageFailed, setQrImageFailed] = useState(false);
  const [statusCheck, setStatusCheck] = useState(null);
  const [copied, setCopied] = useState("");
  const [showUtrForm, setShowUtrForm] = useState(false);
  const [autoChecking, setAutoChecking] = useState(false);
  const [maskedPanPreview, setMaskedPanPreview] = useState(() => createMaskedPanPreview());

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

    setMaskedPanPreview(createMaskedPanPreview());
    setStep("review");
  };

  const startPayment = async () => {
    setError(""); setBusy(true);
    try {
      const response = await fetch(`${API}/api/payments/cashfree/create-order`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consent: true, consentDetails: { privacyAccepted, termsAccepted, privacyVersion: "1.0", termsVersion: "1.0" } })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || t.failed);
      setPaymentDetails(data);
      sessionStorage.setItem("pankhojo_cashfree_payment", JSON.stringify({ paymentReference: data.paymentReference, email: form.email, createdAt: Date.now() }));
      const Cashfree = await loadCashfreeSdk();
      const cashfree = Cashfree({ mode: data.environment === "production" ? "production" : "sandbox" });
      const checkoutResult = await cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
      if (checkoutResult?.error) throw new Error(checkoutResult.error.message || "Unable to open Cashfree checkout.");
    } catch (err) { setError(err.message || t.failed); }
    finally { setBusy(false); }
  };

  const submitPaymentReference = async () => {
    if (secondsLeft <= 0) {
      setError("This checkout has expired after five minutes. If you already paid, do not pay again; contact support with your payment reference.");
      return;
    }
    setError(""); setBusy(true);
    try {
      const response = await fetch(`${API}/api/payments/submit-manual`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentReference: paymentDetails.paymentReference,
          utr,
          paymentConfirmed,
          requestData: {
            ...form,
            consent: true,
            consentDetails: {
              privacyAccepted,
              termsAccepted,
              privacyVersion: "1.0",
              termsVersion: "1.0"
            }
          }
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || t.failed);
      setResult({
        message: data.message,
        email: form.email,
        requestNumber: data.requestNumber,
        verificationTime: data.verificationTime,
        paymentReference: data.paymentReference || paymentDetails.paymentReference
      });
      setAutoChecking(true);
      setStep("complete");
    } catch (err) { setError(err.message || t.failed); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (step !== "payment" || !paymentDetails?.expiresAt) return;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((new Date(paymentDetails.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [step, paymentDetails?.expiresAt]);

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

  const qrImageUrl = resolveQrImageUrl(paymentDetails?.qrImage);

  const documentContent = legalDocument
    ? legalDocuments[legalDocument][language] || legalDocuments[legalDocument].en
    : [];

  // Checkout and confirmation are presented as dedicated full-page views,
  // separate from the request form and review screen.
  if ((step === "payment" || step === "complete") && paymentDetails) {
    const paymentVerified = statusCheck?.status === "verified";
    const paymentRejected = statusCheck?.status === "rejected";
    const requestReference = result?.requestNumber || statusCheck?.requestNumber;

    return (
      <main className="pankhojo-request-page min-h-screen bg-[#F3F6F9] px-4 py-5 text-[#17283D] sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E4EAF0] bg-white px-4 py-4 shadow-sm sm:px-6">
            <strong className="text-xl text-[#17365D]">PAN<span className="text-[#16A68A]">Khojo</span></strong>
            {step === "payment" ? (
              <button type="button" onClick={() => { setStep("review"); setError(""); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#D6E0E9] px-3 py-2 text-sm font-semibold text-[#43566D]">
                <ArrowLeft size={16} /> Back to review
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF7E8] px-3 py-2 text-xs font-bold text-[#95621A]">
                <Clock3 size={15} /> {paymentVerified ? "Payment verified" : paymentRejected ? "Payment needs attention" : "Awaiting verification"}
              </span>
            )}
          </header>

          {step === "payment" ? (
            <>
              <div className="mb-6 text-center">
                <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#159B83]">Secure UPI checkout</p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#17365D] sm:text-3xl">Complete your payment</h1>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#69798D]">Scan the QR code or use the UPI ID below. After paying, enter your UTR and confirm the payment to submit your request.</p>
              </div>

              <div className="grid items-start gap-5 lg:grid-cols-[1fr_1fr]">
                <section className="rounded-2xl border border-[#E0E8EF] bg-white p-5 shadow-sm sm:p-7">
                  <div className="rounded-xl bg-[#17365D] px-4 py-5 text-center text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/75">Total amount</p>
                    <p className="mt-1 text-4xl font-extrabold">₹{(paymentDetails.amount / 100).toFixed(2)}</p>
                    <p className="mt-1 text-xs text-white/75">PANKhojo service fee · INR</p>
                  </div>
                  <div className="mt-4 rounded-xl border border-[#E4EAF0] bg-[#FAFCFD] p-4 text-center">
                    <p className="text-sm font-extrabold text-[#17365D]">Pay to {paymentDetails.payeeName}</p>
                    <p className="mt-1 text-xs text-[#64758A]">Scan this QR code using any supported UPI app</p>
                    <div className="mx-auto mt-4 flex min-h-[220px] w-full max-w-[240px] items-center justify-center rounded-xl border border-[#E5EAF0] bg-white p-2">
                      {qrImageUrl && !qrImageFailed ? (
                        <img src={qrImageUrl} alt="PANKhojo UPI payment QR code" className="h-auto max-h-[220px] w-full max-w-[220px] object-contain" onError={() => setQrImageFailed(true)} />
                      ) : (
                        <div role="alert" className="px-3 py-5 text-center text-xs leading-5 text-rose-700">
                          <p className="font-bold">QR code could not be loaded.</p>
                          <p className="mt-1">Use the UPI ID below, or contact support before paying.</p>
                        </div>
                      )}
                    </div>
                    <p className="mt-4 break-all text-sm font-bold text-[#17365D]">{paymentDetails.upiId}</p>
                    <button type="button" onClick={() => copyPaymentValue(paymentDetails.upiId, "upi")} className="mt-2 inline-flex min-h-10 items-center justify-center rounded-lg border border-[#D8E2EA] bg-white px-4 py-2 text-xs font-bold text-[#43566D]">
                      <Copy size={14} className="mr-2" />{copied === "upi" ? "Copied" : "Copy UPI ID"}
                    </button>
                  </div>
                  <div className="mt-4 rounded-xl border border-[#F0DFB7] bg-[#FFFAEE] p-4 text-xs leading-5 text-[#805C20]">
                    <strong>Before you pay:</strong> confirm the payee name in your UPI app is exactly <strong>{paymentDetails.payeeName}</strong> and the amount is ₹{(paymentDetails.amount / 100).toFixed(2)}. If either detail differs, stop and contact support.
                  </div>
                  <div className="mt-4 rounded-xl bg-[#F4F7FA] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#718198]">Payment reference</p>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 break-all text-sm font-extrabold text-[#17365D]">{paymentDetails.paymentReference}</p>
                      <button type="button" onClick={() => copyPaymentValue(paymentDetails.paymentReference, "reference")} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#D8E2EA] bg-white px-3 py-2 text-xs font-bold text-[#43566D]">
                        <Copy size={13} />{copied === "reference" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E0E8EF] bg-white p-5 shadow-sm sm:p-7">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F4F7FA] p-4">
                    <div><p className="text-sm font-bold text-[#17365D]">Checkout time remaining</p><p className="mt-1 text-xs text-[#718198]">This payment reference expires after 5 minutes.</p></div>
                    <p aria-live="off" className={`font-mono text-2xl font-extrabold tabular-nums ${secondsLeft <= 60 ? "text-rose-700" : "text-[#176B5A]"}`}>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</p>
                  </div>
                  {secondsLeft <= 0 ? (
                    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">
                      <p className="font-bold">Checkout expired and has been cancelled.</p>
                      <p className="mt-1 text-xs">If you transferred money just before expiry, do not pay again. Contact support and share your payment reference so the transfer can be checked.</p>
                      <button type="button" onClick={() => { setStep("review"); setPaymentDetails(null); setUtr(""); setPaymentConfirmed(false); setStatusCheck(null); setError(""); }} className="mt-4 h-11 w-full rounded-xl bg-[#17365D] px-4 text-sm font-bold text-white">Return to review</button>
                    </div>
                  ) : <>
                    <h2 className="text-lg font-extrabold text-[#17365D]">How to complete payment</h2>
                    <ol className="mt-4 space-y-3 text-sm leading-6 text-[#52667D]">
                      <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF5F2] text-xs font-extrabold text-[#148B76]">1</span><span>Open your UPI app and scan the QR code, or pay using the UPI ID.</span></li>
                      <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF5F2] text-xs font-extrabold text-[#148B76]">2</span><span>Pay the exact amount shown above. Check the payee name before confirming in your UPI app.</span></li>
                      <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF5F2] text-xs font-extrabold text-[#148B76]">3</span><span>After a successful payment, open transaction details in your UPI app and copy the UTR / transaction reference.</span></li>
                      <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF5F2] text-xs font-extrabold text-[#148B76]">4</span><span>Enter the UTR below, tick the confirmation checkbox and submit it for verification.</span></li>
                    </ol>

                    <div className="mt-6 border-t border-[#E9EEF3] pt-5">
                      <label className="mb-2 block text-sm font-bold text-[#17365D]" htmlFor="pk-utr">UPI transaction reference / UTR</label>
                      <input id="pk-utr" value={utr} onChange={(e) => { setUtr(e.target.value.replace(/[^A-Za-z0-9-]/g, "").slice(0, 35)); setStatusCheck(null); }} placeholder="Enter your UTR" autoComplete="off" inputMode="text" className="h-12 w-full rounded-xl border border-[#D6E0E9] bg-white px-4 text-sm outline-none focus:border-teal-500" />
                      <p className="mt-2 text-xs leading-5 text-[#6B7C8F]">The UTR is usually available in your UPI app's transaction details. Never enter your UPI PIN, OTP or banking password.</p>
                      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[#DCECE7] bg-[#F3FAF7] p-3 text-xs leading-5 text-[#365D55]">
                        <input type="checkbox" checked={paymentConfirmed} onChange={(e) => setPaymentConfirmed(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#159B83]" />
                        <span>I confirm that I have completed the UPI payment and entered the correct UTR for this transaction.</span>
                      </label>
                      <button type="button" onClick={submitPaymentReference} disabled={busy || utr.trim().length < 8 || !paymentConfirmed} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17365D] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                        {busy ? "Submitting..." : "Submit UTR and create request"} <ArrowRight size={17} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E3EAF0] bg-[#F8FAFC] p-3 text-[11px] leading-5 text-[#62748A]">
                      <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#16856F]" />
                      <p>Submitting a UTR does not confirm payment. Your request reference will be created, but payment remains pending until our team verifies the actual bank credit.</p>
                    </div>
                    {error && <div role="alert" className="mt-4 rounded-xl border border-[#F1D0CC] bg-[#FFF6F5] px-4 py-3 text-xs text-[#A33D35]">{error}</div>}
                  </>}
                </section>
              </div>
            </>
          ) : (
            <section className="mx-auto max-w-2xl rounded-2xl border border-[#E0E8EF] bg-white p-5 shadow-sm sm:p-8">
              <div className="text-center">
                <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${paymentVerified ? "bg-[#E8F7EF] text-[#16845F]" : paymentRejected ? "bg-[#FFF0EF] text-[#B4473F]" : "bg-[#FFF7E8] text-[#A36B17]"}`}>
                  {paymentVerified ? <Check size={28} /> : paymentRejected ? <X size={28} /> : <Clock3 size={28} />}
                </span>
                <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#159B83]">Request confirmation</p>
                <h1 className="mt-2 text-2xl font-extrabold text-[#17365D] sm:text-3xl">
                  {paymentVerified ? "Payment verified" : paymentRejected ? "Payment needs attention" : "Your request is submitted"}
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#69798D]">{statusCheck?.message || result?.message}</p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl bg-[#F4F7FA] p-4">
                  <p className="text-xs text-[#718198]">Payment reference</p>
                  <p className="mt-2 break-all text-sm font-extrabold text-[#17365D]">{paymentDetails.paymentReference}</p>
                </div>
                <div className="min-w-0 rounded-xl bg-[#F4F7FA] p-4">
                  <p className="text-xs text-[#718198]">Request reference</p>
                  <p className="mt-2 break-all text-sm font-extrabold text-[#17365D]">{requestReference || "Being prepared"}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#F0DFB7] bg-[#FFFAEE] p-4">
                <p className="text-sm font-bold text-[#805C20]">{paymentVerified ? "Payment confirmed by our team" : paymentRejected ? "Please contact support before making another payment" : "Payment verification is pending"}</p>
                <p className="mt-1 text-xs leading-6 text-[#805C20]">{paymentVerified ? "Your request is ready for processing. We will send updates to your registered email address." : paymentRejected ? "Our team could not match the UTR to a settled bank credit. Please contact support with your payment reference and UTR." : `We will check the UTR against the business bank account. ${result?.verificationTime || "We will notify you as soon as verification is complete."} Do not make another payment while this submission is being checked.`}</p>
              </div>

              <p className="mt-4 text-center text-xs text-[#718198]">Confirmation email: {form.email}</p>
              <button type="button" onClick={() => onBack?.()} className="mt-6 h-12 w-full rounded-xl bg-[#17365D] px-5 text-sm font-bold text-white">Back to PANKhojo</button>
              {autoChecking && <p className="mt-3 text-center text-[11px] text-[#718198]">Payment status refreshes automatically while this page is open.</p>}
            </section>
          )}
        </div>
      </main>
    );
  }

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
                    <Field name="fullName" label={t.fullName} placeholder={t.fullNamePlaceholder} value={form.fullName} onChange={update} icon={UserRound} required autoComplete="name" />
                    <Field name="email" label={t.email} placeholder={t.emailPlaceholder} value={form.email} onChange={update} type="email" icon={Mail} required autoComplete="email" />
                    <Field name="phone" label={t.phone} placeholder={t.phonePlaceholder} value={form.phone} onChange={update} type="tel" icon={Phone} required autoComplete="tel-national" />
                    <Field
                      name="aadhaarNumber"
                      label={t.aadhaar}
                      placeholder={t.aadhaarPlaceholder}
                      value={form.aadhaarNumber}
                      onChange={update}
                      icon={Fingerprint}
                      required
                      showToggle
                      visible={showAadhaar}
                      onToggle={() => setShowAadhaar(value => !value)}
                      toggleLabel={t.showAadhaar}
                      hideLabel={t.hideAadhaar}
                      hint={t.aadhaarHint}
                    />
                  </div>

                  <details
                    className="pk-additional-details mt-5 overflow-hidden rounded-2xl border border-[#E3EAF0] bg-[#FBFCFE]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
                      <span>
                        <span className="block text-sm font-extrabold text-[#20364D]">{t.additionalTitle}</span>
                        <span className="mt-1 block text-[11px] leading-5 text-[#8190A1]">{t.additionalHint}</span>
                      </span>
                      <ChevronDown size={18} className="shrink-0 text-[#688096]" />
                    </summary>
                    <div className="grid gap-4 border-t border-[#E8EDF2] p-4 sm:grid-cols-2">
                      <Field name="dateOfBirth" label={t.dateOfBirth} placeholder={t.dateOfBirthPlaceholder} value={form.dateOfBirth} onChange={update} type="date" icon={CalendarDays} />
                      <Field name="fatherName" label={t.fatherName} placeholder={t.fatherNamePlaceholder} value={form.fatherName} onChange={update} icon={UserRound} />
                      <Field name="city" label={t.city} placeholder={t.cityPlaceholder} value={form.city} onChange={update} icon={MapPin} />
                      <Field name="state" label={t.state} placeholder={t.statePlaceholder} value={form.state} onChange={update} icon={MapPin} />
                    </div>
                  </details>

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

                    <section className="pk-pan-preview mt-6" aria-labelledby="pk-pan-preview-title">
                      <div className="pk-pan-preview-top">
                        <div>
                          <p className="pk-pan-preview-eyebrow">PAN RESULT</p>
                          <h4 id="pk-pan-preview-title" className="pk-pan-preview-title">{t.panPreviewTitle}</h4>
                        </div>
                        <span className="pk-pan-preview-status"><LockKeyhole size={13} /> {t.panPreviewStatus}</span>
                      </div>
                      <div className="pk-pan-preview-number" aria-label="Masked illustrative PAN format">{maskedPanPreview}</div>
                      <p className="pk-pan-preview-disclaimer">{t.panPreviewIllustrative}</p>
                      <div className="pk-pan-preview-divider" />
                      <div className="pk-pan-preview-message">
                        <span className="pk-pan-preview-lock"><LockKeyhole size={17} /></span>
                        <div>
                          <p className="pk-pan-preview-unlock">{t.panPreviewUnlock}</p>
                          <p className="pk-pan-preview-delivery">{t.panPreviewDelivery}</p>
                        </div>
                      </div>
                    </section>

                    <div className="mt-6 grid gap-4 rounded-xl border border-[#E4EAF0] bg-[#FAFCFE] p-4 sm:grid-cols-2">
                      {[
                        [t.fullName, form.fullName], [t.email, form.email], [t.phone, form.phone],
                        [t.aadhaar, `${t.maskedAadhaar} ${form.aadhaarNumber.slice(-4)}`],
                        ...(form.dateOfBirth ? [[t.dateOfBirth, form.dateOfBirth]] : []),
                        ...(form.fatherName ? [[t.fatherName, form.fatherName]] : []),
                        ...(form.city ? [[t.city, form.city]] : []),
                        ...(form.state ? [[t.state, form.state]] : [])
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
                      <button type="button" onClick={startPayment} disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#17365D] px-5 text-sm font-bold text-white disabled:opacity-60">{busy ? t.paymentProcessing : t.payNow}<ArrowRight size={17} /></button>
                    </div>
                  </div>
                )}

                {step === "payment" && paymentDetails && (
                  <div className="overflow-hidden rounded-2xl border border-[#DCE5ED] bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-[#17365D] to-[#176B70] px-5 py-5 text-center text-white">
                      <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/15"><ShieldCheck size={23} /></div>
                      <p className="text-xs font-bold uppercase tracking-[.18em] text-white/75">PANKhojo secure checkout</p>
                      <p className="mt-2 text-3xl font-extrabold">₹{(paymentDetails.amount / 100).toFixed(2)}</p>
                      <p className="mt-1 text-xs text-white/80">PAN Finding Service Fee · INR</p>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between rounded-xl border border-[#DCECE7] bg-[#F3FAF7] px-3 py-3">
                        <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#668078]">Payment reference</p><p className="mt-1 break-all text-sm font-extrabold text-[#17365D]">{paymentDetails.paymentReference}</p></div>
                        <button type="button" onClick={() => copyPaymentValue(paymentDetails.paymentReference, "reference")} className="ml-2 rounded-lg border border-[#C9DED6] bg-white px-3 py-2 text-xs font-bold text-[#176B5A]"><Copy size={13} className="mr-1 inline" />{copied === "reference" ? "Copied" : "Copy"}</button>
                      </div>
                      <div className="mt-4 rounded-2xl border border-[#E4EAF0] bg-[#FAFCFD] p-4 text-center">
                        <p className="text-sm font-extrabold text-[#17365D]">Pay to {paymentDetails.payeeName}</p>
                        <p className="mt-1 text-xs text-[#64758A]">Scan this merchant QR using your UPI app</p>
                        <img src={paymentDetails.qrImage} alt="Merchant UPI QR code" className="mx-auto mt-4 h-52 w-52 rounded-xl border border-[#E5EAF0] bg-white object-contain p-2" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        <p className="mt-3 break-all text-sm font-bold text-[#17365D]">{paymentDetails.upiId}</p>
                        <button type="button" onClick={() => copyPaymentValue(paymentDetails.upiId, "upi")} className="mt-2 rounded-lg border border-[#D8E2EA] bg-white px-3 py-2 text-xs font-bold text-[#43566D]"><Copy size={13} className="mr-1 inline" />{copied === "upi" ? "Copied" : "Copy UPI ID"}</button>
                        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-left text-[11px] leading-5 text-amber-900">Before paying, confirm the payee name shown inside your UPI app matches <strong>{paymentDetails.payeeName}</strong> and the amount is exactly ₹{(paymentDetails.amount / 100).toFixed(2)}. If it does not match, do not pay and contact support.</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F5F7FA] px-3 py-3">
                        <div><p className="text-xs font-bold text-[#17365D]">Suggested payment window</p><p className="text-[10px] text-[#718198]">5 minutes from checkout</p></div>
                        <p className={`font-mono text-lg font-extrabold ${secondsLeft < 60 ? "text-amber-700" : "text-[#176B5A]"}`}>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</p>
                      </div>
                      {secondsLeft === 0 && <p className="mt-2 text-xs leading-5 text-amber-800">The suggested payment window has passed. This does not prove a payment failed. If you already paid, enter your UTR below and submit it for reconciliation. Do not pay again until you have checked with support.</p>}
                      {!showUtrForm ? (
                        <button type="button" onClick={() => setShowUtrForm(true)} className="mt-5 h-12 w-full rounded-xl bg-[#17365D] px-5 text-sm font-bold text-white">I've completed payment · Verify UTR</button>
                      ) : (
                        <div className="mt-5 rounded-xl border border-[#DCE5ED] bg-[#F8FAFC] p-4">
                          <label className="mb-2 block text-sm font-bold text-[#17365D]">UPI transaction reference / UTR</label>
                          <input value={utr} onChange={(e) => { setUtr(e.target.value.replace(/[^A-Za-z0-9-]/g, "").slice(0, 35)); setStatusCheck(null); }} placeholder="Enter UPI transaction ID" autoComplete="off" className="h-12 w-full rounded-xl border border-[#D6E0E9] bg-white px-4 text-sm outline-none focus:border-teal-500" />
                          <p className="mt-2 text-xs leading-5 text-[#6B7C8F]">Find the UTR in your UPI app's transaction details. Never enter your UPI PIN, OTP or banking password. A UTR or screenshot is not proof of payment; our team checks the actual merchant account credit.</p>
                          <button type="button" onClick={submitPaymentReference} disabled={busy || utr.trim().length < 8} className="mt-4 h-12 w-full rounded-xl bg-[#17365D] px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Submitting..." : "Submit UTR for verification"}</button>
                        </div>
                      )}
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E3EAF0] bg-white p-3 text-[11px] leading-5 text-[#62748A]"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#16856F]" /><p>Manual verification: your payment is not confirmed when you submit the UTR. We will verify the credit before creating your PAN-finding request. Please do not make a second payment while the first is being checked.</p></div>
                      <button type="button" onClick={() => { setStep("review"); setPaymentDetails(null); setUtr(""); setStatusCheck(null); }} className="mt-4 w-full text-xs font-semibold text-[#52667D]">Back to review</button>
                    </div>
                  </div>
                )}

                {step === "complete" && result && (
                  <div role="status" className="rounded-xl border border-[#DCE5ED] bg-white px-5 py-6 text-sm text-[#236A50]">
                    <div className="mb-3 flex items-center gap-2"><Clock3 size={20} /><p className="font-bold">{statusCheck?.status === "verified" ? "Payment verified successfully" : statusCheck?.status === "rejected" ? "Payment could not be matched" : "Payment submitted · Awaiting verification"}</p></div>
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
