"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Preferences = {
  messages_email: boolean;
  orders_email: boolean;
  requests_email: boolean;
  help_feedback_email: boolean;
  announcements_email: boolean;
};

const defaultPreferences: Preferences = {
  messages_email: true,
  orders_email: true,
  requests_email: true,
  help_feedback_email: true,
  announcements_email: true,
};

export default function NotificationSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [preferences, setPreferences] =
    useState<Preferences>(defaultPreferences);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPreferences() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (userError || !user) {
        router.replace("/login");
        router.refresh();
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("notification_preferences")
        .select(
          `
            messages_email,
            orders_email,
            requests_email,
            help_feedback_email,
            announcements_email
          `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) {
        return;
      }

      if (error) {
        setErrorMessage(
          `Hindi makuha ang notification preferences: ${error.message}`,
        );
        setLoading(false);
        return;
      }

      if (data) {
        setPreferences({
          messages_email: data.messages_email,
          orders_email: data.orders_email,
          requests_email: data.requests_email,
          help_feedback_email: data.help_feedback_email,
          announcements_email: data.announcements_email,
        });
      } else {
        const { error: insertError } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: user.id,
            ...defaultPreferences,
          });

        if (insertError) {
          setErrorMessage(
            `Hindi ma-create ang notification preferences: ${insertError.message}`,
          );
        }
      }

      setLoading(false);
    }

    void loadPreferences();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  function togglePreference(
    key: keyof Preferences,
  ) {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));

    setSaved(false);
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setSaved(false);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      router.refresh();
      return;
    }

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

    if (error) {
      setErrorMessage(
        `Hindi ma-save ang notification preferences: ${error.message}`,
      );
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
          <p className="text-sm text-[#173d32]/50">
            Loading notification settings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/10 px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
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

      <div className="mx-auto max-w-4xl px-6 py-14 sm:px-10 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b76449]">
          Notifications
        </p>

        <h1 className="mt-4 font-serif text-5xl font-normal">
          Email notifications
        </h1>

        <p className="mt-5 max-w-2xl leading-7 text-[#173d32]/55">
          Choose which non-essential LIKHA emails you want to
          receive. Important account and security emails are
          always enabled.
        </p>

        <form
          onSubmit={handleSave}
          className="mt-10 space-y-6"
        >
          <section className="rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                Always on
              </p>

              <h2 className="mt-3 font-serif text-3xl font-normal">
                Account & security
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#173d32]/55">
                These notifications protect your account and
                cannot be turned off.
              </p>
            </div>

            <div className="mt-7 divide-y divide-[#173d32]/10 border-t border-[#173d32]/10">
              <LockedRow
                title="Password changes"
                description="Security alert when your password is changed."
              />

              <LockedRow
                title="Email changes"
                description="Updates about email-change requests and confirmations."
              />

              <LockedRow
                title="Verified name"
                description="Approval or rejection of verified-name requests."
              />

              <LockedRow
                title="Account security"
                description="Important account access or moderation alerts."
              />
            </div>
          </section>

          <section className="rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                Optional
              </p>

              <h2 className="mt-3 font-serif text-3xl font-normal">
                Activity updates
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#173d32]/55">
                Control the non-essential emails you receive
                from LIKHA.
              </p>
            </div>

            <div className="mt-7 divide-y divide-[#173d32]/10 border-t border-[#173d32]/10">
              <ToggleRow
                title="Messages"
                description="Email me when I receive important LIKHA messages."
                checked={preferences.messages_email}
                onChange={() =>
                  togglePreference("messages_email")
                }
              />

              <ToggleRow
                title="Order updates"
                description="Email me about order status and fulfillment updates."
                checked={preferences.orders_email}
                onChange={() =>
                  togglePreference("orders_email")
                }
              />

              <ToggleRow
                title="Request updates"
                description="Email me when my requests or proposals are updated."
                checked={preferences.requests_email}
                onChange={() =>
                  togglePreference("requests_email")
                }
              />

              <ToggleRow
                title="Help & feedback"
                description="Email me about help requests and feedback updates."
                checked={preferences.help_feedback_email}
                onChange={() =>
                  togglePreference(
                    "help_feedback_email",
                  )
                }
              />

              <ToggleRow
                title="LIKHA announcements"
                description="Occasional announcements, product updates, and news."
                checked={preferences.announcements_email}
                onChange={() =>
                  togglePreference(
                    "announcements_email",
                  )
                }
              />
            </div>
          </section>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {saved && (
            <div className="rounded-xl border border-green-700/20 bg-green-50 px-4 py-3 text-sm text-green-700">
              Notification preferences saved.
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#173d32] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#245646] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function LockedRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">
      <div>
        <p className="font-medium">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-[#173d32]/50">
          {description}
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-[#173d32]/8 px-3 py-1.5 text-xs font-medium text-[#173d32]/55">
        Always on
      </span>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">
      <div>
        <p className="font-medium">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-[#173d32]/50">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onChange}
        aria-pressed={checked}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#173d32]"
            : "bg-[#173d32]/15"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}