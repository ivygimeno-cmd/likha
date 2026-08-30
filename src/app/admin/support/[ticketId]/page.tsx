import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AdminSupportTicket = {
  ticket_id: string;
  user_id: string;
  account_name: string;
  email: string | null;
  category: string;
  subject: string;
  message: string;
  status: "open" | "in_review" | "resolved" | "closed";
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  chat_locked: boolean;
  warning_count: number;
  acknowledged_warning_count: number;
};

export default async function AdminSupportTicketPage({
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
    data: isAdmin,
    error: adminError,
  } = await supabase.rpc("is_likha_admin");

  if (adminError) {
    throw new Error(
      `Hindi ma-check ang admin access: ${adminError.message}`,
    );
  }

  if (isAdmin !== true) {
    notFound();
  }

  const {
    data: ticketData,
    error: ticketError,
  } = await supabase.rpc(
    "get_admin_support_ticket",
    {
      p_ticket_id: ticketId,
    },
  );

  if (ticketError) {
    throw new Error(
      `Hindi ma-load ang support ticket: ${ticketError.message}`,
    );
  }

  if (!ticketData) {
    notFound();
  }

  const ticket = ticketData as AdminSupportTicket;
async function respondToTicket(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: isAdmin,
    error: adminAccessError,
  } = await supabase.rpc("is_likha_admin");

  if (adminAccessError) {
    throw new Error(
      `Hindi ma-check ang admin access: ${adminAccessError.message}`,
    );
  }

  if (isAdmin !== true) {
    notFound();
  }

  const response = String(
    formData.get("response") ?? "",
  ).trim();

  const status = String(
    formData.get("status") ?? "in_review",
  );

  const unlockMessaging =
    formData.get("unlockMessaging") === "true";

  const { error } = await supabase.rpc(
    "admin_respond_support_ticket",
    {
      p_ticket_id: ticketId,
      p_response: response,
      p_status: status,
      p_unlock_messaging: unlockMessaging,
    },
  );

  if (error) {
    throw new Error(
      `Hindi ma-update ang support ticket: ${error.message}`,
    );
  }

  redirect(`/admin/support/${ticketId}`);
}
  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 lg:px-10">
          <Link
            href="/admin"
            className="font-serif text-3xl font-semibold tracking-[0.2em]"
          >
            LIKHA
          </Link>

          <Link
            href="/admin"
            className="text-sm font-semibold hover:text-[#b76449]"
          >
             Admin Dashboard
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
              Support Ticket
            </p>

            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold">
              {ticket.subject}
            </h1>

            <p className="mt-3 text-sm text-[#173d32]/50">
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

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#173d32]/45">
              Account
            </p>

            <p className="mt-3 font-serif text-2xl font-semibold">
              {ticket.account_name}
            </p>

            <p className="mt-2 text-sm text-[#173d32]/55">
              {ticket.email ?? "No email"}
            </p>

            <Link
              href={`/profile/${ticket.user_id}`}
              className="mt-4 inline-block text-sm font-semibold text-[#b76449]"
            >
           Tingnan ang profile
            </Link>
          </div>

          <div className="rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#173d32]/45">
              Moderation Status
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#173d32]/55">
                  Messaging
                </span>

                <span
                  className={
                    ticket.chat_locked
                      ? "font-semibold text-red-700"
                      : "font-semibold text-green-700"
                  }
                >
                  {ticket.chat_locked
                    ? "Locked"
                    : "Active"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[#173d32]/55">
                  Warnings
                </span>

                <span className="font-semibold">
                  {ticket.warning_count}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[#173d32]/55">
                  Acknowledged
                </span>

                <span className="font-semibold">
                  {ticket.acknowledged_warning_count}
                </span>
              </div>
            </div>

            <Link
              href={`/admin/users/${ticket.user_id}`}
              className="mt-4 inline-block text-sm font-semibold text-[#b76449]"
            >
              Open Investigation 
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#b76449]">
            User Message
          </p>

          <p className="mt-4 whitespace-pre-wrap text-lg leading-8 text-[#173d32]/75">
            {ticket.message}
          </p>
        </section>

 {ticket.admin_response && (
  <section className="mt-6 rounded-2xl border border-[#173d32]/15 bg-[#173d32] p-7 text-white">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#d9c6a5]">
        Admin Response
      </p>

      <time className="text-xs text-white/50">
        {new Date(ticket.updated_at).toLocaleString("en-PH", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </time>
    </div>

    <p className="mt-4 whitespace-pre-wrap leading-7 text-white/80">
      {ticket.admin_response}
    </p>
  </section>
)}

{ticket.status !== "resolved" &&
  ticket.status !== "closed" && (

      <section className="mt-8 rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-7">
  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b76449]">
    Admin Response
  </p>

  <h2 className="mt-2 font-serif text-3xl font-semibold">
    Respond to this ticket
  </h2>

  <form action={respondToTicket} className="mt-6 space-y-5">
    <label className="block">
      <span className="text-sm font-semibold">
        Response to user
      </span>

      <textarea
        name="response"
        required
        minLength={3}
        maxLength={3000}
        rows={7}
        defaultValue={ticket.admin_response ?? ""}
        placeholder="Write your response to the user..."
        className="mt-2 w-full resize-y rounded-xl border border-[#173d32]/20 bg-white px-4 py-3 leading-7 outline-none transition focus:border-[#b76449]"
      />
    </label>

    <label className="block">
      <span className="text-sm font-semibold">
        Ticket status
      </span>

      <select
        name="status"
        defaultValue={ticket.status}
        className="mt-2 w-full rounded-xl border border-[#173d32]/20 bg-white px-4 py-3 outline-none transition focus:border-[#b76449]"
      >
        <option value="open">Open</option>
        <option value="in_review">In Review</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
    </label>

    {ticket.chat_locked && (
      <label className="flex items-start gap-3 rounded-xl border border-[#173d32]/15 bg-[#173d32]/5 p-4">
        <input
          type="checkbox"
          name="unlockMessaging"
          value="true"
          className="mt-1 h-4 w-4"
        />

        <span>
          <span className="block font-semibold">
            Unlock Messaging
          </span>

          <span className="mt-1 block text-sm leading-6 text-[#173d32]/55">
            Restore this user&apos;s messaging access when sending
            this response.
          </span>
        </span>
      </label>
    )}

    <button
      type="submit"
      className="rounded-xl bg-[#173d32] px-6 py-4 font-semibold text-white transition hover:bg-[#245646]"
    >
      Send Response 
    </button>
  </form>
</section>


)}
      </div>
    </main>
  );
}