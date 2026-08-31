import Link from "next/link";

type TermsSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const termsVersion = "2.0";
const effectiveDate = "August 6, 2026";

const termsSections: TermsSection[] = [
  {
    title: "1. Agreement to These Terms",
    paragraphs: [
      "These Terms and Conditions govern your access to and use of LIKHA, an online buyer–creator marketplace operated by Gimeno Design Solutions.",
      "By creating an account, accessing LIKHA, purchasing or using LIKHA Credits, or using marketplace features, you confirm that you have read, understood, and agreed to these Terms and the LIKHA Privacy Policy.",
      "Existing users may be required to accept this updated version before continuing to use proposals, payments, or other affected marketplace features.",
    ],
  },
  {
    title: "2. Eligibility and Accounts",
    paragraphs: [
      "You must be at least 18 years old and legally capable of entering into contracts to create and use a LIKHA account.",
      "You must provide accurate, current, and complete account information. You are responsible for protecting your login credentials and for activity performed through your account.",
      "A LIKHA account may use buyer and creator workspaces. Switching workspaces does not create a separate identity or remove your responsibilities under these Terms.",
      "Users may not create multiple accounts to obtain additional promotional Credits, evade restrictions, manipulate reviews, or misuse marketplace promotions.",
    ],
  },
  {
    title: "3. Role of LIKHA",
    paragraphs: [
      "LIKHA provides technology that allows buyers to post project requests, creators to submit proposals, and both parties to manage orders and communicate.",
      "Unless expressly stated otherwise, Gimeno Design Solutions is not the manufacturer, creator, buyer, employer, agent, or representative of marketplace users.",
      "Buyers and creators remain responsible for their agreements, products, services, taxes, permits, registrations, and other legal obligations.",
    ],
  },
  {
    title: "4. Requests, Proposals, and Orders",
    paragraphs: [
      "Buyers must provide truthful and sufficiently detailed project requirements, including expected quantity, budget, location, specifications, and deadline.",
      "creators must submit accurate proposals containing realistic prices, delivery times, capabilities, and conditions.",
      "When a buyer accepts a proposal, an order is created between the buyer and creator. Both parties must perform their responsibilities according to the accepted proposal, order details, and these Terms.",
    ],
  },
  {
    title: "5. Communication and Off-Platform Transactions",
    paragraphs: [
      "When a buyer and creator are introduced through LIKHA, project-related communication and transactions should remain inside LIKHA.",
      "Users must not share or request phone numbers, email addresses, social-media accounts, external messaging details, direct payment instructions, or other contact or payment information for the purpose of moving a LIKHA transaction outside the platform.",
      "Users must not direct another user to Facebook, Messenger, WhatsApp, Telegram, Viber, Instagram, Discord, or similar platforms to continue a LIKHA transaction outside the platform.",
      "Users must not arrange direct GCash, Maya, bank, cryptocurrency, or other payment arrangements outside the approved LIKHA checkout when the transaction originated through LIKHA.",
      "If a buyer or creator chooses to continue a transaction outside LIKHA, that transaction is no longer covered by LIKHA's marketplace protections, transaction records, dispute process, refund controls, or other platform safeguards.",
      "Users who knowingly move a transaction outside LIKHA do so at their own risk. LIKHA cannot guarantee assistance, recovery of funds, or resolution of losses arising from an off-platform transaction.",
      "LIKHA may automatically block prohibited contact or payment information and may record security events for fraud prevention, moderation, and enforcement.",
    ],
    bullets: [
      "No sharing or requesting contact details for the purpose of moving a LIKHA transaction outside the platform.",
      "No direct GCash, Maya, bank, cryptocurrency, or other payment arrangement outside the approved LIKHA checkout.",
      "No attempt to bypass LIKHA checkout, Credits rules, safety controls, dispute procedures, or transaction records.",
      "No directing another user to Facebook, Messenger, WhatsApp, Telegram, Viber, Instagram, Discord, or similar platforms to continue a LIKHA transaction outside the platform.",
    ],
  },
  {
    title: "6. LIKHA Credits",
    paragraphs: [
      "LIKHA Credits are limited-use platform units that creators may use to submit proposals and access other eligible marketplace features.",
      "LIKHA Credits are not legal tender, deposited money, creator earnings, or an electronic-wallet balance. They cannot be withdrawn, transferred, sold, gifted, exchanged for cash, or used to pay a creator for an order.",
      "The available Credit bundles, prices, quantities, payment charges, and applicable promotional bonuses will be displayed before purchase.",
      "Purchased Credits do not expire solely because of the passage of time while the user's account remains active. Promotional or complimentary Credits may have separate eligibility conditions or expiration periods that will be disclosed when issued.",
      "Except for duplicate charges, platform errors, circumstances expressly covered by these Terms, or refunds required by applicable law, completed Credit purchases are generally not refundable.",
    ],
  },
  {
    title: "7. Proposal Credit Cost and Refunds",
    paragraphs: [
      "The current standard cost to submit one proposal is 15 LIKHA Credits. The exact Credit cost must be displayed to the creator before final submission.",
      "Credits are deducted when a proposal is successfully submitted. A creator will not receive a Credit refund merely because the proposal was rejected, was not selected, expired, or was voluntarily withdrawn.",
      "Proposal Credits may be returned when the buyer cancels or closes the request without accepting a proposal, when LIKHA removes the request for a verified policy violation, or when a technical error caused an incorrect deduction.",
      "If LIKHA changes the Credit cost of future proposals, the new cost will be displayed before submission and will not retroactively change a proposal already submitted.",
    ],
  },
  {
    title: "8. Complimentary and Promotional Credits",
    paragraphs: [
      "Eligible newly identity-verified creators may receive a one-time welcome bonus of 50 complimentary LIKHA Credits.",
      "The welcome bonus is limited to one qualifying person and may be withheld, reversed, or cancelled when LIKHA reasonably detects duplicate accounts, identity misuse, fraud, promotion abuse, or another violation of these Terms.",
      "Complimentary and promotional Credits have no cash value and cannot be withdrawn, transferred, sold, or exchanged for creator earnings.",
      "LIKHA may introduce, modify, pause, or end future promotional programs. Conditions for each promotion will be disclosed before participation.",
    ],
  },
  {
    title: "9. Zero Commission, Payments, and Payouts",
    paragraphs: [
      "Under the current LIKHA Credits model, LIKHA does not charge creators a percentage commission on the agreed order price.",
      "A 0% LIKHA commission does not mean that every transaction is free from third-party payment-processing charges, payout charges, taxes, refunds, chargebacks, or legally required deductions.",
      "Any applicable payment-processing charge must be disclosed through the relevant checkout or payment interface before payment confirmation.",
      "Payments may be processed by authorized third-party payment providers. Their verification, transaction, refund, settlement, chargeback, and payout requirements may also apply.",
      "creator earnings come from payments made by buyers for accepted orders. LIKHA Credits cannot be converted into creator earnings or used as payment for completed work.",
      "If LIKHA introduces a percentage commission in the future, it will not apply retroactively to completed orders and will require clear notice before applying to future transactions.",
    ],
  },
  {
    title: "10. Submission, Acceptance, and Completion",
    paragraphs: [
      "The creator must submit completed work through the order process within the agreed schedule.",
      "The buyer must review submitted work honestly and within a reasonable period. A buyer must not mark an order as completed before checking the delivered work.",
      "Completion of an order does not remove either party's obligations involving fraud, intellectual-property violations, product safety, warranties expressly offered, or applicable consumer law.",
    ],
  },
  {
    title: "11. Cancellations, Refunds, and Disputes",
    paragraphs: [
      "Before a proposal is accepted, a buyer may close or withdraw a request subject to the controls available on LIKHA and the applicable proposal Credit refund rules.",
      "After an order is created, cancellation or refund eligibility may depend on the order status, work already completed, materials purchased, evidence submitted, and applicable law.",
      "Users must participate honestly in LIKHA's dispute process and provide relevant messages, files, receipts, delivery records, or other evidence when requested.",
      "Nothing in these Terms removes consumer rights that cannot legally be waived.",
    ],
  },
  {
    title: "12. creator Responsibilities",
    paragraphs: [
      "creators are responsible for the quality, legality, safety, accuracy, and timely delivery of their products and services.",
    ],
    bullets: [
      "Use only materials, designs, and intellectual property they are authorized to use.",
      "Maintain permits, registrations, and licenses required for their activities.",
      "Disclose material limitations, risks, delivery conditions, and additional costs before proposal acceptance.",
      "Avoid counterfeit, misleading, unsafe, prohibited, or unlawfully sourced products.",
      "Use welcome and promotional Credits only for genuine proposals submitted in good faith.",
    ],
  },
  {
    title: "13. Buyer Responsibilities",
    paragraphs: [
      "Buyers must provide clear instructions, communicate honestly, maintain sufficient funds, and review creator submissions fairly.",
      "Buyers may not request illegal, unsafe, counterfeit, infringing, deceptive, or prohibited products or services.",
      "Buyers may not create fake requests to help another user obtain benefits, manipulate activity, or abuse proposal Credit refund rules.",
    ],
  },
  {
    title: "14. Prohibited Conduct",
    paragraphs: [
      "Users may not misuse LIKHA or interfere with the safety and rights of other users.",
    ],
    bullets: [
      "Fraud, impersonation, identity misuse, account selling, or deceptive conduct.",
      "Creating duplicate accounts to obtain additional free or promotional Credits.",
      "Harassment, threats, discrimination, exploitation, or abusive communication.",
      "Malware, scraping, unauthorized automation, security testing without permission, or attempts to bypass access controls.",
      "Fake requests, orders, proposals, ratings, reviews, payment records, or delivery evidence.",
      "Manipulating Credit balances, promotions, referrals, payments, refunds, or transaction records.",
      "Content or transactions that violate Philippine law or the rights of another person.",
    ],
  },
  {
    title: "15. Content and Intellectual Property",
    paragraphs: [
      "Users retain ownership of content they submit, subject to the rights necessary for LIKHA to host, display, process, secure, and moderate that content in operating the marketplace.",
      "Unless the buyer and creator expressly agree otherwise, pre-existing designs, trademarks, tools, methods, and materials remain owned by their original owner.",
      "Users must clearly agree on any transfer or license of custom design rights. Payment for a physical product does not automatically transfer every related copyright, trademark, source file, or commercial-use right.",
      "LIKHA's name, interface, branding, software, and original platform materials belong to Gimeno Design Solutions and may not be copied or used without permission.",
    ],
  },
  {
    title: "16. Identity Verification",
    paragraphs: [
      "LIKHA may offer or require identity verification for certain marketplace features, security reviews, promotional Credits, payment access, or account recovery.",
      "Identity verification may be performed by an authorized third-party provider. Additional privacy disclosures and provider terms may apply before verification begins.",
      "A verification badge indicates that the account completed LIKHA's applicable verification process. It is not a guarantee of product quality, honesty, financial ability, or successful performance.",
      "Users may not lend, sell, transfer, or allow another person to use a verified account or verification badge.",
    ],
  },
  {
    title: "17. Ratings and Reviews",
    paragraphs: [
      "Reviews must reflect genuine completed transactions and honest experiences. LIKHA may remove reviews involving fraud, manipulation, harassment, prohibited personal information, or irrelevant content.",
      "Users may not buy, sell, exchange, threaten, or pressure another person for a particular rating or review.",
    ],
  },
  {
    title: "18. Suspension and Termination",
    paragraphs: [
      "LIKHA may restrict, suspend, or terminate an account when reasonably necessary to investigate fraud, protect users, comply with law, enforce these Terms, or prevent harm to the platform.",
      "Serious violations may result in immediate restriction. Where appropriate, LIKHA may request an explanation or supporting evidence before making a final decision.",
      "Suspension or termination does not convert unused Credits into cash. Requests involving unused purchased Credits will be reviewed according to the reason for restriction, transaction history, applicable law, and rights that cannot legally be waived.",
    ],
  },
  {
    title: "19. Privacy and Security",
    paragraphs: [
      "Personal information is handled according to the LIKHA Privacy Policy and applicable Philippine data-protection law.",
      "No online service can guarantee absolute security. Users must promptly report suspected unauthorized account access, fraud, or security incidents.",
    ],
  },
  {
    title: "20. Availability and Limitation of Liability",
    paragraphs: [
      "LIKHA is provided on an as-available basis. Gimeno Design Solutions does not guarantee that every user, proposal, product, delivery, or transaction will meet another user's expectations.",
      "To the maximum extent allowed by law, Gimeno Design Solutions is not responsible for indirect or consequential losses arising from user conduct, third-party services, unauthorized activity, or circumstances outside its reasonable control.",
      "Nothing in these Terms excludes liability or consumer rights that cannot legally be excluded or limited.",
    ],
  },
  {
    title: "21. Changes to These Terms",
    paragraphs: [
      "LIKHA may update these Terms to reflect new features, pricing, laws, security requirements, payment methods, or marketplace practices.",
      "Material updates may require users to review and accept a new version before continuing to use affected features. The version and effective date will be displayed on this page.",
      "Changes to Credit prices, proposal costs, payment charges, or promotional programs will be disclosed before they apply to a new purchase or transaction.",
    ],
  },
  {
    title: "22. Governing Law and Contact",
    paragraphs: [
      "These Terms are governed by the laws of the Republic of the Philippines.",
      "Users should first contact LIKHA support and attempt to resolve disputes in good faith. This does not prevent either party from using remedies available under applicable law.",
      "Legal and privacy concerns may be sent to likha.legal@gimenodesignsolutions.asia. Account, order, Credit, and payment support may be sent to likha.support@gimenodesignsolutions.asia.",
    ],
  },
];

export default function TermsPage() {
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

          <Link
            href="/"
            className="text-sm font-semibold hover:text-[#b76449]"
          >
            Back to Home 
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-10 lg:py-24">
        

        <h1 className="mt-4 font-serif text-5xl font-semibold sm:text-6xl">
          Terms and Conditions
        </h1>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-y border-[#173d32]/15 py-5 text-sm text-[#173d32]/60">
          <p>Version {termsVersion}</p>
          <p>Effective {effectiveDate}</p>
          <p>Operated by Gimeno Design Solutions</p>
        </div>

        <p className="mt-8 text-lg leading-8 text-[#173d32]/70">
          Please read these Terms carefully before creating or using a LIKHA
          account.
        </p>

        <div className="mt-14 space-y-12">
          {termsSections.map((section) => (
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
            Questions about these Terms?
          </h2>

          <p className="mt-3 leading-7 text-[#173d32]/65">
            Contact Gimeno Design Solutions at{" "}
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