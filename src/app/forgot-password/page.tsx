"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const email = String(
      formData.get("email") ?? "",
    )
      .trim()
      .toLowerCase();

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Kung may LIKHA account na naka-register sa email na ito, magpapadala kami ng password reset link.",
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
        <div className="w-full">
       

          <h1 className="mt-3 font-serif text-5xl font-semibold">
            Nakalimutan ang password?
          </h1>

          <p className="mt-4 leading-7 text-[#173d32]/60">
            Ilagay ang email address ng iyong LIKHA
            account. Padadalhan ka namin ng secure link
            para gumawa ng bagong password.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@email.com"
                className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-4 outline-none focus:border-[#b76449]"
              />
            </div>

            {message && (
              <p className="rounded-lg bg-green-50 px-4 py-3 text-sm leading-6 text-green-800">
                {message}
              </p>
            )}

            {errorMessage && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#b76449] px-6 py-4 font-semibold text-white transition hover:bg-[#9f503c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Sending..."
                : "Send password reset link "}
            </button>
          </form>

          <Link
            href="/login"
            className="mt-6 block text-center text-sm font-semibold text-[#b76449]"
          >
             Bumalik sa sign in
          </Link>
        </div>
      </div>
    </main>
  );
}