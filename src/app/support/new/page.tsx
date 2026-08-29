import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewSupportTicketPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function submitTicket(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const subject = String(
      formData.get("subject") ?? "",
    ).trim();

    const message = String(
      formData.get("message") ?? "",
    ).trim();

    if (subject.length < 3 || subject.length > 120) {
      redirect(
        `/support/new?error=${encodeURIComponent(
          "Subject must contain 3 to 120 characters.",
        )}`,
      );
    }

    if (message.length < 10 || message.length > 3000) {
      redirect(
        `/support/new?error=${encodeURIComponent(
          "Message must contain 10 to 3,000 characters.",
        )}`,
      );
    }

    const {
      data: ticketId,
      error,
    } = await supabase.rpc(
      "submit_support_ticket",
      {
        p_subject: subject,
        p_message: message,
      },
    );

    if (error) {
      redirect(
        `/support/new?error=${encodeURIComponent(
          error.message,
        )}`,
      );
    }

    redirect(
      `/support/submitted?ticket=${encodeURIComponent(
        String(ticketId),
      )}`,
    );
  }

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
             Dashboard
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-14">
   

        <h1 className="mt-3 font-serif text-5xl font-semibold">
          Submit a support ticket
        </h1>

        <p className="mt-4 leading-7 text-[#173d32]/65">
          Tell us what happened. Your message will be sent
          directly to the LIKHA administration team for review.
        </p>

        {params.error && (
          <div className="mt-7 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {params.error}
          </div>
        )}

        <form
          action={submitTicket}
          className="mt-8 rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-7 shadow-sm"
        >
          <label className="block">
            <span className="text-sm font-semibold">
              Subject
            </span>

            <input
              type="text"
              name="subject"
              required
              minLength={3}
              maxLength={120}
              placeholder="Example: Request to review my messaging restriction"
              className="mt-2 w-full rounded-xl border border-[#173d32]/20 bg-white px-4 py-3 outline-none transition focus:border-[#b76449]"
            />
          </label>

          <label className="mt-6 block">
            <span className="text-sm font-semibold">
              Explain what happened
            </span>

            <textarea
              name="message"
              required
              minLength={10}
              maxLength={3000}
              rows={8}
              placeholder="Explain why you would like LIKHA to review your account..."
              className="mt-2 w-full resize-y rounded-xl border border-[#173d32]/20 bg-white px-4 py-3 leading-7 outline-none transition focus:border-[#b76449]"
            />
          </label>

          <div className="mt-5 rounded-xl bg-[#173d32]/5 p-4">
            <p className="text-sm leading-6 text-[#173d32]/60">
              Support tickets are for account review and
              platform-related concerns. They cannot be used to
              contact buyers or sellers outside LIKHA.
            </p>
          </div>

          <button
            type="submit"
            className="mt-7 w-full rounded-xl bg-[#173d32] px-6 py-4 font-semibold text-white transition hover:bg-[#245646]"
          >
            Submit Ticket 
          </button>
        </form>
      </div>
    </main>
  );
}