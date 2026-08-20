import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminUserSearch from "./admin-user-search";
export const dynamic = "force-dynamic";

type AdminSummary = {
  total_users: number | string;
  total_requests: number | string;
  total_orders: number | string;
  total_messages: number | string;
  total_credit_entries: number | string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const params = await searchParams;
  

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
    data: summaryData,
    error: summaryError,
  } = await supabase
    .rpc("get_admin_dashboard_summary")
    .single();

  if (summaryError) {
    throw new Error(
      `Hindi makuha ang admin summary: ${summaryError.message}`,
    );
  }

  const summary = summaryData as AdminSummary;

  type AdminUser = {
  user_id: string;
  email: string | null;
  contact_number: string | null;
  account_name: string;
  role: string | null;
  city: string | null;
  avatar_url: string | null;
  account_status: "active" | "suspended";
  is_admin: boolean;
  completed_orders: number | string;
  earnings: number | string;
  total_flags: number | string;
  pending_flags: number | string;
  latest_violation_type: string | null;
  latest_violation_platform: string | null;
  latest_violation_at: string | null;
  created_at: string;
};

const {
  data: adminUsersData,
  error: adminUsersError,
} = await supabase.rpc("get_admin_user_list");

if (adminUsersError) {
  throw new Error(
    `Hindi makuha ang admin user list: ${adminUsersError.message}`,
  );
}

const {
  data: contactNumbersData,
  error: contactNumbersError,
} = await supabase.rpc(
  "get_admin_user_contact_numbers",
);

if (contactNumbersError) {
  throw new Error(
    `Hindi makuha ang contact numbers: ${contactNumbersError.message}`,
  );
}

const contactNumbers = new Map(
  (
    (contactNumbersData ?? []) as {
      user_id: string;
      contact_number: string | null;
    }[]
  ).map((item) => [
    item.user_id,
    item.contact_number,
  ]),
);

const adminUsers = (
  (adminUsersData ?? []) as Omit<
    AdminUser,
    "contact_number"
  >[]
)
  .map((account) => ({
    ...account,
    contact_number:
      contactNumbers.get(account.user_id) ?? null,
  }))
  .sort((a, b) =>
    a.account_name.localeCompare(
      b.account_name,
      "en",
      {
        sensitivity: "base",
      },
    ),
  );

const searchQuery = (params.q ?? "")
  .trim()
  .toLowerCase();

const filteredAdminUsers = searchQuery
  ? adminUsers.filter((account) => {
      const accountName =
        account.account_name.toLowerCase();

      const email =
        account.email?.toLowerCase() ?? "";

      return (
        accountName.includes(searchQuery) ||
        email.includes(searchQuery)
      );
    })
  : adminUsers;

type AccountChangeRequest = {
  id: string;
  user_id: string;
  request_type: "email" | "name";
  current_value: string | null;
  requested_value: string;
  reason: string;
  id_document_path: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type RequesterProfile = {
  id: string;
  account_tier: string | null;
  is_admin_badge: boolean | null;
};

type IdentityVerification = {
  user_id: string;
  status: string | null;
  verified_at: string | null;
};

type AdminSupportRequest = {
  id: string;
  user_id: string;
  category: string;
  feedback_type: string | null;
  subject: string;
  message: string;
  status: "open" | "in_review" | "resolved" | "closed";
  created_at: string;
};

const {
  data: accountChangeRequestsData,
  error: accountChangeRequestsError,
} = await supabase
  .from("account_change_requests")
  .select(
    "id, user_id, request_type, current_value, requested_value, reason, id_document_path, status, created_at",
  )
  .eq("status", "pending");

if (accountChangeRequestsError) {
  throw new Error(
    `Hindi makuha ang account change requests: ${accountChangeRequestsError.message}`,
  );
}

const pendingAccountChanges =
  (accountChangeRequestsData ?? []) as AccountChangeRequest[];

  const requestUserIds = [
  ...new Set(
    pendingAccountChanges.map((request) => request.user_id),
  ),
];

const {
  data: requesterProfilesData,
  error: requesterProfilesError,
} =
  requestUserIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, account_tier, is_admin_badge")
        .in("id", requestUserIds)
    : {
        data: [] as RequesterProfile[],
        error: null,
      };

if (requesterProfilesError) {
  throw new Error(
    `Hindi makuha ang requester profile badges: ${requesterProfilesError.message}`,
  );
}

const {
  data: identityVerificationsData,
  error: identityVerificationsError,
} =
  requestUserIds.length > 0
    ? await supabase
        .from("identity_verifications")
        .select("user_id, status, verified_at")
        .in("user_id", requestUserIds)
    : {
        data: [] as IdentityVerification[],
        error: null,
      };

if (identityVerificationsError) {
  throw new Error(
    `Hindi makuha ang identity verification status: ${identityVerificationsError.message}`,
  );
}

const requesterProfiles = new Map(
  (
    (requesterProfilesData ?? []) as RequesterProfile[]
  ).map((profile) => [profile.id, profile]),
);

const requesterVerifications = new Map(
  (
    (identityVerificationsData ?? []) as IdentityVerification[]
  ).map((verification) => [
    verification.user_id,
    verification,
  ]),
);

const sortedPendingAccountChanges = [
  ...pendingAccountChanges,
].sort((a, b) => {
  const aProfile = requesterProfiles.get(a.user_id);
  const bProfile = requesterProfiles.get(b.user_id);

  const aVip =
    aProfile?.account_tier?.toLowerCase() === "vip";
  const bVip =
    bProfile?.account_tier?.toLowerCase() === "vip";

  if (aVip !== bVip) {
    return aVip ? -1 : 1;
  }

  return (
    new Date(a.created_at).getTime() -
    new Date(b.created_at).getTime()
  );
});


const {
  data: supportRequestsData,
  error: supportRequestsError,
} = await supabase
  .from("support_requests")
  .select(
    `
      id,
      user_id,
      category,
      feedback_type,
      subject,
      message,
      status,
      created_at
    `,
  )
  .order("created_at", {
    ascending: false,
  });

if (supportRequestsError) {
  throw new Error(
    `Hindi makuha ang support requests: ${supportRequestsError.message}`,
  );
}

const supportRequests =
  (supportRequestsData ?? []) as AdminSupportRequest[];

const newSupportRequests =
  supportRequests.filter(
    (request) => request.status === "open",
  );

const latestSupportRequests =
  supportRequests.slice(0, 8);

  type AdminRefundRequest = {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  reason: string;
  amount: number | string | null;
  status: string;
  created_at: string;
};

const {
  data: refundRequestsData,
  error: refundRequestsError,
} = await supabase
  .from("refund_requests")
  .select(
    `
      id,
      order_id,
      buyer_id,
      seller_id,
      reason,
      amount,
      status,
      created_at
    `,
  )
  .order("created_at", {
    ascending: false,
  });

if (refundRequestsError) {
  throw new Error(
    `Hindi makuha ang refund requests: ${refundRequestsError.message}`,
  );
}

const refundRequests =
  (refundRequestsData ?? []) as AdminRefundRequest[];

const activeRefundRequests =
  refundRequests.filter((refund) =>
    [
      "requested",
      "under_review",
      "approved",
    ].includes(refund.status),
  );

const latestRefundRequests =
  refundRequests.slice(0, 8);

  const statistics = [
    {
      label: "LIKHA Users",
      value: Number(summary.total_users),
    },
    {
      label: "Project Requests",
      value: Number(summary.total_requests),
    },
    {
      label: "Orders",
      value: Number(summary.total_orders),
    },
    {
      label: "Messages",
      value: Number(summary.total_messages),
    },
    {
      label: "Credit Records",
      value: Number(summary.total_credit_entries),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15 bg-[#f5f0e6]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link
            href="/"
            className="font-serif text-3xl font-semibold tracking-[0.2em]"
          >
            LIKHA
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-semibold hover:text-[#b76449]"
          >
            ← Dashboard
          </Link>
        </nav>
      </header>

<div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
          Restricted access
        </p>

        <h1 className="mt-3 font-serif text-5xl font-semibold">
        Welcome to the LIKHA Admin Dashboard, Boss Ivy!
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-[#173d32]/65">
          Platform overview para sa users, requests, orders,
          messages, at credit activity.
        </p>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statistics.map((statistic) => (
            <article
              key={statistic.label}
              className="rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-6"
            >
              <p className="text-sm font-semibold text-[#173d32]/55">
                {statistic.label}
              </p>

              <p className="mt-3 font-serif text-4xl font-semibold text-[#b76449]">
                {statistic.value.toLocaleString()}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-[#173d32]/15 bg-[#173d32] p-7 text-[#f5f0e6]">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d9c6a5]">
            Admin access confirmed
          </p>

          <h2 className="mt-3 font-serif text-3xl font-semibold">
            Secure platform controls
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-white/65">
            Susunod nating ilalagay ang user list,
            moderation reports, account suspension, at
            administrative action history.
          </p>
        </section>

        <section className="mt-12 border-y border-[#173d32]/15 py-10">
  <div>
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
      Inbox
    </p>

    <h2 className="mt-2 font-serif text-4xl font-semibold">
      Account Requests & Feedback
    </h2>

    <p className="mt-3 text-[#173d32]/60">
      Review account information changes and feedback from
      LIKHA users.
    </p>
  </div>

<div className="mt-7 grid gap-5 lg:grid-cols-3">
  {/* ACCOUNT CHANGES */}
  <section className="flex h-[190px] flex-col overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
    {/* CARD TITLE */}
    <div className="flex shrink-0 items-center justify-between px-7 pb-3 pt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#173d32]/45">
        Account Changes
      </p>

      <Link
        href="/admin/account-changes"
        className="text-sm font-semibold text-[#b76449] transition hover:opacity-70"
      >
        Tignan lahat →
      </Link>
    </div>

    {/* CARD BODY */}
    <div className="grid min-h-0 flex-1 grid-cols-[170px_minmax(0,1fr)]">
      {/* COUNT */}
      <div className="flex flex-col justify-center px-7">
        <p className="font-serif text-3xl text-[#b76449]">
          {pendingAccountChanges.length}
        </p>

        <p className="mt-2 text-sm text-[#173d32]/50">
          {pendingAccountChanges.length === 1
            ? "pending request"
            : "pending requests"}
        </p>
      </div>

      {/* REQUEST LIST */}
      <div className="min-h-0 overflow-y-auto border-l border-[#173d32]/5">
        {sortedPendingAccountChanges.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6">
            <p className="text-sm text-[#173d32]/45">
              No pending account changes.
            </p>
          </div>
        ) : (
          sortedPendingAccountChanges.map((request) => {
            const requester = adminUsers.find(
              (account) =>
                account.user_id === request.user_id,
            );

            const requesterProfile =
              requesterProfiles.get(request.user_id);

            const verification =
              requesterVerifications.get(request.user_id);

            const isVip =
              requesterProfile?.account_tier?.toLowerCase() ===
              "vip";

            const showAdminBadge =
              requesterProfile?.is_admin_badge === true;

            const isVerified =
              verification?.status === "verified" &&
              verification.verified_at !== null;

            return (
              <details
                key={request.id}
                className="group border-b border-[#173d32]/10 last:border-b-0"
              >
                {/* PREVIEW ROW */}
                <summary className="cursor-pointer list-none px-5 py-4 transition hover:bg-[#173d32]/[0.025]">
                  <div className="flex items-center justify-between gap-5">
                    {/* USER */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-[#173d32]">
                          {requester?.account_name ??
                            "LIKHA user"}
                        </p>

                        {showAdminBadge && (
                          <span className="inline-flex rounded-full bg-[#173d32] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
                            LIKHA ADMIN
                          </span>
                        )}

                        {isVip && (
                          <span className="inline-flex rounded-full bg-[#d6a63d] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
                            VIP
                          </span>
                        )}

                        {isVerified && (
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-[9px] font-semibold text-green-700">
                            Verified
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-sm text-[#173d32]/50">
                        {requester?.email ?? "No email"}
                      </p>

                      <p className="mt-1.5 text-xs text-[#173d32]/40">
                        Submitted{" "}
                        {new Date(
                          request.created_at,
                        ).toLocaleString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* REQUEST TYPE */}
                    <div className="flex shrink-0 items-center gap-4">
                      <span className="rounded-full bg-[#b76449]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#b76449]">
                        {request.request_type === "email"
                          ? "Email change"
                          : "Name change"}
                      </span>

                      <span className="text-[#173d32]/35 transition-transform group-open:rotate-90">
                        →
                      </span>
                    </div>
                  </div>
                </summary>

                {/* CLICKED / EXPANDED */}
                <div className="border-t border-[#173d32]/10 bg-[#f5f0e6]/70 px-5 py-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
                        Current
                      </p>

                      <p className="mt-1.5 break-words text-sm">
                        {request.current_value ??
                          "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
                        Requested
                      </p>

                      <p className="mt-1.5 break-words text-sm font-semibold text-[#b76449]">
                        {request.requested_value}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
                      Reason
                    </p>

                    <p className="mt-1.5 text-sm leading-6 text-[#173d32]/65">
                      {request.reason}
                    </p>
                  </div>

                  {request.id_document_path && (
                    <div className="mt-4">
                      <span className="inline-flex rounded-full bg-[#173d32]/5 px-3 py-1.5 text-[10px] font-semibold text-[#173d32]/55">
                        ID attached
                      </span>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/account-changes?request=${request.id}&action=reject`}
                      className="inline-flex items-center justify-center rounded-lg border border-[#b76449] px-4 py-2 text-xs font-semibold text-[#b76449] transition hover:bg-[#b76449] hover:text-white"
                    >
                      Reject
                    </Link>

                    <Link
                      href={`/admin/account-changes?request=${request.id}&action=approve`}
                      className="inline-flex items-center justify-center rounded-lg bg-[#173d32] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                    >
                      Approve
                    </Link>
                  </div>
                </div>
              </details>
            );
          })
        )}
      </div>
    </div>
  </section>

{/* HELP & FEEDBACK */}
<section className="flex h-[190px] flex-col overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
  <div className="flex shrink-0 items-center justify-between px-7 pb-3 pt-6">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#173d32]/45">
      Tulong at Feedback
    </p>

    <Link
      href="/admin/feedback"
      className="text-sm font-semibold text-[#b76449] transition hover:opacity-70"
    >
      Tingnan lahat →
    </Link>
  </div>

  <div className="grid min-h-0 flex-1 grid-cols-[150px_minmax(0,1fr)]">
    <div className="flex flex-col justify-center px-7">
      <p className="font-serif text-3xl text-[#b76449]">
        {newSupportRequests.length}
      </p>

      <p className="mt-2 text-sm text-[#173d32]/50">
        {newSupportRequests.length === 1
          ? "bagong request"
          : "bagong requests"}
      </p>
    </div>

    <div className="min-h-0 overflow-y-auto border-l border-[#173d32]/5">
      {latestSupportRequests.length === 0 ? (
        <div className="flex h-full items-center justify-center px-5 text-center">
          <div>
            <p className="text-sm text-[#173d32]/45">
              Wala pang help o feedback request.
            </p>

            <p className="mt-2 text-xs text-[#173d32]/35">
              Dito lalabas ang mga bagong request.
            </p>
          </div>
        </div>
      ) : (
        latestSupportRequests.map((request) => {
          const requester = adminUsers.find(
            (account) =>
              account.user_id === request.user_id,
          );

          const categoryLabel =
            request.category === "account"
              ? "Account"
              : request.category === "orders"
                ? "Mga Order"
                : request.category === "payments"
                  ? "Pagbabayad"
                  : request.category === "safety"
                    ? "Seguridad"
                    : request.category === "problem"
                      ? "Problema"
                      : "Feedback";

          return (
            <Link
              key={request.id}
              href={`/admin/feedback?request=${request.id}`}
              className="block border-b border-[#173d32]/10 px-4 py-3 transition last:border-b-0 hover:bg-[#173d32]/[0.025]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {request.subject}
                  </p>

                  <p className="mt-1 truncate text-xs text-[#173d32]/45">
                    {requester?.account_name ??
                      requester?.email ??
                      "LIKHA user"}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[#b76449]/10 px-2 py-1 text-[8px] font-semibold uppercase text-[#b76449]">
                  {categoryLabel}
                </span>
              </div>
            </Link>
          );
        })
      )}
    </div>
  </div>
</section>

{/* REFUNDS */}
<section className="flex h-[190px] flex-col overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
  <div className="flex shrink-0 items-center justify-between px-7 pb-3 pt-6">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#173d32]/45">
      Refund Requests
    </p>

    <Link
      href="/admin/refunds"
      className="text-sm font-semibold text-[#b76449] transition hover:opacity-70"
    >
      View all →
    </Link>
  </div>

  <div className="grid min-h-0 flex-1 grid-cols-[150px_minmax(0,1fr)]">
    <div className="flex flex-col justify-center px-7">
      <p className="font-serif text-3xl text-[#b76449]">
        {activeRefundRequests.length}
      </p>

      <p className="mt-2 text-sm text-[#173d32]/50">
        {activeRefundRequests.length === 1
          ? "active request"
          : "active requests"}
      </p>
    </div>

    <div className="min-h-0 overflow-y-auto border-l border-[#173d32]/5">
      {latestRefundRequests.length === 0 ? (
        <div className="flex h-full items-center justify-center px-5 text-center">
          <div>
            <p className="text-sm text-[#173d32]/45">
              No refund requests yet.
            </p>

            <p className="mt-2 text-xs text-[#173d32]/35">
              Buyer refund requests will appear here.
            </p>
          </div>
        </div>
      ) : (
        latestRefundRequests.map((refund) => {
          const buyer = adminUsers.find(
            (account) =>
              account.user_id === refund.buyer_id,
          );

          return (
            <Link
              key={refund.id}
              href={`/admin/refunds?request=${refund.id}`}
              className="block border-b border-[#173d32]/10 px-4 py-3 transition last:border-b-0 hover:bg-[#173d32]/[0.025]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {refund.reason}
                  </p>

                  <p className="mt-1 truncate text-xs text-[#173d32]/45">
                    {buyer?.account_name ??
                      buyer?.email ??
                      "LIKHA buyer"}
                  </p>

                  <p className="mt-1 text-[10px] text-[#173d32]/35">
                    ₱
                    {Number(
                      refund.amount ?? 0,
                    ).toLocaleString("en-PH")}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[#b76449]/10 px-2 py-1 text-[8px] font-semibold uppercase text-[#b76449]">
                  {refund.status.replaceAll("_", " ")}
                </span>
              </div>
            </Link>
          );
        })
      )}
       </div>
  </div>
</section>

</div>
</section>

<section className="mt-10">
  <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
        User Management
      </p>

      <h2 className="mt-2 font-serif text-4xl font-semibold">
        LIKHA Accounts
      </h2>

      <p className="mt-3 text-[#173d32]/60">
        Review accounts, earnings, at moderation activity.
      </p>
    </div>

<AdminUserSearch totalUsers={adminUsers.length} />
  </div>
  <div className="mt-7 overflow-x-auto rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
    <table className="min-w-[1100px] w-full text-left">
      <thead className="border-b border-[#173d32]/15 bg-[#efe8dc]">
        <tr>
          <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em]">
            Account
          </th>

          <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em]">
            Status
          </th>

          <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em]">
            Earnings
          </th>

          <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em]">
            Orders
          </th>

          <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em]">
            Flags
          </th>

          <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em]">
            Latest Violation
          </th>

          <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em]">
            Actions
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-[#173d32]/10">
{adminUsers.map((account) => {
          const totalFlags = Number(account.total_flags ?? 0);
          const pendingFlags = Number(account.pending_flags ?? 0);
          const completedOrders = Number(
            account.completed_orders ?? 0,
          );
          const earnings = Number(account.earnings ?? 0);

          return (
<tr
  key={account.user_id}
  data-admin-user-row
data-search-text={`${account.account_name} ${account.email ?? ""} ${account.contact_number ?? ""}`}
>
              <td className="px-5 py-5 align-top">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#173d32]/10 bg-cover bg-center font-serif font-semibold"
                    style={
                      account.avatar_url
    ? {
       backgroundImage: `url(${account.avatar_url})`,
         }
                        : undefined
                    }
                  >
                    {!account.avatar_url &&
                      account.account_name
                        .charAt(0)
                        .toUpperCase()}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        {account.account_name}
                      </p>

                      {account.is_admin && (
                        <span className="rounded-full bg-[#173d32] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Admin
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-[#173d32]/55">
                      {account.email ?? "No email"}
                    </p>

                    <p className="mt-1 text-xs text-[#173d32]/45">
                      {account.role ?? "No role"}
                      {account.city ? ` · ${account.city}` : ""}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-5 py-5 align-top">
                {account.account_status === "suspended" ? (
                  <span className="inline-flex rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
                    Suspended
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                    Active
                  </span>
                )}
              </td>

              <td className="px-5 py-5 align-top">
                <p className="font-semibold">
                  ₱{earnings.toLocaleString("en-PH")}
                </p>
              </td>

              <td className="px-5 py-5 align-top">
                <p className="font-semibold">
                  {completedOrders}
                </p>

                <p className="mt-1 text-xs text-[#173d32]/45">
                  completed
                </p>
              </td>

              <td className="px-5 py-5 align-top">
                <p className="font-semibold">
                  {totalFlags}
                </p>

                <p
                  className={`mt-1 text-xs ${
                    pendingFlags > 0
                      ? "font-semibold text-[#b76449]"
                      : "text-[#173d32]/45"
                  }`}
                >
                  {pendingFlags} pending
                </p>
              </td>

              <td className="px-5 py-5 align-top">
                {account.latest_violation_type ? (
                  <div>
                    <p className="text-sm font-semibold">
                      {account.latest_violation_type}
                    </p>

                    {account.latest_violation_platform && (
                      <p className="mt-1 text-xs text-[#b76449]">
                        {account.latest_violation_platform}
                      </p>
                    )}

                    {account.latest_violation_at && (
                      <p className="mt-1 text-xs text-[#173d32]/45">
                        {new Date(
                          account.latest_violation_at,
                        ).toLocaleString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-[#173d32]/35">
                    No violations
                  </span>
                )}
              </td>

              <td className="px-5 py-5 align-top">
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/profile/${account.user_id}`}
                    className="w-fit text-sm font-semibold text-[#b76449]"
                  >
                    View Profile →
                  </Link>

                  <Link
                    href={`/admin/users/${account.user_id}`}
                    className="w-fit text-sm font-semibold text-[#173d32]"
                  >
                    Investigate →
                  </Link>

                  {!account.is_admin && (
                    <span className="text-xs text-[#173d32]/40">
                      Suspension controls next
                    </span>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</section>
      </div>
    </main>
  );
}