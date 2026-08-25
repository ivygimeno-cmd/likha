"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const currentPassword = String(
      formData.get("currentPassword") ?? "",
    );

    const newPassword = String(
      formData.get("newPassword") ?? "",
    );

    const confirmPassword = String(
      formData.get("confirmPassword") ?? "",
    );

    if (!currentPassword) {
      setErrorMessage(
        "Please enter your current password.",
      );
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(
        "New password must be at least 8 characters.",
      );
      setLoading(false);
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage(
        "Your new password must be different from your current password.",
      );
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        "New password and confirmation do not match.",
      );
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      router.refresh();
      return;
    }

    const {
      data,
      error,
    } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    });

    if (error) {
      const message = error.message.toLowerCase();

      if (
        message.includes("current password") ||
        message.includes("password is incorrect") ||
        message.includes("invalid credentials")
      ) {
        setErrorMessage(
          "Your current password is incorrect.",
        );
      } else {
        setErrorMessage(error.message);
      }

      setLoading(false);
      return;
    }

    if (!data.user) {
      setErrorMessage(
        "Password was not updated. Please try again.",
      );
      setLoading(false);
      return;
    }
try {
  await fetch("/api/account/password-changed", {
    method: "POST",
  });
} catch (notificationError) {
  console.error(
    "Password notification error:",
    notificationError,
  );
}
    /*
     * Global sign out:
     * user must sign in again using the new password.
     */
    const { error: signOutError } =
      await supabase.auth.signOut({
        scope: "global",
      });

    if (signOutError) {
      setErrorMessage(
        "Password was changed, but LIKHA could not sign out all sessions. Please sign out manually.",
      );
      setLoading(false);
      return;
    }

    router.replace(
      "/login?password_changed=success",
    );
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/10 px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/settings"
            className="font-serif text-3xl tracking-[0.22em]"
          >
            LIKHA
          </Link>

          <Link
            href="/settings"
            className="text-sm font-medium transition hover:text-[#b76449]"
          >
             Settings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-14 sm:px-10 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b76449]">
          Password & Security
        </p>

        <h1 className="mt-4 font-serif text-5xl font-normal">
          Change password
        </h1>

        <p className="mt-5 max-w-2xl leading-7 text-[#173d32]/55">
          Enter your current password, then choose a new
          password for your LIKHA account. After the
          password is changed, you will be signed out and
          asked to sign in again.
        </p>

        <section className="mt-10 rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="currentPassword"
                className="mb-2 block text-sm font-medium"
              >
                Current password
              </label>

              <div className="relative">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={
                    showCurrentPassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  className="w-full rounded-xl border border-[#173d32]/15 bg-white py-3.5 pl-4 pr-16 outline-none transition focus:border-[#b76449]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(
                      (current) => !current,
                    )
                  }
                  className="absolute inset-y-0 right-0 flex w-16 items-center justify-center text-xs font-semibold text-[#173d32]/45 transition hover:text-[#173d32]"
                >
                  {showCurrentPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
            </div>

            <div className="border-t border-[#173d32]/10 pt-6">
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium"
              >
                New password
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-[#173d32]/15 bg-white py-3.5 pl-4 pr-16 outline-none transition focus:border-[#b76449]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      (current) => !current,
                    )
                  }
                  className="absolute inset-y-0 right-0 flex w-16 items-center justify-center text-xs font-semibold text-[#173d32]/45 transition hover:text-[#173d32]"
                >
                  {showNewPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>

              <p className="mt-2 text-xs leading-5 text-[#173d32]/40">
                Use at least 8 characters. Avoid using a
                password you already use on another account.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium"
              >
                Confirm new password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Enter the new password again"
                  className="w-full rounded-xl border border-[#173d32]/15 bg-white py-3.5 pl-4 pr-16 outline-none transition focus:border-[#b76449]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current,
                    )
                  }
                  className="absolute inset-y-0 right-0 flex w-16 items-center justify-center text-xs font-semibold text-[#173d32]/45 transition hover:text-[#173d32]"
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="border-t border-[#173d32]/10 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-[#173d32] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#245646] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Changing password..."
                  : "Change password "}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}