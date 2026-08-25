import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type WarningRecord = {
  id: string;
  user_id: string;
  warning_number: number;
  title: string;
  message: string;
  acknowledged_at: string | null;
  created_at: string;
};

export default async function WarningPage({
  params,
}: {
  params: Promise<{ warningId: string }>;
}) {
  const { warningId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

const {
  data: warningData,
  error: warningError,
} = await supabase
  .rpc("get_my_moderation_warning", {
    p_warning_id: warningId,
  })
  .maybeSingle();

  if (warningError) {
    throw new Error(
      `Hindi ma-load ang warning: ${warningError.message}`,
    );
  }

  if (!warningData) {
    notFound();
  }

  const warning = warningData as WarningRecord;

  async function acknowledgeWarning() {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "acknowledge_moderation_warning",
      {
        p_warning_id: warningId,
      },
    );

    if (error) {
      throw new Error(
        `Hindi ma-acknowledge ang warning: ${error.message}`,
      );
    }

    const result = data as {
      acknowledged_warning_count?: number;
      chat_locked?: boolean;
    } | null;

    if (result?.chat_locked === true) {
      redirect(
        `/dashboard?notice=${encodeURIComponent(
          "Messaging access restricted after three acknowledged policy warnings.",
        )}`,
      );
    }

    redirect(
      `/dashboard?notice=${encodeURIComponent(
        "Warning acknowledged.",
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
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
          Account Policy Notice
        </p>

        <h1 className="mt-3 font-serif text-5xl font-semibold">
          {warning.title}
        </h1>

        <p className="mt-3 text-sm text-[#173d32]/45">
          Warning #{warning.warning_number} ·{" "}
          {new Date(
            warning.created_at,
          ).toLocaleString("en-PH", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>

        <section className="mt-8 rounded-2xl border border-[#b76449]/25 bg-[#fbf8f1] p-7">
          <p className="leading-8 text-[#173d32]/75">
            {warning.message}
          </p>

          <div className="mt-6 rounded-xl bg-[#b76449]/10 p-5">
            <p className="text-sm font-semibold text-[#9f503c]">
              Important
            </p>

            <p className="mt-2 text-sm leading-6 text-[#173d32]/65">
              Repeated acknowledged violations may result in restricted messaging access.
            </p>
          </div>
        </section>

        {warning.acknowledged_at ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <p className="font-semibold text-green-800">
              ✓ You already acknowledged this warning.
            </p>

            <p className="mt-1 text-sm text-green-700">
              {new Date(
                warning.acknowledged_at,
              ).toLocaleString("en-PH")}
            </p>
          </div>
        ) : (
          <form action={acknowledgeWarning} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-xl bg-[#173d32] px-6 py-4 font-semibold text-white transition hover:bg-[#245646]"
            >
              I Understand
            </button>
          </form>
        )}
      </div>
    </main>
  );
}