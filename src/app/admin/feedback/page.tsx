import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SupportRequest = {
  id: string;
  user_id: string;
  category: string;
  feedback_type: string | null;
  subject: string;
  message: string;
  status: "open" | "in_review" | "resolved" | "closed";
  admin_response: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type UserProfile = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  avatar_url: string | null;
};

function categoryLabel(category: string) {
  switch (category) {
    case "account":
      return "Account";
    case "orders":
      return "Mga Order";
    case "payments":
      return "Pagbabayad";
    case "safety":
      return "Seguridad";
    case "problem":
      return "Problema";
    case "feedback":
      return "Feedback";
    default:
      return category;
  }
}

function feedbackLabel(type: string | null) {
  switch (type) {
    case "suggestion":
      return "Suhestiyon";
    case "compliment":
      return "Papuri";
    case "feature_request":
      return "Feature request";
    case "general":
      return "Pangkalahatang feedback";
    default:
      return null;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "in_review":
      return "In Review";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return "Open";
  }
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    request?: string;
  }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
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
        admin_response,
        reviewed_at,
        created_at,
        updated_at
      `,
    )
    .order("created_at", {
      ascending: false,
    });

  if (requestsError) {
    throw new Error(
      `Hindi ma-load ang support requests: ${requestsError.message}`,
    );
  }

  const requests =
    (requestsData ?? []) as SupportRequest[];

  const userIds = [
    ...new Set(
      requests.map((request) => request.user_id),
    ),
  ];

  const { data: profilesData } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select(
            "id, full_name, business_name, avatar_url",
          )
          .in("id", userIds)
      : { data: [] as UserProfile[] };

  const profiles = new Map(
    ((profilesData ?? []) as UserProfile[]).map(
      (profile) => [profile.id, profile],
    ),
  );

  const selectedRequest =
    requests.find(
      (request) => request.id === params.request,
    ) ?? requests[0] ?? null;

  async function updateSupportRequest(
    formData: FormData,
  ) {
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
      error: adminError,
    } = await supabase.rpc("is_likha_admin");

    if (adminError || isAdmin !== true) {
      notFound();
    }

    const requestId = String(
      formData.get("requestId") ?? "",
    );

    const status = String(
      formData.get("status") ?? "",
    );

    const response = String(
      formData.get("response") ?? "",
    ).trim();

    const validStatuses = [
      "open",
      "in_review",
      "resolved",
      "closed",
    ];

    if (
      !requestId ||
      !validStatuses.includes(status)
    ) {
      throw new Error(
        "Invalid support request update.",
      );
    }

    const { data: existingRequest } =
      await supabase
        .from("support_requests")
        .select("user_id")
        .eq("id", requestId)
        .single();

    if (!existingRequest) {
      throw new Error(
        "Hindi makita ang support request.",
      );
    }

    const { error } = await supabase
      .from("support_requests")
      .update({
        status,
        admin_response:
          response.length > 0 ? response : null,
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      throw new Error(
        `Hindi ma-update ang support request: ${error.message}`,
      );
    }

   if (response.length > 0) {
  const { error: notificationError } =
    await supabase
      .from("notifications")
      .insert({
        user_id: existingRequest.user_id,
        type: "support_response",
        title: "May sagot ang LIKHA Support",
        message:
          "May bagong sagot ang LIKHA Support sa iyong request.",
        href: "/help",
      });

  if (notificationError) {
    throw new Error(
      `Hindi ma-send ang notification: ${notificationError.message}`,
    );
  }
}

    redirect(
      `/admin/feedback?request=${requestId}`,
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Link
            href="/admin"
            className="font-serif text-2xl tracking-[0.2em]"
          >
            LIKHA
          </Link>

          <Link
            href="/admin"
            className="text-sm font-semibold transition hover:text-[#b76449]"
          >
             Admin Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b76449]">
          Admin Inbox
        </p>

        <h1 className="mt-3 font-serif text-5xl font-normal">
          Tulong at Feedback
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-[#173d32]/55">
          Suriin at sagutin ang mga support
          request at feedback mula sa LIKHA
          users.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
            <div className="border-b border-[#173d32]/10 px-5 py-4">
              <p className="text-sm font-semibold">
                Mga Request
              </p>

              <p className="mt-1 text-xs text-[#173d32]/45">
                {requests.length} kabuuan
              </p>
            </div>

            {requests.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-[#173d32]/45">
                  Wala pang support request.
                </p>
              </div>
            ) : (
              <div className="max-h-[700px] overflow-y-auto">
                {requests.map((request) => {
                  const profile =
                    profiles.get(request.user_id);

                  const displayName =
                    profile?.full_name ??
                    profile?.business_name ??
                    "LIKHA user";

                  return (
                    <Link
                      key={request.id}
                      href={`/admin/feedback?request=${request.id}`}
                      className={`block border-b border-[#173d32]/10 px-5 py-4 transition ${
                        selectedRequest?.id ===
                        request.id
                          ? "bg-[#173d32]/5"
                          : "hover:bg-[#173d32]/[0.025]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {request.subject}
                          </p>

                          <p className="mt-1 truncate text-xs text-[#173d32]/45">
                            {displayName}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-[#b76449]/10 px-2 py-1 text-[9px] font-semibold uppercase text-[#b76449]">
                          {categoryLabel(
                            request.category,
                          )}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#173d32]/45">
                        {request.message}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-[10px] font-semibold text-[#173d32]/40">
                          {statusLabel(
                            request.status,
                          )}
                        </span>

                        <span className="text-[10px] text-[#173d32]/35">
                          {new Date(
                            request.created_at,
                          ).toLocaleString(
                            "en-PH",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
            {!selectedRequest ? (
              <div className="flex min-h-[400px] items-center justify-center text-center">
                <p className="text-sm text-[#173d32]/45">
                  Pumili ng request para makita
                  ang detalye.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-5 border-b border-[#173d32]/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b76449]">
                      {categoryLabel(
                        selectedRequest.category,
                      )}
                    </p>

                    <h2 className="mt-3 font-serif text-3xl font-normal">
                      {selectedRequest.subject}
                    </h2>

                    {selectedRequest.feedback_type && (
                      <p className="mt-2 text-sm text-[#173d32]/50">
                        Uri:{" "}
                        {feedbackLabel(
                          selectedRequest.feedback_type,
                        )}
                      </p>
                    )}
                  </div>

                  <span className="w-fit rounded-full bg-[#173d32]/5 px-3 py-1.5 text-xs font-semibold">
                    {statusLabel(
                      selectedRequest.status,
                    )}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
                    Mensahe ng user
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                    {selectedRequest.message}
                  </p>
                </div>

                <form
                  action={updateSupportRequest}
                  className="mt-8 space-y-6 border-t border-[#173d32]/10 pt-7"
                >
                  <input
                    type="hidden"
                    name="requestId"
                    value={selectedRequest.id}
                  />

                  <div>
                    <label
                      htmlFor="status"
                      className="text-sm font-semibold"
                    >
                      Status
                    </label>

                    <select
                      id="status"
                      name="status"
                      defaultValue={
                        selectedRequest.status
                      }
                      className="mt-2 w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3 text-sm outline-none"
                    >
                    <option value="open">Open</option>
<option value="in_review">In Review</option>
<option value="resolved">Resolved</option>
<option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="response"
                      className="text-sm font-semibold"
                    >
                      Sagot ng LIKHA Support
                    </label>

                    <textarea
                      id="response"
                      name="response"
                      rows={7}
                      defaultValue={
                        selectedRequest.admin_response ??
                        ""
                      }
                      placeholder="Ilagay ang sagot para sa user..."
                      className="mt-2 w-full resize-y rounded-xl border border-[#173d32]/15 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#b76449]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-[#173d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#b76449]"
                  >
                    I-save ang update
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}