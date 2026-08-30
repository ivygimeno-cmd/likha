import Link from "next/link";

type PrivacySection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const privacyVersion = "1.0";
const effectiveDate = "August 5, 2026";

const privacySections: PrivacySection[] = [
  {
    title: "1. Who We Are",
    paragraphs: [
      "LIKHA is an online buyer–seller marketplace operated by Gimeno Design Solutions. For purposes of Philippine data-protection law, Gimeno Design Solutions is responsible for determining how and why personal data is processed through LIKHA.",
    ],
  },
  {
    title: "2. Information We Collect",
    paragraphs: [
      "We collect only the information reasonably necessary to create accounts, operate the marketplace, protect users, process transactions, and comply with legal obligations.",
    ],
    bullets: [
      "Account information such as full name, email address, account role, and authentication records.",
      "Profile information such as business name, profile photo, buyer or seller workspace information, ratings, and reviews.",
      "Marketplace information including project requests, proposals, accepted orders, submitted work, order status, and transaction records.",
      "Communications sent through the LIKHA inbox.",
      "Security information such as login records, device information, browser information, IP address, suspicious activity, and blocked-message events.",
      "Identity-verification results when a user chooses or is required to verify their identity.",
      "Payment and payout references when payment functionality is activated.",
    ],
  },
  {
    title: "3. Public and Private Information",
    paragraphs: [
      "Certain information is intentionally displayed publicly to help buyers and sellers evaluate each other. This may include your display name, business name, profile photo, workspace role, identity-verification badge, ratings, review count, and written reviews.",
      "Order messages are limited to the relevant buyer and seller, except when access is reasonably necessary for authorized support, fraud prevention, dispute resolution, security investigation, or legal compliance.",
      "Government IDs, selfies, biometric information, email addresses, payment credentials, and private security records are not displayed on public profiles.",
    ],
  },
  {
    title: "4. Identity Verification",
    paragraphs: [
      "LIKHA may offer or require identity verification before a user can receive seller payouts, pay for certain orders, perform high-risk activities, or receive an Identity Verified badge.",
      "The verification process may involve a government-issued ID, selfie, liveness check, face match, device signals, and duplicate-account detection.",
      "Identity verification may be processed by an approved third-party verification provider, such as Didit. The provider processes verification information on behalf of LIKHA according to its own security, privacy, and retention controls.",
      "LIKHA intends to retain only the minimum verification record needed, such as verification status, provider reference, verification level, and verification date. Raw ID and selfie files will not be placed in a public profile or public storage bucket.",
      "Where technically and legally appropriate, raw verification artifacts will be deleted after the result is securely received and recorded.",
    ],
  },
  {
    title: "5. What the Verified Badge Means",
    paragraphs: [
      "An Identity Verified badge means that the identity-verification process returned an approved identity match at the time of verification.",
      "The badge does not guarantee a user's skills, honesty, product quality, future conduct, ability to pay, or performance of an order. Users must still review profiles, proposals, ratings, order details, and messages carefully.",
    ],
  },
  {
    title: "6. How We Use Personal Data",
    paragraphs: [
      "We process personal data only for legitimate and disclosed purposes.",
    ],
    bullets: [
      "Create, authenticate, maintain, and secure user accounts.",
      "Operate buyer and seller workspaces.",
      "Publish requests, submit proposals, create orders, and manage order completion.",
      "Provide internal buyer–seller messaging.",
      "Verify identity and prevent duplicate or fraudulent accounts.",
      "Process payments, seller payouts, refunds, fees, and financial reconciliation when payment functionality is activated.",
      "Calculate the applicable 5% LIKHA seller service fee.",
      "Detect prohibited contact information, off-platform transactions, abuse, fraud, and security threats.",
      "Provide customer support and resolve disputes.",
      "Comply with applicable laws, lawful requests, and regulatory obligations.",
      "Improve the reliability, accessibility, and security of LIKHA.",
    ],
  },
  {
    title: "7. Legal Bases for Processing",
    paragraphs: [
      "Depending on the type of information and activity, LIKHA may process personal data because it is necessary to perform our agreement with you, comply with a legal obligation, protect legitimate business and security interests, establish or defend legal claims, or because you provided specific consent.",
      "Government ID, selfie, and biometric or liveness information will be processed only with the appropriate disclosure and lawful basis. Where consent is required, the consent control will be separate, specific, and unchecked by default.",
      "You may withdraw consent where processing depends on consent. Withdrawal does not affect processing that was already lawfully performed and may prevent access to features that require identity verification.",
    ],
  },
  {
    title: "8. Service Providers and Data Sharing",
    paragraphs: [
      "LIKHA does not sell personal information.",
      "We may share the minimum necessary information with service providers that help us operate LIKHA. These providers may include Supabase for authentication, database, and storage; Vercel for hosting; an identity-verification provider such as Didit; and authorized payment or payout providers when payments are activated.",
      "We may also disclose information when required by law, lawful government request, court order, fraud investigation, security incident, or to protect the rights and safety of LIKHA and its users.",
      "Service providers are expected to process information only for authorized purposes and under appropriate contractual and security obligations.",
    ],
  },
  {
    title: "9. International Processing",
    paragraphs: [
      "Some technology and verification providers may process or store data outside the Philippines.",
      "When cross-border processing occurs, Gimeno Design Solutions will take reasonable steps to use providers with appropriate privacy and security safeguards and to provide the disclosures required by applicable law.",
    ],
  },
  {
    title: "10. Payment Information",
    paragraphs: [
      "When payment functionality is activated, payment details may be collected directly by an authorized payment provider.",
      "LIKHA should not receive or store your complete card number, card security code, e-wallet password, online-banking password, or one-time password.",
      "LIKHA may retain payment references, payment status, amounts, fees, refund information, payout information, and reconciliation records as reasonably necessary.",
    ],
  },
  {
    title: "11. Automated Security and Verification Decisions",
    paragraphs: [
      "LIKHA and its providers may use automated tools to detect contact details, prohibited transactions, fraud, duplicate identities, manipulated documents, failed liveness checks, or other suspicious activity.",
      "An automated result may cause a message to be blocked or a verification to be marked for rejection or review.",
      "If you believe an automated decision is incorrect, you may request support or human review through likha.support@gimenodesignsolutions.asia.",
    ],
  },
  {
    title: "12. Data Retention",
    paragraphs: [
      "We retain personal data only for as long as reasonably necessary for the purposes described in this Policy, including account operation, transaction records, security, dispute resolution, fraud prevention, and legal compliance.",
      "Account and marketplace records may be retained while your account is active and afterward when required for legitimate disputes, financial records, enforcement, or applicable law.",
      "We will configure identity-verification retention to minimize storage of raw IDs, selfies, and biometric artifacts. Verification status and audit references may be retained longer to prevent repeated verification, duplicate accounts, fraud, and disputes.",
      "When data is no longer reasonably needed, it may be deleted, anonymized, or securely isolated according to applicable requirements.",
    ],
  },
  {
    title: "13. Security Measures",
    paragraphs: [
      "We use reasonable organizational, physical, and technical safeguards appropriate to the nature of the information. These may include access controls, authentication, Row Level Security, private storage, encryption, audit records, webhook verification, data minimization, and restricted administrative access.",
      "No website or online system can guarantee absolute security. Users must protect their passwords and immediately report suspected unauthorized access or identity misuse.",
    ],
  },
  {
    title: "14. Your Privacy Rights",
    paragraphs: [
      "Subject to applicable Philippine law, you may have the right to be informed, access your personal data, object to certain processing, correct inaccurate information, request erasure or blocking, withdraw consent, request data portability where applicable, and file a complaint with the National Privacy Commission.",
      "Some requests may be limited when retention or processing is necessary for legal obligations, fraud prevention, transaction records, disputes, security, or legal claims.",
      "To exercise a privacy right, contact likha.legal@gimenodesignsolutions.asia. We may need to verify your identity before acting on a request.",
    ],
  },
  {
    title: "15. Children",
    paragraphs: [
      "LIKHA is intended for users who are at least 18 years old. We do not knowingly allow children to create marketplace accounts or submit identity-verification information.",
      "If you believe a child has provided personal information to LIKHA, contact us so we can investigate and take appropriate action.",
    ],
  },
  {
    title: "16. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy when our services, providers, security measures, legal obligations, or data-processing activities change.",
      "Material changes may be announced through LIKHA and may require a new acknowledgment or consent where legally required. The current version and effective date will always appear on this page.",
    ],
  },
  {
    title: "17. Contact Information",
    paragraphs: [
      "For privacy, identity-verification, or legal concerns, contact likha.legal@gimenodesignsolutions.asia.",
      "For account, order, payment, or general support, contact likha.support@gimenodesignsolutions.asia.",
      "LIKHA is operated by Gimeno Design Solutions in the Philippines.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="sticky top-0 z-50 border-b border-[#173d32]/15 bg-[#f5f0e6]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
          <Link
            href="/"
            className="font-serif text-3xl font-semibold tracking-[0.2em]"
          >
            LIKHA
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-sm font-semibold hover:text-[#b76449]"
            >
              Terms
            </Link>

            <Link
              href="/"
              className="text-sm font-semibold hover:text-[#b76449]"
            >
              Back to Home 
            </Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-10 lg:py-24">
       

        <h1 className="mt-4 font-serif text-5xl font-semibold sm:text-6xl">
          Privacy Policy
        </h1>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-y border-[#173d32]/15 py-5 text-sm text-[#173d32]/60">
          <p>Version {privacyVersion}</p>
          <p>Effective {effectiveDate}</p>
          <p>Gimeno Design Solutions</p>
        </div>

        <p className="mt-8 text-lg leading-8 text-[#173d32]/70">
          This Policy explains what information LIKHA collects, why it is
          used, who may process it, how it is protected, and the choices
          available to you.
        </p>

        <aside className="mt-10 border border-[#173d32]/20 bg-[#fbf8f1] p-7">
        

          <h2 className="mt-3 font-serif text-3xl font-semibold">
            Your ID and selfie are never displayed publicly.
          </h2>

          <p className="mt-4 leading-7 text-[#173d32]/65">
            They are used only for identity verification, fraud prevention,
            and account protection. LIKHA keeps only the minimum verification
            result and reference needed after the verification process.
          </p>
        </aside>

        <div className="mt-14 space-y-12">
          {privacySections.map((section) => (
            <section
              key={section.title}
              className="border-t border-[#173d32]/15 pt-8"
            >
              <h2 className="font-serif text-3xl font-semibold">
                {section.title}
              </h2>

              <div className="mt-5 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="leading-8 text-[#173d32]/70"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {section.bullets && (
                <ul className="mt-5 list-disc space-y-3 pl-6 text-[#173d32]/70">
                  {section.bullets.map((item) => (
                    <li key={item} className="leading-7">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <aside className="mt-16 border border-[#173d32]/20 bg-[#fbf8f1] p-7">
          <h2 className="font-serif text-2xl font-semibold">
            Privacy questions or requests?
          </h2>

          <p className="mt-3 leading-7 text-[#173d32]/65">
            Email{" "}
            <a
              href="mailto:likha.legal@gimenodesignsolutions.asia"
              className="font-semibold text-[#b76449]"
            >
              likha.legal@gimenodesignsolutions.asia
            </a>
            .
          </p>
        </aside>
      </div>
    </main>
  );
}