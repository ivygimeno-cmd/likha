import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SupportTicket = {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  message: string;
  status: "open" | "in_review" | "resolved" | "closed";
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: ticketData,
    error: ticketError,
  } = await supabase
    .rpc("get_my_support_ticket", {
      p_ticket_id: ticketId,
    })
    .maybeSingle();

  if (ticketError) {
    throw new Error(
      `Hindi ma-load ang support ticket: ${ticketError.message}`,
    );
  }

  if (!ticketData) {
    notFound();
  }

  const ticket = ticketData as SupportTicket;

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link
            href="/dashboard"
            className="font-serif text-3xl font-semibold tracking-[0.2em]"
          >
            LIKHA
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-semibold hover:text-[#b76449]"
          >
            ← Dashboard
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
              LIKHA Support
            </p>

            <h1 className="mt-3 font-serif text-4xl font-semibold">
              {ticket.subject}
            </h1>

            <p className="mt-3 text-sm text-[#173d32]/45">
              Submitted{" "}
              {new Date(ticket.created_at).toLocaleString(
                "en-PH",
                {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                },
              )}
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
              ticket.status === "open"
                ? "bg-[#b76449]/10 text-[#b76449]"
                : ticket.status === "in_review"
                  ? "bg-amber-100 text-amber-700"
                  : ticket.status === "resolved"
                    ? "bg-green-100 text-green-700"
                    : "bg-[#173d32]/10 text-[#173d32]/60"
            }`}
          >
            {ticket.status
              .replace("_", " ")
              .toUpperCase()}
          </span>
        </div>

        <section className="mt-8 rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#173d32]/45">
            Your Message
          </p>

          <p className="mt-4 whitespace-pre-wrap leading-8 text-[#173d32]/75">
            {ticket.message}
          </p>
        </section>

        {ticket.admin_response ? (
          <section className="mt-6 rounded-2xl bg-[#173d32] p-7 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#d9c6a5]">
              LIKHA Support Response
            </p>

            <p className="mt-4 whitespace-pre-wrap leading-8 text-white/80">
              {ticket.admin_response}
            </p>

            {ticket.resolved_at && (
              <p className="mt-5 text-xs text-white/45">
                Updated{" "}
                {new Date(
                  ticket.resolved_at,
                ).toLocaleString("en-PH")}
              </p>
            )}
          </section>
        ) : (
          <section className="mt-6 rounded-2xl border border-dashed border-[#173d32]/25 p-7">
            <p className="font-semibold">
              Your ticket is waiting for a response.
            </p>

            <p className="mt-2 text-sm leading-6 text-[#173d32]/55">
              LIKHA Support will review your concern. You will
              receive a notification when there is an update.
            </p>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-[#173d32] px-6 py-3 font-semibold text-white transition hover:bg-[#245646]"
          >
            Back to Dashboard
          </Link>

          <Link
            href="/support/new"
            className="rounded-xl border border-[#173d32]/20 px-6 py-3 font-semibold transition hover:border-[#173d32]/40"
          >
            Submit Another Ticket
          </Link>
        </div>
      </div>
    </main>
  );
}