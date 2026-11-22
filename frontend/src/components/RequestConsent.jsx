
import { useState } from "react";
import "./RequestConsent.css";

const documents = {
    privacy: {
        title: "Privacy Policy",
        sections: [
            ["1. Information we collect",
                "Depending on the service requested, we may collect your name, contact details, request information and other details necessary to handle your request. Where PANKhojo has verified a lawful basis and an authorised process, we request the Aadhaar number only—not an Aadhaar photo or document."],
            ["2. How we use your information",
                "We use information to receive, review, communicate about and process your request; verify the information where legally permitted; prevent misuse; maintain service records; and meet applicable legal obligations."],
            ["3. Sharing of information",
                "We do not sell your personal information. Information may be shared with authorised service providers, technology providers or other parties only where necessary for the stated purpose and permitted by applicable law. We will not represent an external provider as a government authority."],
            ["4. Data security",
                "We use reasonable technical and organisational safeguards designed to protect information against unauthorised access, loss, misuse or disclosure. No internet transmission or storage system can be guaranteed to be completely secure."],
            ["5. Retention and deletion",
                "We retain personal information only for as long as reasonably necessary for the stated purpose, customer support, dispute handling and applicable legal requirements. You may request deletion, subject to information we are legally required or permitted to retain."],
            ["6. Your choices and rights",
                "You may contact us to request access, correction, erasure or withdrawal of consent where applicable. Withdrawal may prevent us from continuing a service that depends on the relevant information."],
            ["7. Cookies and technical information",
                "Our website or service providers may process limited technical information needed for website security, functionality and performance. Any optional analytics or marketing technologies should be disclosed and controlled separately."],
            ["8. Contact and complaints",
                "For privacy questions, requests or complaints, contact: [PRIVACY EMAIL]. Grievance contact: [NAME / ROLE / EMAIL / POSTAL ADDRESS]."]
        ]
    },
    terms: {
        title: "Terms of Service",
        sections: [
            ["1. About PANKhojo",
                "PANKhojo is an independent private PAN-finding service. It is not a government website, the Income Tax Department, NSDL, UTIITSL or UIDAI, and it does not issue PAN cards or PAN numbers."],
            ["2. Scope of service",
                "PANKhojo provides a private PAN-finding service for existing PAN details, where the request and processing method are lawful and available. We do not guarantee that a PAN number will be found, that records will match, or that a request will be completed within a particular time."],
            ["3. Eligibility and authority",
                "You must submit a request for yourself or have valid legal authority to act for the person concerned. You must be legally capable of entering into these terms. Do not submit another person's personal information without their valid authority and any consent required by law. We may refuse or stop requests that cannot be lawfully processed."],
            ["4. Accurate information and customer responsibilities",
                "You are responsible for providing accurate information, using contact details you control, responding to reasonable verification questions and promptly notifying us of errors. Do not submit false information, impersonate another person or use the service for unlawful purposes."],
            ["5. Consent and third-party processing",
                "You authorise us to handle the information you submit for the specific service purpose described in the Privacy Policy. Any disclosure to an external provider will occur only where necessary and legally permitted. Your consent does not authorise PANKhojo or any provider to perform an activity prohibited by law."],
            ["6. Fees and refunds",
                "Any applicable fee must be shown before payment. We will communicate the service scope and applicable refund conditions before accepting payment. A fee will not be described as a government fee unless it is actually payable to a government authority. Refunds, cancellations and failed requests will be handled under the published Refund Policy and applicable consumer law."],
            ["7. No guarantee or official status",
                "PANKhojo does not guarantee successful retrieval, availability of third-party systems, accuracy of external records or a particular outcome. Only the relevant government authority can provide official confirmation, correction, issuance or other statutory PAN services."],
            ["8. Suspension and refusal",
                "We may decline, pause or cancel a request where information is incomplete, authority is unclear, fraud or misuse is suspected, a third-party service is unavailable, or processing may breach applicable law. Where appropriate, we will explain the reason and any applicable refund process."],
            ["9. Liability",
                "Nothing in these terms excludes or limits liability where such exclusion or limitation is prohibited by law, including liability for fraud, wilful misconduct, or rights that cannot legally be waived. To the extent permitted by law, PANKhojo is not responsible for delays or failures caused by inaccurate information supplied by the customer, unavailable external systems or events beyond our reasonable control."],
            ["10. Complaints and dispute resolution",
                "Please first contact [SUPPORT EMAIL] so we can try to resolve your concern. Nothing in this clause prevents you from exercising rights or remedies available under applicable Indian law or approaching a competent authority or forum."],
            ["11. Changes and governing law",
                "We may update these terms when our service or legal requirements change. The applicable version will be displayed on this website. These terms are governed by the laws of India, subject to mandatory consumer protections and the jurisdiction of competent courts."],
            ["12. Contact details",
                "Business name: [LEGAL BUSINESS NAME]. Address: [REGISTERED BUSINESS ADDRESS]. Email: [SUPPORT EMAIL]. Grievance contact: [NAME / ROLE / EMAIL]."]
        ]
    }
};

export default function RequestConsent({ onAccepted }) {
    const [open, setOpen] = useState(null);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const accepted = privacyAccepted && termsAccepted;

    function confirmConsent() {
        if (!accepted) return;

        onAccepted?.({
            privacyAccepted: true,
            termsAccepted: true,
            privacyVersion: "1.0",
            termsVersion: "1.0",
            consentedAt: new Date().toISOString()
        });
    }

    return (
        <div className="request-consent">
            <div className="consent-row">
                <input
                    id="privacyConsent"
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                />
                <label htmlFor="privacyConsent">
                    I have read and agree to the{" "}
                    <button type="button" className="document-link"
                        onClick={() => setOpen("privacy")}>
                        Privacy Policy
                    </button>.
                </label>
            </div>

            <div className="consent-row">
                <input
                    id="termsConsent"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <label htmlFor="termsConsent">
                    I have read and agree to the{" "}
                    <button type="button" className="document-link"
                        onClick={() => setOpen("terms")}>
                        Terms of Service
                    </button>.
                </label>
            </div>

            <button
                type="button"
                className="consent-confirm"
                disabled={!accepted}
                onClick={confirmConsent}
            >
                Confirm consent
            </button>

            {open && (
                <div className="policy-overlay" role="presentation"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setOpen(null);
                    }}>
                    <section className="policy-modal"
                        role="dialog" aria-modal="true"
                        aria-labelledby="policyTitle">
                        <header className="policy-header">
                            <h2 id="policyTitle">{documents[open].title}</h2>
                            <button type="button" aria-label="Close"
                                onClick={() => setOpen(null)}>×</button>
                        </header>

                        <div className="policy-content">
                            {documents[open].sections.map(([heading, body]) => (
                                <section key={heading}>
                                    <h3>{heading}</h3>
                                    <p>{body}</p>
                                </section>
                            ))}
                        </div>

                        <footer className="policy-footer">
                            <button type="button" onClick={() => setOpen(null)}>
                                Close and return to form
                            </button>
                        </footer>
                    </section>
                </div>
            )}
        </div>
    );
}
