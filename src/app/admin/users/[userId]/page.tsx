import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";


type InvestigationData = {
  user: {
    user_id: string;
    email: string | null;
    account_name: string;
    role: string | null;
    city: string | null;
    contact_number: string | null;
    account_tier: "standard" | "vip";
    is_admin_badge: boolean;
    avatar_url: string | null;
    created_at: string;
    account_status: "active" | "suspended";
    chat_locked: boolean;
    chat_locked_at: string | null;
    warning_count: number;
    acknowledged_warning_count: number;
  };

  moderation_events: {
    id: string;
    order_id: string | null;
    violation_type: string;
    platform: string | null;
    attempted_message: string;
    review_status: string;
    created_at: string;
  }[];

  messages: {
    id: string;
    order_id: string;
    sender_id: string;
    message: string;
    created_at: string;
  }[];
};

type AdminSessionRow = {
  session_id: string;
  created_at: string;
  updated_at: string;
  refreshed_at: string | null;
  user_agent: string | null;
  ip: string | null;
};

function getSessionDevice(userAgent: string | null) {
  if (!userAgent) {
    return "Unknown device";
  }

  const ua = userAgent.toLowerCase();

  let browser = "Browser";
  let platform = "Unknown device";

  if (ua.includes("edg/")) {
    browser = "Microsoft Edge";
  } else if (
    ua.includes("chrome/") &&
    !ua.includes("edg/")
  ) {
    browser = "Chrome";
  } else if (ua.includes("firefox/")) {
    browser = "Firefox";
  } else if (
    ua.includes("safari/") &&
    !ua.includes("chrome/")
  ) {
    browser = "Safari";
  }

  if (ua.includes("windows")) {
    platform = "Windows";
  } else if (ua.includes("iphone")) {
    platform = "iPhone";
  } else if (ua.includes("ipad")) {
    platform = "iPad";
  } else if (ua.includes("android")) {
    platform = "Android";
  } else if (
    ua.includes("mac os") ||
    ua.includes("macintosh")
  ) {
    platform = "macOS";
  } else if (ua.includes("linux")) {
    platform = "Linux";
  }

  return `${browser} on ${platform}`;
}

export default async function AdminUserInvestigationPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

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
    data: investigationData,
    error: investigationError,
  } = await supabase.rpc(
    "get_admin_user_investigation",
    {
      p_user_id: userId,
    },
  );

  if (investigationError) {
    throw new Error(
      `Hindi ma-load ang investigation: ${investigationError.message}`,
    );
  }

  if (!investigationData) {
    notFound();
  }

  const investigation =
    investigationData as InvestigationData;

  const account = investigation.user;
  const { data: identityVerification } = await supabase
  .from("identity_verifications")
  .select(
    "status, name_match_status, verified_at, verification_level",
  )
  .eq("user_id", userId)
  .maybeSingle();

const isVerified =
  identityVerification?.status === "verified" ||
  Boolean(identityVerification?.verified_at);

const accountCreatedAt = new Date(account.created_at);
const now = new Date();

let totalMonths =
  (now.getFullYear() - accountCreatedAt.getFullYear()) * 12 +
  (now.getMonth() - accountCreatedAt.getMonth());

if (now.getDate() < accountCreatedAt.getDate()) {
  totalMonths -= 1;
}

totalMonths = Math.max(0, totalMonths);

const accountAgeDays = Math.max(
  0,
  Math.floor(
    (now.getTime() - accountCreatedAt.getTime()) /
      (1000 * 60 * 60 * 24),
  ),
);

const accountAgeLabel =
  totalMonths < 1
    ? `${accountAgeDays}d old`
    : totalMonths < 12
      ? `${totalMonths}m old`
      : `${Math.floor(totalMonths / 12)}y ${
          totalMonths % 12
        }m old`;

  type AdminSupportTicket = {
  ticket_id: string;
  user_id: string;
  account_name: string;
  email: string | null;
  subject: string;
  message: string;
  status: "open" | "in_review" | "resolved" | "closed";
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const {
  data: supportTicketsData,
  error: supportTicketsError,
} = await supabase.rpc("get_admin_support_tickets");

if (supportTicketsError) {
  throw new Error(
    `Hindi ma-load ang support tickets: ${supportTicketsError.message}`,
  );
}

const supportTickets = (
  (supportTicketsData ?? []) as AdminSupportTicket[]
).filter((ticket) => ticket.user_id === userId);


const {
  data: sessionsData,
  error: sessionsError,
} = await supabase.rpc(
  "get_admin_user_sessions",
  {
    p_user_id: userId,
  },
);

if (sessionsError) {
  throw new Error(
    `Hindi ma-load ang user sessions: ${sessionsError.message}`,
  );
}

const userSessions =
  (sessionsData ?? []) as AdminSessionRow[];

  async function toggleChatLock() {
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

    const nextLockedState = !account.chat_locked;

    const { error } = await supabase.rpc(
      "admin_set_chat_lock",
      {
        p_user_id: userId,
        p_locked: nextLockedState,
      },
    );

    if (error) {
      throw new Error(
        `Hindi ma-update ang chat lock: ${error.message}`,
      );
    }

    redirect(`/admin/users/${userId}`);
  }
  async function toggleAccountLock() {
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

  const nextStatus =
    account.account_status === "suspended"
      ? "active"
      : "suspended";

  const { error } = await supabase.rpc(
    "admin_set_account_status",
    {
      p_user_id: userId,
      p_status: nextStatus,
    },
  );

  if (error) {
    throw new Error(
      `Hindi ma-update ang account status: ${error.message}`,
    );
  }

  redirect(`/admin/users/${userId}`);
}

async function updateVerifiedName(formData: FormData) {
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

  const fullName = String(
    formData.get("fullName") ?? "",
  ).trim();

  const reviewNotes = String(
    formData.get("reviewNotes") ?? "",
  ).trim();

  if (fullName.length < 2) {
    throw new Error("Invalid name");
  }

  const { error } = await supabase.rpc(
    "admin_update_verified_name",
    {
      p_user_id: userId,
      p_full_name: fullName,
      p_review_notes: reviewNotes || null,
    },
  );

  if (error) {
    throw new Error(
      `Hindi ma-update ang verified name: ${error.message}`,
    );
  }

  redirect(`/admin/users/${userId}`);
}

async function updateContactNumber(formData: FormData) {
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

  const contactNumber = String(
    formData.get("contactNumber") ?? "",
  ).trim();

  const reviewNotes = String(
    formData.get("reviewNotes") ?? "",
  ).trim();

  if (contactNumber.length < 7) {
    throw new Error("Invalid contact number");
  }

  const { error } = await supabase.rpc(
    "admin_update_contact_number",
    {
      p_user_id: userId,
      p_contact_number: contactNumber,
      p_review_notes: reviewNotes || null,
    },
  );

  if (error) {
    throw new Error(
      `Hindi ma-update ang contact number: ${error.message}`,
    );
  }

  redirect(`/admin/users/${userId}`);
}

async function updateUserEmail(formData: FormData) {
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

  const email = String(
    formData.get("email") ?? "",
  )
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    throw new Error("Invalid email");
  }

  const { error } = await supabase.rpc(
    "admin_update_user_email",
    {
      p_user_id: userId,
      p_email: email,
    },
  );

  if (error) {
    throw new Error(
      `Hindi ma-update ang email: ${error.message}`,
    );
  }

  redirect(`/admin/users/${userId}`);
}

async function revokeAllUserSessions() {
  "use server";

  const supabase = await createClient();

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
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

  if (userId === adminUser.id) {
    throw new Error(
      "You cannot revoke your own sessions from the investigation page.",
    );
  }

  const {
    data: revokedCount,
    error: revokeError,
  } = await supabase.rpc(
    "admin_revoke_user_sessions",
    {
      p_user_id: userId,
    },
  );

  if (revokeError) {
    throw new Error(
      `Hindi ma-revoke ang user sessions: ${revokeError.message}`,
    );
  }

  const { error: notificationError } =
    await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: "security_sessions_revoked",
        title: "Signed out for security",
        message:
          "LIHKA signed out your active sessions for account security. Please sign in again to continue.",
        href: "/login",
      });

  if (notificationError) {
    console.error(
      "Session revoke notification error:",
      notificationError.message,
    );
  }

  console.log(
    `Revoked ${revokedCount ?? 0} session(s) for user ${userId}`,
  );

  redirect(`/admin/users/${userId}`);
}

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
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

<div className="mx-auto grid max-w-7xl gap-5 px-6 py-8 lg:grid-cols-[30%_minmax(0,70%)] lg:px-10">

{/* ACCOUNT CARD */}
<section className="rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-6 lg:col-span-2">
  <div className="grid gap-7 lg:grid-cols-[220px_220px_minmax(160px,1fr)_300px] lg:items-start">
    {/* USER INFO */}
 <div>
  <div className="flex items-start gap-4">
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#173d32] bg-cover bg-center font-serif text-2xl font-semibold text-white"
        style={
          account.avatar_url
            ? {
                backgroundImage: `url(${account.avatar_url})`,
              }
            : undefined
        }
      >
        {!account.avatar_url &&
          account.account_name.charAt(0).toUpperCase()}
      </div>

<div className="flex flex-col items-start gap-2">
  <span className="rounded-full border border-[#173d32]/15 bg-[#f5f0e6] px-3 py-1 text-xs font-semibold text-[#173d32]/70">
    {accountAgeLabel}
  </span>

  <div className="flex flex-wrap gap-2">
    {isVerified ? (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        ✓ Verified
      </span>
    ) : (
      <span className="rounded-full bg-[#173d32]/10 px-3 py-1 text-xs font-semibold text-[#173d32]/55">
        Unverified
      </span>
    )}

{account.account_tier === "vip" ? (
  <span className="rounded-full bg-[#d9c6a5]/35 px-3 py-1 text-xs font-semibold text-[#7a5a22]">
    VIP
  </span>
) : (
  <span className="rounded-full bg-[#173d32]/10 px-3 py-1 text-xs font-semibold text-[#173d32]/55">
    No VIP
  </span>
)}

{account.is_admin_badge && (
  <span className="rounded-full bg-[#173d32] px-3 py-1 text-xs font-semibold text-white">
    ADMIN
  </span>
)}
  </div>
</div>
</div>

      <div className="min-w-0">
        <h1 className="truncate font-serif text-3xl font-semibold">
          {account.account_name}
        </h1>

        <p className="mt-1 break-all text-sm text-[#173d32]/55">
          {account.email ?? "No email"}
        </p>

        <p className="mt-2 text-xs text-[#173d32]/45">
          {account.role ?? "No role"}
          {account.city ? ` · ${account.city}` : ""}
        </p>

        <div className="mt-4">
          <p className="text-xs text-[#173d32]/45">
            Contact number
          </p>

          <p className="mt-1 text-sm font-semibold">
            {account.contact_number ?? "No contact number"}
          </p>
        </div>


      </div>
    </div>

    {/* EDIT CONTROLS */}
    <div className="space-y-3">
      <details className="rounded-xl border border-[#173d32]/10 bg-[#f5f0e6] p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-[#b76449]">
          Edit verified name
        </summary>

        <form
          action={updateVerifiedName}
          className="mt-4 space-y-3"
        >
          <div>
            <label
              htmlFor="verifiedFullName"
              className="mb-1.5 block text-xs font-semibold text-[#173d32]/55"
            >
              Correct legal name
            </label>

            <input
              id="verifiedFullName"
              type="text"
              name="fullName"
              required
              minLength={2}
              defaultValue={account.account_name}
              className="w-full rounded-lg border border-[#173d32]/20 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#b76449]"
            />
          </div>

          <div>
            <label
              htmlFor="nameReviewNotes"
              className="mb-1.5 block text-xs font-semibold text-[#173d32]/55"
            >
              Reason for correction
            </label>

            <textarea
              id="nameReviewNotes"
              name="reviewNotes"
              rows={3}
              required
              minLength={3}
              placeholder="Corrected to match submitted valid ID."
              className="w-full resize-none rounded-lg border border-[#173d32]/20 bg-white px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-[#b76449]"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#173d32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245646]"
          >
            Save name correction
          </button>
        </form>
      </details>

      <details className="rounded-xl border border-[#173d32]/10 bg-[#f5f0e6] p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-[#b76449]">
          Edit email
        </summary>

        <form
          action={updateUserEmail}
          className="mt-4 space-y-3"
        >
          <div>
            <label
              htmlFor="userEmail"
              className="mb-1.5 block text-xs font-semibold text-[#173d32]/55"
            >
              Correct email address
            </label>

            <input
              id="userEmail"
              type="email"
              name="email"
              required
              defaultValue={account.email ?? ""}
              placeholder="name@email.com"
              className="w-full rounded-lg border border-[#173d32]/20 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#b76449]"
            />
          </div>

          <p className="text-xs leading-5 text-[#173d32]/45">
            Use this only for Support-verified email corrections.
          </p>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#173d32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245646]"
          >
            Save email correction
          </button>
        </form>
      </details>

      <details className="rounded-xl border border-[#173d32]/10 bg-[#f5f0e6] p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-[#b76449]">
          Edit contact number
        </summary>

        <form
          action={updateContactNumber}
          className="mt-4 space-y-3"
        >
          <div>
            <label
              htmlFor="contactNumber"
              className="mb-1.5 block text-xs font-semibold text-[#173d32]/55"
            >
              Correct contact number
            </label>

            <input
              id="contactNumber"
              type="tel"
              name="contactNumber"
              required
              defaultValue={account.contact_number ?? ""}
              placeholder="09171234567"
              className="w-full rounded-lg border border-[#173d32]/20 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#b76449]"
            />
          </div>

          <div>
            <label
              htmlFor="contactReviewNotes"
              className="mb-1.5 block text-xs font-semibold text-[#173d32]/55"
            >
              Reason for correction
            </label>

            <textarea
              id="contactReviewNotes"
              name="reviewNotes"
              rows={3}
              required
              minLength={3}
              placeholder="Updated after user verification."
              className="w-full resize-none rounded-lg border border-[#173d32]/20 bg-white px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-[#b76449]"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#173d32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245646]"
          >
            Save contact number
          </button>
        </form>
      </details>
    </div>

{/* SECURITY ACTIVITY */}
<div className="hidden min-w-0 lg:block">
  <div className="overflow-hidden rounded-xl border border-[#173d32]/10 bg-[#f5f0e6]">
    <div className="border-b border-[#173d32]/10 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b76449]">
            Security
          </p>

          <p className="mt-1 text-sm font-semibold">
            Active sessions
          </p>
        </div>

        <span className="rounded-full bg-[#173d32] px-2.5 py-1 text-[10px] font-semibold text-white">
          {userSessions.length}
        </span>
      </div>
    </div>

    {userSessions.length === 0 ? (
      <div className="px-4 py-5">
        <p className="text-xs leading-5 text-[#173d32]/45">
          No active sessions found.
        </p>
      </div>
    ) : (
      <div className="max-h-[210px] overflow-y-auto">
        {userSessions.map((session) => {
          const lastActive =
            session.refreshed_at ??
            session.updated_at;

          return (
            <div
              key={session.session_id}
              className="border-b border-[#173d32]/10 px-4 py-3 last:border-b-0"
            >
              <p className="truncate text-xs font-semibold">
                {getSessionDevice(
                  session.user_agent,
                )}
              </p>

              <div className="mt-2 space-y-1">
                <p className="text-[11px] text-[#173d32]/50">
                  IP{" "}
                  <span className="font-mono text-[#173d32]/75">
                    {session.ip ?? "Unavailable"}
                  </span>
                </p>

                <p className="text-[11px] text-[#173d32]/50">
                  Last active{" "}
                  <span className="text-[#173d32]/75">
                    {new Date(
                      lastActive,
                    ).toLocaleString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </p>

                <p className="text-[11px] text-[#173d32]/50">
                  Signed in{" "}
                  <span className="text-[#173d32]/75">
                    {new Date(
                      session.created_at,
                    ).toLocaleString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {userSessions.length > 0 && (
  <div className="border-t border-[#173d32]/10 p-4">
    <form action={revokeAllUserSessions}>
      <button
        type="submit"
        disabled={account.is_admin_badge}
        title={
          account.is_admin_badge
            ? "LIKHA Admin sessions cannot be revoked here."
            : "Sign this user out of all active sessions."
        }
        className={`w-full rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
          account.is_admin_badge
            ? "cursor-not-allowed bg-[#173d32]/5 text-[#173d32]/30"
            : "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
        }`}
      >
        {account.is_admin_badge
          ? "Admin Sessions Protected"
          : "Sign out all devices"}
      </button>
    </form>
  </div>
)}


  </div>
</div>

    {/* STATUS + MODERATION CONTROLS */}
    <div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
        <div>
          <p className="text-xs text-[#173d32]/45">
            Account
          </p>

          <p
            className={`mt-1 font-semibold ${
              account.account_status === "suspended"
                ? "text-red-700"
                : "text-[#173d32]"
            }`}
          >
            {account.account_status === "suspended"
              ? "Suspended"
              : "Active"}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#173d32]/45">
            Chat
          </p>

          <p
            className={`mt-1 font-semibold ${
              account.chat_locked
                ? "text-red-700"
                : "text-green-700"
            }`}
          >
            {account.chat_locked ? "Locked" : "Active"}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#173d32]/45">
            Warnings
          </p>

          <p className="mt-1 font-semibold">
            {account.warning_count}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#173d32]/45">
            Acknowledged
          </p>

          <p className="mt-1 font-semibold">
            {account.acknowledged_warning_count}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
<form action={toggleAccountLock}>
  <button
    type="submit"
    disabled={account.is_admin_badge}
    title={
      account.is_admin_badge
        ? "LIKHA Admin accounts cannot be locked."
        : undefined
    }
    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
      account.is_admin_badge
        ? "cursor-not-allowed border border-[#173d32]/10 bg-[#173d32]/5 text-[#173d32]/35"
        : account.account_status === "suspended"
          ? "bg-[#173d32] text-white hover:bg-[#245646]"
          : "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
    }`}
  >
    {account.is_admin_badge
      ? "Admin Account Protected"
      : account.account_status === "suspended"
        ? "Unlock Account"
        : "Lock Account"}
  </button>
</form>

  <form action={toggleChatLock}>
  <button
    type="submit"
    disabled={account.is_admin_badge}
    title={
      account.is_admin_badge
        ? "LIKHA Admin messaging cannot be locked."
        : undefined
    }
    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
      account.is_admin_badge
        ? "cursor-not-allowed border border-[#173d32]/10 bg-[#173d32]/5 text-[#173d32]/35"
        : account.chat_locked
          ? "bg-[#173d32] text-white hover:bg-[#245646]"
          : "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
    }`}
  >
    {account.is_admin_badge
      ? "Admin Messaging Protected"
      : account.chat_locked
        ? "Unlock Messaging"
        : "Lock Messaging"}
  </button>
</form>
      </div>
    </div>
  </div>
</section>

  {/* LEFT COLUMN */}
  <aside className="space-y-5">

    {/* BLOCKED CHATS / MODERATION EVENTS */}
    <section className="overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
      <div className="flex items-center justify-between border-b border-[#173d32]/10 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b76449]">
            Moderation
          </p>

          <h2 className="mt-1 font-serif text-2xl font-semibold">
            Blocked Chats
          </h2>
        </div>

        <span className="rounded-full bg-[#b76449] px-3 py-1 text-xs font-semibold text-white">
          {investigation.moderation_events.length}
        </span>
      </div>

      <div className="max-h-[430px] overflow-y-auto">
        {investigation.moderation_events.length === 0 ? (
          <div className="p-6">
            <p className="text-sm text-[#173d32]/55">
              No moderation violations recorded.
            </p>
          </div>
        ) : (
          investigation.moderation_events.map(
            (event, index) => (
              <article
                key={event.id}
                className="border-b border-[#173d32]/10 p-5 last:border-b-0"
              >
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b76449] text-xs font-semibold text-white">
                    {investigation.moderation_events.length -
                      index}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        {event.violation_type
                          .replaceAll("_", " ")
                          .replace(/\b\w/g, (letter) =>
                            letter.toUpperCase(),
                          )}
                      </p>

                      {event.platform && (
                        <span className="rounded-full bg-[#b76449]/10 px-2.5 py-1 text-[11px] font-semibold text-[#9f503c]">
                          {event.platform}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-[#173d32]/45">
                      {new Date(
                        event.created_at,
                      ).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>

                    <div className="mt-3 rounded-xl bg-[#b76449]/5 p-3">
                      <p className="line-clamp-3 text-sm leading-6 text-[#173d32]/70">
                        {event.attempted_message}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ),
          )
        )}
      </div>
    </section>
  </aside>

  {/* RIGHT COLUMN — CONVERSATION */}
  <section className="flex h-[calc(100vh-150px)] min-h-[600px] flex-col overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
    <div className="shrink-0 border-b border-[#173d32]/10 px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b76449]">
        Investigation
      </p>

      <div className="mt-1 flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl font-semibold">
          Related Conversation
        </h2>

        <span className="text-xs text-[#173d32]/45">
          Read-only
        </span>
      </div>
    </div>

    {/* THIS PART SCROLLS */}
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      {investigation.messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-center">
          <div>
            <p className="font-serif text-2xl font-semibold">
              No related messages.
            </p>

            <p className="mt-2 text-sm text-[#173d32]/50">
              Flagged order conversations will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {investigation.messages.map((message) => {
            const isTargetUser =
              message.sender_id === account.user_id;

            return (
              <div
                key={message.id}
                className={`flex ${
                  isTargetUser
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div className="max-w-[75%]">
                  <p
                    className={`mb-1 text-xs font-semibold ${
                      isTargetUser
                        ? "text-right text-[#173d32]/40"
                        : "text-[#b76449]"
                    }`}
                  >
                    {isTargetUser
                      ? account.account_name
                      : "Other participant"}
                  </p>

                  <div
                    className={`rounded-2xl px-5 py-3.5 ${
                      isTargetUser
                        ? "rounded-br-sm bg-[#173d32] text-white"
                        : "rounded-bl-sm border border-[#173d32]/10 bg-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-7">
                      {message.message}
                    </p>

                    <time
                      className={`mt-2 block text-xs ${
                        isTargetUser
                          ? "text-right text-white/45"
                          : "text-[#173d32]/40"
                      }`}
                    >
                      {new Date(
                        message.created_at,
                      ).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    <div className="shrink-0 border-t border-[#173d32]/10 bg-[#f5f0e6] px-6 py-4">
      <p className="text-sm text-[#173d32]/55">
        🔒 You are viewing this conversation as admin.
        Messages are read-only.
      </p>
    </div>
  </section>

  {/* SUPPORT TICKETS — FULL WIDTH BELOW */}
  <section className="lg:col-span-2">
    <div className="overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
      <div className="flex items-center justify-between border-b border-[#173d32]/10 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b76449]">
            Support
          </p>

          <h2 className="mt-1 font-serif text-3xl font-semibold">
            Support Tickets
          </h2>
        </div>

        <span className="rounded-full bg-[#173d32] px-3 py-1 text-xs font-semibold text-white">
          {supportTickets.length}
        </span>
      </div>

      {supportTickets.length === 0 ? (
        <div className="p-8">
          <p className="font-semibold">
            No support tickets from this user.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#efe8dc]">
              <tr>
                <th className="px-5 py-4">
                  Subject
                </th>

                <th className="px-5 py-4">
                  Status
                </th>

                <th className="px-5 py-4">
                  Submitted
                </th>

                <th className="px-5 py-4">
                  User Message
                </th>

                <th className="px-5 py-4">
                  Admin Response
                </th>

                <th className="px-5 py-4">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#173d32]/10">
              {supportTickets.map((ticket) => (
                <tr key={ticket.ticket_id}>
                  <td className="px-5 py-5 align-top font-semibold">
                    {ticket.subject}
                  </td>

                  <td className="px-5 py-5 align-top">
                    <span className="rounded-full bg-[#b76449]/10 px-3 py-1 text-xs font-semibold text-[#9f503c]">
                      {ticket.status
                        .replace("_", " ")
                        .toUpperCase()}
                    </span>
                  </td>

                  <td className="px-5 py-5 align-top text-[#173d32]/55">
                    {new Date(
                      ticket.created_at,
                    ).toLocaleString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>

                  <td className="max-w-[280px] px-5 py-5 align-top">
                    <p className="line-clamp-4 leading-6 text-[#173d32]/70">
                      {ticket.message}
                    </p>
                  </td>

                  <td className="max-w-[280px] px-5 py-5 align-top">
                    <p className="line-clamp-4 leading-6 text-[#173d32]/70">
                      {ticket.admin_response ??
                        "No response yet."}
                    </p>
                  </td>

                  <td className="px-5 py-5 align-top">
                    <Link
                      href={`/admin/support/${ticket.ticket_id}`}
                      className="inline-flex rounded-lg border border-[#173d32]/20 px-4 py-2 text-xs font-semibold transition hover:bg-[#173d32] hover:text-white"
                    >
                      Review 
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </section>
</div>
    </main>
  );
}