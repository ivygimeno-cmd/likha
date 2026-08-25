"use client";

import Link from "next/link";
import {
  FormEvent,
  Suspense,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();

  const email =
    searchParams.get("email")?.trim() ?? "";

  const [loading, setLoading] = useState(false);
  const [resending, setResending] =
    useState(false);
  const [verified, setVerified] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [resendMessage, setResendMessage] =
    useState("");

  async function handleVerify(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(
      event.currentTarget,
    );

    const token = String(
      formData.get("token") ?? "",
    )
      .replace(/\D/g, "")
      .slice(0, 8);

    setErrorMessage("");
    setResendMessage("");

    if (!email) {
      setErrorMessage(
        "Hindi makita ang email address. Bumalik sa signup page.",
      );
      return;
    }

    if (token.length !== 8) {
      setErrorMessage(
        "Ilagay ang kumpletong 8-digit verification code.",
      );
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } =
      await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

    if (error) {
      setErrorMessage(
        error.message
          .toLowerCase()
          .includes("expired")
          ? "Expired o invalid ang code. Magpadala ng bagong code."
          : error.message,
      );

      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    setVerified(true);
    setLoading(false);
  }

  async function handleResend() {
    if (!email) {
      setErrorMessage(
        "Hindi makita ang email address. Bumalik sa signup page.",
      );
      return;
    }

    setResending(true);
    setErrorMessage("");
    setResendMessage("");

    const supabase = createClient();

    const { error } =
      await supabase.auth.resend({
        type: "signup",
        email,
      });

    if (error) {
      setErrorMessage(
        error.message
          .toLowerCase()
          .includes("rate")
          ? "Sandali lang bago humingi ulit ng code. Subukan pagkaraan ng isang minuto."
          : error.message,
      );

      setResending(false);
      return;
    }

    setResendMessage(
      "Nagpadala kami ng bagong verification code. Tingnan ang Inbox o Spam folder.",
    );

    setResending(false);
  }

  if (verified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f0e6] px-6 text-[#173d32]">
        <section className="w-full max-w-xl rounded-3xl border border-[#173d32]/15 bg-[#fbf8f1] p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#173d32] text-2xl font-bold text-white">
            ✓
          </div>

          <p className="mt-7 text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
            Email confirmed
          </p>

          <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
            Verified na ang iyong email.
          </h1>

          <p className="mt-5 leading-7 text-[#173d32]/65">
            Confirmed na ang iyong email address.
            Maaari ka nang mag-sign in gamit ang
            iyong email at password.
          </p>

          <p className="mt-3 text-sm text-[#173d32]/50">
            Ang contact number ay mananatiling
            “Not Verified” dahil wala tayong SMS
            verification.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex rounded-lg bg-[#b76449] px-7 py-4 font-semibold text-white transition hover:bg-[#9f503c]"
          >
            Mag-sign in 
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen bg-[#f5f0e6] text-[#173d32] lg:grid-cols-2">
      <section className="hidden bg-[#173d32] p-14 text-[#f5f0e6] lg:flex lg:flex-col lg:justify-between">
        <Link
          href="/"
          className="font-serif text-3xl font-semibold tracking-[0.2em]"
        >
          LIKHA
        </Link>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d9c6a5]">
            Email verification
          </p>

          <h1 className="mt-5 max-w-xl font-serif text-6xl leading-tight font-semibold">
            Isang hakbang bago magsimula.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
            I-confirm ang email upang makatulong
            sa pagpapanatiling ligtas ng LIKHA
            community.
          </p>
        </div>

        <p className="text-sm text-white/45">
          Gawang lokal. Para sa iyo.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-lg">
          <Link
            href="/"
            className="font-serif text-2xl font-semibold tracking-[0.18em] lg:hidden"
          >
            LIKHA
          </Link>

          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449] lg:mt-0">
            Check your email
          </p>

          <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
            Ilagay ang verification code.
          </h2>

          {email ? (
            <p className="mt-5 leading-7 text-[#173d32]/65">
              Nagpadala kami ng 8-digit code sa{" "}
              <span className="font-semibold text-[#173d32]">
                {email}
              </span>
              .
            </p>
          ) : (
            <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Walang email address na nakita.
              Bumalik muna sa signup page.
            </p>
          )}

          <form
            onSubmit={handleVerify}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="token"
                className="mb-2 block text-sm font-semibold"
              >
                8-digit verification code
              </label>

              <input
                id="token"
                name="token"
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{8}"
                minLength={8}
                maxLength={8}
                disabled={!email || loading}
                placeholder="00000000"
                onInput={(event) => {
                  event.currentTarget.value =
                    event.currentTarget.value
                      .replace(/\D/g, "")
                      .slice(0, 8);
                }}
                className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-4 text-center text-2xl font-semibold tracking-[0.3em] outline-none focus:border-[#b76449] disabled:opacity-60"
              />
            </div>

            {errorMessage && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            {resendMessage && (
              <p className="rounded-lg bg-[#173d32]/10 px-4 py-3 text-sm text-[#173d32]">
                {resendMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={!email || loading}
              className="w-full rounded-lg bg-[#b76449] px-6 py-4 font-semibold text-white transition hover:bg-[#9f503c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Vine-verify..."
                : "I-confirm ang Email "}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={
                !email ||
                loading ||
                resending
              }
              className="w-full rounded-lg border border-[#173d32]/20 px-6 py-3 text-sm font-semibold transition hover:border-[#b76449] hover:text-[#b76449] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending
                ? "Nagpapadala..."
                : "Magpadala ng bagong code"}
            </button>
          </form>

          <Link
            href="/signup"
            className="mt-6 block text-center text-sm font-semibold text-[#b76449]"
          >
             Bumalik sa signup
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f5f0e6] text-[#173d32]">
          <p>
            Loading verification page...
          </p>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}