"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SessionRow = {
  session_id: string;
  created_at: string;
  updated_at: string;
  refreshed_at: string | null;
  user_agent: string | null;
  ip: string | null;
  is_current: boolean;
};

type CurrentLocation = {
  city: string | null;
  region: string | null;
  country: string | null;
};

export default function SessionsPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [sessions, setSessions] = useState<
    SessionRow[]
  >([]);

  const [
  currentLocation,
  setCurrentLocation,
] = useState<CurrentLocation | null>(null);


  const [loading, setLoading] =
    useState(true);

  const [signingOutOthers, setSigningOutOthers] =
    useState(false);

  const [signingOutAll, setSigningOutAll] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
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

    const {
      data,
      error,
    } = await supabase.rpc(
      "get_my_sessions",
    );

try {
  const locationResponse = await fetch(
    "/api/account/current-location",
    {
      cache: "no-store",
    },
  );

  if (locationResponse.ok) {
    const locationData =
      (await locationResponse.json()) as CurrentLocation;

    setCurrentLocation(locationData);
  }
} catch {
  setCurrentLocation(null);
}


    if (error) {
      setErrorMessage(
        `Hindi makuha ang sessions: ${error.message}`,
      );

      setLoading(false);
      return;
    }

    setSessions(
      (data ?? []) as SessionRow[],
    );



    setLoading(false);
  }

  async function handleSignOutOthers() {
    setSigningOutOthers(true);
    setErrorMessage("");

    const { error } =
      await supabase.auth.signOut({
        scope: "others",
      });

    if (error) {
      setErrorMessage(
        `Hindi ma-sign out ang ibang devices: ${error.message}`,
      );

      setSigningOutOthers(false);
      return;
    }

    await loadSessions();

    setSigningOutOthers(false);
  }

  async function handleSignOutAll() {
    const confirmed = window.confirm(
      "Sign out of LIKHA on all devices? You will need to sign in again.",
    );

    if (!confirmed) {
      return;
    }

    setSigningOutAll(true);
    setErrorMessage("");

    const { error } =
      await supabase.auth.signOut({
        scope: "global",
      });

    if (error) {
      setErrorMessage(
        `Hindi ma-sign out ang lahat ng devices: ${error.message}`,
      );

      setSigningOutAll(false);
      return;
    }

    router.replace(
      "/login?signed_out_all=1",
    );

    router.refresh();
  }

  const currentSession =
    sessions.find(
      (session) => session.is_current,
    );

  const otherSessions =
    sessions.filter(
      (session) => !session.is_current,
    );

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
          Account Access
        </p>

        <h1 className="mt-4 font-serif text-5xl font-normal">
          Your sessions
        </h1>

        <p className="mt-5 max-w-2xl leading-7 text-[#173d32]/55">
          Review devices currently signed in
          to your LIKHA account and sign out
          sessions you no longer recognize.
        </p>

        {errorMessage && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-10 rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-8">
            <p className="text-sm text-[#173d32]/50">
              Loading active sessions...
            </p>
          </div>
        ) : (
          <>
            <section className="mt-10 rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                Current device
              </p>

              {currentSession ? (
                <SessionCard
  session={currentSession}
  current 
  location={currentLocation}
/>


              ) : (
                <p className="mt-5 text-sm text-[#173d32]/50">
                  Current session could not be
                  identified.
                </p>
              )}
            </section>

            <section className="mt-6 rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                    Other devices
                  </p>

                  <h2 className="mt-3 font-serif text-3xl font-normal">
                    Active sessions
                  </h2>
                </div>

                <span className="rounded-full bg-[#173d32]/5 px-3 py-1.5 text-xs font-medium text-[#173d32]/55">
                  {otherSessions.length}
                </span>
              </div>

              {otherSessions.length === 0 ? (
                <div className="mt-7 border-t border-[#173d32]/10 pt-6">
                  <p className="text-sm text-[#173d32]/50">
                    No other active devices.
                  </p>
                </div>
              ) : (
                <div className="mt-7 divide-y divide-[#173d32]/10 border-t border-[#173d32]/10">
                  {otherSessions.map(
                    (session) => (
                      <SessionCard
                        key={
                          session.session_id
                        }
                        session={session}
                      />
                    ),
                  )}
                </div>
              )}

              {otherSessions.length > 0 && (
                <div className="mt-7 border-t border-[#173d32]/10 pt-6">
                  <button
                    type="button"
                    disabled={
                      signingOutOthers ||
                      signingOutAll
                    }
                    onClick={
                      handleSignOutOthers
                    }
                    className="rounded-xl border border-[#173d32] px-5 py-3 text-sm font-medium text-[#173d32] transition hover:bg-[#173d32] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {signingOutOthers
                      ? "Signing out..."
                      : "Sign out other devices"}
                  </button>
                </div>
              )}
            </section>

            <section className="mt-6 rounded-[22px] border border-[#b76449]/20 bg-[#fbf8f1] p-7 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                Security
              </p>

              <h2 className="mt-3 font-serif text-3xl font-normal">
                Sign out everywhere
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#173d32]/55">
                Sign out this device and all
                other active sessions. You will
                need to enter your email and
                password again to use LIKHA.
              </p>

              <button
                type="button"
                disabled={
                  signingOutAll ||
                  signingOutOthers
                }
                onClick={handleSignOutAll}
                className="mt-6 rounded-xl bg-[#b76449] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#9f503c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signingOutAll
                  ? "Signing out..."
                  : "Sign out all devices"}
              </button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
function SessionCard({
  session,
  current = false,
  location,
}: {
  session: SessionRow;
  current?: boolean;
  location?: CurrentLocation | null;
}) {
  const device =
    parseUserAgent(session.user_agent);

  const lastActive =
    session.refreshed_at ??
    session.updated_at;

  return (
    <div className="py-6 first:pt-5 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              {device.browser} on{" "}
              {device.platform}
            </p>

            {current && (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-green-700">
                This device
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-[#173d32]/50">
            {device.device}
          </p>

          {current && (
  <div className="mt-4">
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
      Approximate location
    </p>

    <p className="mt-1.5 text-sm">
      {formatLocation(location)}
    </p>
  </div>
)}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
            Last active
          </p>

          <p className="mt-1.5 text-sm">
            {formatDate(lastActive)}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
            Signed in
          </p>

          <p className="mt-1.5 text-sm">
            {formatDate(
              session.created_at,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "Unavailable";
  }

  return new Date(value).toLocaleString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function parseUserAgent(
  userAgent: string | null,
) {
  if (!userAgent) {
    return {
      browser: "Unknown browser",
      platform: "Unknown platform",
      device: "Unknown device",
    };
  }

  const ua = userAgent.toLowerCase();

  let browser = "Browser";

  if (
    ua.includes("edg/")
  ) {
    browser = "Microsoft Edge";
  } else if (
    ua.includes("chrome/") &&
    !ua.includes("edg/")
  ) {
    browser = "Chrome";
  } else if (
    ua.includes("firefox/")
  ) {
    browser = "Firefox";
  } else if (
    ua.includes("safari/") &&
    !ua.includes("chrome/")
  ) {
    browser = "Safari";
  }

  let platform = "Unknown OS";

  if (ua.includes("windows")) {
    platform = "Windows";
  } else if (
    ua.includes("iphone")
  ) {
    platform = "iOS";
  } else if (
    ua.includes("ipad")
  ) {
    platform = "iPadOS";
  } else if (
    ua.includes("android")
  ) {
    platform = "Android";
  } else if (
    ua.includes("mac os") ||
    ua.includes("macintosh")
  ) {
    platform = "macOS";
  } else if (
    ua.includes("linux")
  ) {
    platform = "Linux";
  }

  let device = "Desktop";

  if (
    ua.includes("iphone")
  ) {
    device = "iPhone";
  } else if (
    ua.includes("ipad")
  ) {
    device = "iPad";
  } else if (
    ua.includes("android") &&
    ua.includes("mobile")
  ) {
    device = "Android phone";
  } else if (
    ua.includes("android")
  ) {
    device = "Android device";
  }

  return {
    browser,
    platform,
    device,
  };
}

function formatLocation(
  location?: CurrentLocation | null,
) {
  if (!location) {
    return "Unavailable";
  }

  const parts = [
    location.city,
    location.region,
    location.country,
  ].filter(Boolean);

  if (parts.length === 0) {
    return "Unavailable";
  }

  return parts.join(", ");
}