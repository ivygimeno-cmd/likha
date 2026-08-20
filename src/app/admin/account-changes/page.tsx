import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


async function rejectRequest(formData: FormData) {
  "use server";

  const requestId = String(formData.get("requestId") ?? "");
  const adminNotes = String(formData.get("adminNotes") ?? "");

  if (!requestId) {
    throw new Error("Missing request ID.");
  }

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

  if (adminError || isAdmin !== true) {
    notFound();
  }

  const { error } = await supabase
    .from("account_change_requests")
    .update({
      status: "rejected",
      admin_notes: adminNotes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    throw new Error(
      `Hindi ma-reject ang request: ${error.message}`,
    );
  }

  redirect("/admin/account-changes");
}

type AccountChangeRequest = {
  id: string;
  user_id: string;
  request_type: "email" | "name";
  current_value: string | null;
  requested_value: string;
  reason: string;
  id_document_path: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
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

type AdminUser = {
  user_id: string;
  email: string | null;
  account_name: string;
};

export default async function AccountChangesPage() {
 async function approveEmailRequest(formData: FormData) {
  "use server";

  const requestId = String(
    formData.get("requestId") ?? "",
  );

  if (!requestId) {
    throw new Error("Missing request ID.");
  }

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
    data: request,
    error: requestError,
  } = await supabase
    .from("account_change_requests")
    .select(
      "id, user_id, request_type, requested_value, status",
    )
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    throw new Error(
      `Hindi makuha ang request: ${
        requestError?.message ?? "Request not found."
      }`,
    );
  }

  if (request.status !== "pending") {
    throw new Error(
      "This request has already been reviewed.",
    );
  }

  if (request.request_type !== "email") {
    throw new Error(
      "This approval action is only for email change requests.",
    );
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("account_change_requests")
    .update({
      status: "awaiting_verification",
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", request.id)
    .eq("status", "pending");

if (updateError) {
  throw new Error(
    `Hindi ma-approve ang email request: ${updateError.message}`,
  );
}

const adminClient = createAdminClient();

const { error: notificationError } = await adminClient
  .from("notifications")
  .insert({
    user_id: request.user_id,
    type: "email_change_approved",
    title: "Email change approved",
    message:
      "Your email change request has been approved. Verify your new email address to complete the change.",
href: "/settings/email?verify=1#email-verification",
  });

if (notificationError) {
  throw new Error(
    `Approved ang request pero hindi makagawa ng notification: ${notificationError.message}`,
  );
}

redirect("/admin/account-changes");
}
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
    data: requestsData,
    error: requestsError,
  } = await supabase
    .from("account_change_requests")
    .select(
      `
        id,
        user_id,
        request_type,
        current_value,
        requested_value,
        reason,
        id_document_path,
        status,
        admin_notes,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at
      `,
    )
    .eq("status", "pending");

  if (requestsError) {
    throw new Error(
      `Hindi makuha ang account change requests: ${requestsError.message}`,
    );
  }

  const pendingRequests =
    (requestsData ?? []) as AccountChangeRequest[];

  const requestUserIds = [
    ...new Set(
      pendingRequests.map((request) => request.user_id),
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
    data: verificationData,
    error: verificationError,
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

  if (verificationError) {
    throw new Error(
      `Hindi makuha ang identity verification status: ${verificationError.message}`,
    );
  }

  const {
    data: adminUsersData,
    error: adminUsersError,
  } = await supabase.rpc("get_admin_user_list");

  if (adminUsersError) {
    throw new Error(
      `Hindi makuha ang admin users: ${adminUsersError.message}`,
    );
  }

  const adminUsers =
    (adminUsersData ?? []) as AdminUser[];

  const requesterProfiles = new Map(
    (
      (requesterProfilesData ?? []) as RequesterProfile[]
    ).map((profile) => [profile.id, profile]),
  );

  const requesterVerifications = new Map(
    (
      (verificationData ?? []) as IdentityVerification[]
    ).map((verification) => [
      verification.user_id,
      verification,
    ]),
  );

  const sortedRequests = [...pendingRequests].sort(
    (a, b) => {
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
    },
  );

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
          <Link
            href="/admin"
            className="font-serif text-3xl font-semibold tracking-[0.2em]"
          >
            LIKHA
          </Link>

          <Link
            href="/admin"
            className="text-sm font-semibold text-[#b76449]"
          >
            ← Admin Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
            Admin Inbox
          </p>

          <h1 className="mt-2 font-serif text-4xl font-semibold">
            Account Changes
          </h1>

          <p className="mt-3 text-[#173d32]/60">
            Review pending email and verified-name change
            requests.
          </p>

          <p className="mt-2 text-sm text-[#173d32]/45">
            VIP requests are shown first. Within each tier,
            oldest requests appear first.
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
          <div className="flex items-center justify-between border-b border-[#173d32]/10 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#173d32]/45">
                Pending Requests
              </p>

              <p className="mt-1 text-sm text-[#173d32]/50">
                {sortedRequests.length}{" "}
                {sortedRequests.length === 1
                  ? "request"
                  : "requests"}
              </p>
            </div>
          </div>

          {sortedRequests.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm text-[#173d32]/45">
                No pending account change requests.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#173d32]/10">
              {sortedRequests.map((request) => {
                const requester = adminUsers.find(
                  (account) =>
                    account.user_id === request.user_id,
                );

                const requesterProfile =
                  requesterProfiles.get(request.user_id);

                const verification =
                  requesterVerifications.get(
                    request.user_id,
                  );

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
                    className="group"
                  >
                    <summary className="cursor-pointer list-none px-6 py-5 transition hover:bg-[#173d32]/[0.025]">
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {requester?.account_name ??
                                "LIKHA user"}
                            </p>

                            {showAdminBadge && (
                              <span className="rounded-full bg-[#173d32] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                                LIKHA ADMIN
                              </span>
                            )}

                            {isVip && (
                              <span className="rounded-full bg-[#d6a63d] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                                VIP
                              </span>
                            )}

                            {isVerified && (
                              <span className="rounded-full bg-green-100 px-2.5 py-1 text-[9px] font-semibold text-green-700">
                                Verified
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-[#173d32]/50">
                            {requester?.email ?? "No email"}
                          </p>

                          <p className="mt-2 text-xs text-[#173d32]/40">
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

                    <div className="border-t border-[#173d32]/10 bg-[#f5f0e6]/65 px-6 py-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
                            Current
                          </p>

                          <p className="mt-2 break-words text-sm">
                            {request.current_value ??
                              "Not provided"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
                            Requested
                          </p>

                          <p className="mt-2 break-words text-sm font-semibold text-[#b76449]">
                            {request.requested_value}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
                          Reason
                        </p>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#173d32]/65">
                          {request.reason}
                        </p>
                      </div>

                      {request.id_document_path && (
                        <div className="mt-5">
                          <span className="rounded-full bg-[#173d32]/5 px-3 py-1.5 text-xs font-semibold text-[#173d32]/60">
                            ID document attached
                          </span>
                        </div>
                      )}
<div className="mt-7">
  <label className="block">
    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
      Admin Notes
    </span>

    <textarea
      name="adminNotes"
      rows={3}
      placeholder="Optional note for this request..."
      className="mt-2 w-full rounded-xl border border-[#173d32]/15 bg-[#fbf8f1] px-4 py-3 text-sm outline-none transition focus:border-[#173d32]/40"
      form={`reject-form-${request.id}`}
    />
  </label>

  <div className="mt-4 flex flex-wrap gap-3">
    <form
      id={`reject-form-${request.id}`}
      action={rejectRequest}
    >
      <input
        type="hidden"
        name="requestId"
        value={request.id}
      />

      <button
        type="submit"
        className="rounded-xl border border-[#b76449] px-5 py-2.5 text-sm font-semibold text-[#b76449] transition hover:bg-[#b76449] hover:text-white"
      >
        Reject
      </button>
    </form>

    {request.request_type === "email" ? (
      <form action={approveEmailRequest}>
        <input
          type="hidden"
          name="requestId"
          value={request.id}
        />

        <button
          type="submit"
          className="rounded-xl bg-[#173d32] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Approve
        </button>
      </form>
    ) : (
      <button
        type="button"
        disabled
        className="rounded-xl bg-[#173d32] px-5 py-2.5 text-sm font-semibold text-white opacity-50"
      >
        Approve
      </button>
    )}
  </div>
</div>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}