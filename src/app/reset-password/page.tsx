"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [recoveryReady, setRecoveryReady] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let mounted = true;

async function checkSession() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!mounted) {
    return;
  }

  if (error || !user) {
    setRecoveryReady(false);
    return;
  }

  setRecoveryReady(true);
}

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "PASSWORD_RECOVERY" ||
          (event === "SIGNED_IN" && session)
        ) {
          setRecoveryReady(true);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    if (!recoveryReady) {
      setErrorMessage(
        "Invalid or expired password recovery session. Humingi ulit ng bagong reset link.",
      );
      setLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);

    const password = String(
      formData.get("password") ?? "",
    );

    const confirmPassword = String(
      formData.get("confirmPassword") ?? "",
    );

    if (password.length < 8) {
      setErrorMessage(
        "Password must be at least 8 characters.",
      );
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "Hindi magkapareho ang dalawang password.",
      );
      setLoading(false);
      return;
    }

    const {
      data,
      error,
    } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setErrorMessage(
        "Hindi na-update ang password. Humingi ulit ng bagong reset link.",
      );
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    router.replace("/login?password_reset=success");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
        <div className="w-full">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
            Account recovery
          </p>

          <h1 className="mt-3 font-serif text-5xl font-semibold">
            Gumawa ng bagong password.
          </h1>

          <p className="mt-4 leading-7 text-[#173d32]/60">
            Gumamit ng bagong password na hindi bababa
            sa 8 characters.
          </p>

          {!recoveryReady && (
            <p className="mt-6 rounded-lg bg-[#173d32]/5 px-4 py-3 text-sm text-[#173d32]/65">
              Checking your secure recovery session...
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                New password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!recoveryReady}
                className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-4 outline-none focus:border-[#b76449] disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold"
              >
                Confirm new password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!recoveryReady}
                className="w-full rounded-lg border border-[#173d32]/20 bg-[#fbf8f1] px-4 py-4 outline-none focus:border-[#b76449] disabled:opacity-50"
              />
            </div>

            {errorMessage && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !recoveryReady}
              className="w-full rounded-lg bg-[#b76449] px-6 py-4 font-semibold text-white transition hover:bg-[#9f503c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Updating..."
                : "Set new password "}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}