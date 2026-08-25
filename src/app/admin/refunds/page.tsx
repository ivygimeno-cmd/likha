import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type RefundRequest = {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  reason: string;
  details: string | null;
  amount: number | string | null;
  status:
    | "requested"
    | "under_review"
    | "approved"
    | "rejected"
    | "refunded"
    | "cancelled";
  seller_response: string | null;
  admin_response: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type UserProfile = {
  id: string;
  full_name: string | null;
  business_name: string | null;
};

function statusLabel(status: string) {
  switch (status) {
    case "under_review":
      return "Under Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "refunded":
      return "Refunded";
    case "cancelled":
      return "Cancelled";
    default:
      return "Requested";
  }
}

export default async function AdminRefundsPage({
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
    data: refundsData,
    error: refundsError,
  } = await supabase
    .from("refund_requests")
    .select(
      `
        id,
        order_id,
        buyer_id,
        seller_id,
        reason,
        details,
        amount,
        status,
        seller_response,
        admin_response,
        reviewed_at,
        created_at
      `,
    )
    .order("created_at", {
      ascending: false,
    });

  if (refundsError) {
    throw new Error(
      `Hindi ma-load ang refund requests: ${refundsError.message}`,
    );
  }

  const refunds =
    (refundsData ?? []) as RefundRequest[];

  const userIds = [
    ...new Set(
      refunds.flatMap((refund) => [
        refund.buyer_id,
        refund.seller_id,
      ]),
    ),
  ];

  const { data: profilesData } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select(
            "id, full_name, business_name",
          )
          .in("id", userIds)
      : {
          data: [] as UserProfile[],
        };

  const profiles = new Map(
    ((profilesData ?? []) as UserProfile[]).map(
      (profile) => [
        profile.id,
        profile,
      ],
    ),
  );

  const selectedRefund =
    refunds.find(
      (refund) =>
        refund.id === params.request,
    ) ??
    refunds[0] ??
    null;

  async function updateRefund(
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
    } = await supabase.rpc(
      "is_likha_admin",
    );

    if (isAdmin !== true) {
      notFound();
    }

    const refundId = String(
      formData.get("refund_id") ?? "",
    ).trim();

    const status = String(
      formData.get("status") ?? "",
    ).trim();

    const adminResponse = String(
      formData.get("admin_response") ?? "",
    ).trim();

    const validStatuses = [
      "requested",
      "under_review",
      "approved",
      "rejected",
      "refunded",
      "cancelled",
    ];

    if (
      !refundId ||
      !validStatuses.includes(status)
    ) {
      throw new Error(
        "Invalid refund update.",
      );
    }

    const {
      data: refund,
      error: refundError,
    } = await supabase
      .from("refund_requests")
      .select(
        "id, order_id, buyer_id, seller_id, status",
      )
      .eq("id", refundId)
      .single();

    if (refundError || !refund) {
      throw new Error(
        "Refund request not found.",
      );
    }

    const { error: updateError } =
      await supabase
        .from("refund_requests")
        .update({
          status,
          admin_response:
            adminResponse || null,
          reviewed_by: adminUser.id,
          reviewed_at:
            new Date().toISOString(),
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", refundId);

    if (updateError) {
      throw new Error(
        `Hindi ma-update ang refund: ${updateError.message}`,
      );
    }

    const title =
      status === "approved"
        ? "Refund request approved"
        : status === "rejected"
          ? "Refund request rejected"
          : status === "refunded"
            ? "Refund marked as refunded"
            : "Refund request updated";

    const message =
      status === "approved"
        ? "LIKHA approved the refund request."
        : status === "rejected"
          ? "LIKHA reviewed and rejected the refund request."
          : status === "refunded"
            ? "The refund request has been marked as refunded."
            : "The refund request status has been updated.";

    const {
      error: notificationError,
    } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: refund.buyer_id,
          type: "refund_update",
          title,
          message,
          href: `/orders/${refund.order_id}`,
        },
        {
          user_id: refund.seller_id,
          type: "refund_update",
          title,
          message,
          href: `/orders/${refund.order_id}`,
        },
      ]);

    if (notificationError) {
      throw new Error(
        `Hindi ma-send ang refund notifications: ${notificationError.message}`,
      );
    }

    redirect(
      `/admin/refunds?request=${refundId}`,
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
          Admin Review
        </p>

        <h1 className="mt-3 font-serif text-5xl font-normal">
          Refund Requests
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-[#173d32]/55">
          Review refund requests from buyers,
          seller responses, and final refund
          decisions.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1]">
            <div className="border-b border-[#173d32]/10 px-5 py-4">
              <p className="text-sm font-semibold">
                Refund Requests
              </p>

              <p className="mt-1 text-xs text-[#173d32]/45">
                {refunds.length} total
              </p>
            </div>

            {refunds.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-[#173d32]/45">
                  No refund requests yet.
                </p>
              </div>
            ) : (
              <div className="max-h-[700px] overflow-y-auto">
                {refunds.map(
                  (refund) => {
                    const buyer =
                      profiles.get(
                        refund.buyer_id,
                      );

                    const buyerName =
                      buyer?.full_name ??
                      buyer?.business_name ??
                      "LIKHA buyer";

                    return (
                      <Link
                        key={refund.id}
                        href={`/admin/refunds?request=${refund.id}`}
                        className={`block border-b border-[#173d32]/10 px-5 py-4 transition ${
                          selectedRefund?.id ===
                          refund.id
                            ? "bg-[#173d32]/5"
                            : "hover:bg-[#173d32]/[0.025]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {
                                refund.reason
                              }
                            </p>

                            <p className="mt-1 truncate text-xs text-[#173d32]/45">
                              {buyerName}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-[#b76449]/10 px-2 py-1 text-[9px] font-semibold uppercase text-[#b76449]">
                            {statusLabel(
                              refund.status,
                            )}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-[#173d32]/45">
                          ₱
                          {Number(
                            refund.amount ?? 0,
                          ).toLocaleString(
                            "en-PH",
                          )}
                        </p>
                      </Link>
                    );
                  },
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
            {!selectedRefund ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-sm text-[#173d32]/45">
                  Select a refund request.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-[#173d32]/10 pb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b76449]">
                    Refund Review
                  </p>

                  <h2 className="mt-3 font-serif text-3xl font-normal">
                    {
                      selectedRefund.reason
                    }
                  </h2>

                  <p className="mt-2 text-sm text-[#173d32]/50">
                    Amount:{" "}
                    <span className="font-semibold text-[#173d32]">
                      ₱
                      {Number(
                        selectedRefund.amount ??
                          0,
                      ).toLocaleString(
                        "en-PH",
                      )}
                    </span>
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
                      Buyer Details
                    </p>

                    <p className="mt-2 text-sm leading-7">
                      {selectedRefund.details ||
                        "No additional details provided."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#173d32]/40">
                      Seller Response
                    </p>

                    <p className="mt-2 text-sm leading-7">
                      {selectedRefund.seller_response ||
                        "Seller has not responded yet."}
                    </p>
                  </div>

                  <Link
                    href={`/orders/${selectedRefund.order_id}`}
                    className="inline-flex text-sm font-semibold text-[#b76449]"
                  >
                    View Order 
                  </Link>
                </div>

                <form
                  action={updateRefund}
                  className="mt-8 space-y-6 border-t border-[#173d32]/10 pt-7"
                >
                  <input
                    type="hidden"
                    name="refund_id"
                    value={
                      selectedRefund.id
                    }
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
                        selectedRefund.status
                      }
                      className="mt-2 w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3 text-sm outline-none"
                    >
                      <option value="requested">
                        Requested
                      </option>

                      <option value="under_review">
                        Under Review
                      </option>

                      <option value="approved">
                        Approved
                      </option>

                      <option value="rejected">
                        Rejected
                      </option>

                      <option value="refunded">
                        Refunded
                      </option>

                      <option value="cancelled">
                        Cancelled
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="admin_response"
                      className="text-sm font-semibold"
                    >
                      Admin Response
                    </label>

                    <textarea
                      id="admin_response"
                      name="admin_response"
                      rows={6}
                      defaultValue={
                        selectedRefund.admin_response ??
                        ""
                      }
                      placeholder="Add review notes or an explanation for the buyer and seller."
                      className="mt-2 w-full resize-y rounded-xl border border-[#173d32]/15 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#b76449]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-[#173d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#b76449]"
                  >
                    Save Refund Decision
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