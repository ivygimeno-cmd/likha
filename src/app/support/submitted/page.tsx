import Link from "next/link";

export default function SupportTicketSubmittedPage() {
  return (
    <main className="min-h-screen bg-[#f5f0e6] px-6 py-20 text-[#173d32]">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#173d32] text-xl text-white">
          ✓
        </div>

        <h1 className="mt-6 font-serif text-4xl font-semibold">
          Ticket submitted
        </h1>

        <p className="mt-4 leading-7 text-[#173d32]/65">
          Your request has been sent to LIKHA Support.
          An administrator can now review your concern.
        </p>

        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-xl bg-[#173d32] px-6 py-3 font-semibold text-white transition hover:bg-[#245646]"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}