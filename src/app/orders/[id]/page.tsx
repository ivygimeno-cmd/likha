import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReviewForm from "./review-form";
import AuthenticatedNavbar from "@/app/components/authenticated-navbar";
import PaymentRealtimeRefresh from "./payment-realtime-refresh";
import RefundRealtimeRefresh from "./refund-realtime-refresh";
import RefundEvidenceUpload from "./refund-evidence-upload";
import PayNowButton from "./pay-now-button";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};
type OrderProject = {
  title: string;
  product_type: string;
  description: string;
  quantity: number;
  location: string;
  deadline: string;
};
export default async function OrderDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const messages = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
        id,
        request_id,
        agreed_price,
        delivery_days,
        due_date,
        status,
        created_at,
        buyer_id,
        seller_id
      `,
    )
    .eq("id", id)
    .single();

  if (!order) {
    notFound();
  }

const { data: requestData } = await supabase
  .rpc("get_order_project", {
    p_order_id: order.id,
  })
  .maybeSingle();

const request = requestData as OrderProject | null;

  const isBuyer = order.buyer_id === user.id;
  const isSeller = order.seller_id === user.id;
  const revieweeId = isBuyer ? order.seller_id : order.buyer_id;
const revieweeLabel = isBuyer ? "seller" : "buyer";

const { data: deliveryDetails } = await supabase
  .from("order_delivery_details")
  .select(`
    id,
    recipient_name,
    contact_number,
    address_line,
    barangay,
    city,
    province,
    postal_code,
    delivery_notes,
    courier,
    tracking_number,
    shipped_at,
    delivered_at
  `)
  .eq("order_id", order.id)
  .maybeSingle();

const { data: existingReview } = await supabase
  .from("reviews")
  .select("rating, comment")
  .eq("order_id", order.id)
  .eq("reviewer_id", user.id)
  .maybeSingle();

  const { data: existingRefund } = await supabase
  .from("refund_requests")
 .select(
  "id, status, reason, details, amount, seller_response, admin_response, created_at",
)
  .eq("order_id", order.id)
  .in("status", [
    "requested",
    "under_review",
    "approved",
  ])
  .maybeSingle();

  const { data: orderPayment } = await supabase
  .from("order_payments")
  .select(
    `
      id,
      status,
      amount,
      paid_at,
      payout_eligible_at,
      payout_released_at,
      refunded_at
    `,
  )
  .eq("order_id", order.id)
  .maybeSingle();

const paymentStatus =
  orderPayment?.status ?? "unpaid";

const isPaymentSecured = [
  "paid",
  "payout_pending",
  "payout_released",
].includes(paymentStatus);


  const progressSteps = [
    {
      key: "in_progress",
      title: "In progress",
      description: "Sinimulan na ng seller ang paggawa.",
    },
    {
      key: "submitted",
      title: "For buyer review",
      description: "Isinumite na ng seller para sa buyer review.",
    },
    {
      key: "completed",
      title: "Completed",
      description: "Tinanggap at kinumpleto na ng buyer ang order.",
    },
  ];

  const currentStep =
    order.status === "completed"
      ? 2
      : order.status === "submitted"
        ? 1
        : 0;

async function submitOrder() {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentOrder } = await supabase
    .from("orders")
    .select("id, seller_id")
    .eq("id", id)
    .single();

  if (
    !currentOrder ||
    currentOrder.seller_id !== user.id
  ) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "Only the seller can submit this order.",
      )}`,
    );
  }

  const { data: payment } = await supabase
    .from("order_payments")
    .select("status")
    .eq("order_id", id)
    .maybeSingle();

  const paymentSecured = [
    "paid",
    "payout_pending",
    "payout_released",
  ].includes(payment?.status ?? "");

  if (!paymentSecured) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "The buyer's payment has not been confirmed yet.",
      )}`,
    );
  }

  const { error } = await supabase.rpc(
    "submit_order",
    {
      p_order_id: id,
    },
  );

  if (error) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  redirect(`/orders/${id}?success=submitted`);
}

 async function completeOrder() {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentOrder } = await supabase
    .from("orders")
    .select("id, buyer_id, seller_id")
    .eq("id", id)
    .single();

  if (
    !currentOrder ||
    currentOrder.buyer_id !== user.id
  ) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "Only the buyer can complete this order.",
      )}`,
    );
  }

  const { data: payment } = await supabase
    .from("order_payments")
    .select("id, status")
    .eq("order_id", id)
    .maybeSingle();

  const paymentSecured = [
    "paid",
    "payout_pending",
    "payout_released",
  ].includes(payment?.status ?? "");

  if (!paymentSecured) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "The payment has not been confirmed yet.",
      )}`,
    );
  }

  const { error: completeError } =
    await supabase.rpc("complete_order", {
      p_order_id: id,
    });

  if (completeError) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        completeError.message,
      )}`,
    );
  }

const {
  error: payoutUpdateError,
} = await supabase.rpc(
  "mark_order_payout_pending",
  {
    p_order_id: id,
  },
);

if (payoutUpdateError) {
  throw new Error(
    `Hindi ma-update ang payout status: ${payoutUpdateError.message}`,
  );
}


  const {
    error: notificationError,
  } = await supabase
    .from("notifications")
    .insert([
      {
        user_id:
          currentOrder.seller_id,
        type: "payout_pending",
        title:
          "Order completed",
        message:
          "The buyer confirmed the order. Your payout is now pending.",
        href: `/orders/${id}`,
      },
      {
        user_id:
          currentOrder.buyer_id,
        type: "order_completed",
        title:
          "Order completed",
        message:
          "You confirmed the order as completed.",
        href: `/orders/${id}`,
      },
    ]);

  if (notificationError) {
    console.error(
      "Completion notification error:",
      notificationError,
    );
  }

  redirect(
    `/orders/${id}?success=completed`,
  );
}

  async function saveDeliveryDetails(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const recipientName = String(
    formData.get("recipient_name") ?? "",
  ).trim();

  const contactNumber = String(
    formData.get("contact_number") ?? "",
  ).trim();

  const addressLine = String(
    formData.get("address_line") ?? "",
  ).trim();

  const barangay = String(
    formData.get("barangay") ?? "",
  ).trim();

  const city = String(
    formData.get("city") ?? "",
  ).trim();

  const province = String(
    formData.get("province") ?? "",
  ).trim();

  const postalCode = String(
    formData.get("postal_code") ?? "",
  ).trim();

  const deliveryNotes = String(
    formData.get("delivery_notes") ?? "",
  ).trim();

  if (
    !recipientName ||
    !contactNumber ||
    !addressLine ||
    !city ||
    !province
  ) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "Please complete all required delivery details.",
      )}`,
    );
  }

  const { data: currentOrder } = await supabase
    .from("orders")
    .select("buyer_id")
    .eq("id", id)
    .single();

  if (!currentOrder || currentOrder.buyer_id !== user.id) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "Only the buyer can update delivery details.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("order_delivery_details")
    .upsert(
      {
        order_id: id,
        buyer_id: user.id,
        recipient_name: recipientName,
        contact_number: contactNumber,
        address_line: addressLine,
        barangay: barangay || null,
        city,
        province,
        postal_code: postalCode || null,
        delivery_notes: deliveryNotes || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "order_id",
      },
    );

  if (error) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  redirect(`/orders/${id}?success=delivery-saved`);
}


async function markOrderShipped(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const courier = String(
    formData.get("courier") ?? "",
  ).trim();

  const trackingNumber = String(
    formData.get("tracking_number") ?? "",
  ).trim();

  if (!courier || !trackingNumber) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "Courier and tracking number are required.",
      )}`,
    );
  }

  const { data: currentOrder } = await supabase
    .from("orders")
    .select("seller_id")
    .eq("id", id)
    .single();

  if (
    !currentOrder ||
    currentOrder.seller_id !== user.id
  ) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "Only the seller can ship this order.",
      )}`,
    );
  }

  const { data: payment } = await supabase
    .from("order_payments")
    .select("status")
    .eq("order_id", id)
    .maybeSingle();

  const paymentSecured = [
    "paid",
    "payout_pending",
    "payout_released",
  ].includes(payment?.status ?? "");

  if (!paymentSecured) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "The buyer's payment has not been confirmed yet.",
      )}`,
    );
  }

  const { error } = await supabase.rpc(
    "seller_mark_order_shipped",
    {
      p_order_id: id,
      p_courier: courier,
      p_tracking_number: trackingNumber,
    },
  );

  if (error) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  redirect(
    `/orders/${id}?success=shipped`,
  );
}

async function requestRefund(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const reason = String(
    formData.get("reason") ?? "",
  ).trim();

  const details = String(
    formData.get("details") ?? "",
  ).trim();
const evidenceFiles = formData
  .getAll("evidence")
  .filter(
    (item): item is File =>
      item instanceof File &&
      item.size > 0,
  );
  if (reason.length < 3) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "Please select or enter a refund reason.",
      )}`,
    );
  }

  const { data: currentOrder } = await supabase
    .from("orders")
    .select(
      "id, buyer_id, seller_id, agreed_price, status",
    )
    .eq("id", id)
    .single();

  if (
    !currentOrder ||
    currentOrder.buyer_id !== user.id
  ) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "Only the buyer can request a refund.",
      )}`,
    );
  }

  if (
    ![
      "in_progress",
      "submitted",
      "completed",
    ].includes(currentOrder.status)
  ) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "This order is not eligible for a refund request.",
      )}`,
    );
  }

  const { data: activeRefund } = await supabase
    .from("refund_requests")
    .select("id")
    .eq("order_id", id)
    .in("status", [
      "requested",
      "under_review",
      "approved",
    ])
    .maybeSingle();

  if (activeRefund) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "A refund request is already active for this order.",
      )}`,
    );
  }

const {
  data: refundRequest,
  error,
} = await supabase
  .from("refund_requests")
  .insert({
    order_id: currentOrder.id,
    buyer_id: currentOrder.buyer_id,
    seller_id: currentOrder.seller_id,
    reason,
    details: details || null,
    amount: currentOrder.agreed_price,
  })
  .select("id")
  .single();

  if (error) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  if (refundRequest && evidenceFiles.length > 0) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  const maxSize =
    50 * 1024 * 1024;

  for (const file of evidenceFiles) {
    if (
      !allowedTypes.includes(file.type) ||
      file.size > maxSize
    ) {
      continue;
    }

    const extension =
      file.name.split(".").pop() ??
      "bin";

    const storagePath =
      `${user.id}/${refundRequest.id}/${crypto.randomUUID()}.${extension}`;

    const arrayBuffer =
      await file.arrayBuffer();

    const { error: uploadError } =
      await supabase.storage
        .from("refund-evidence")
        .upload(
          storagePath,
          arrayBuffer,
          {
            contentType: file.type,
            upsert: false,
          },
        );

    if (uploadError) {
      throw new Error(
        `Hindi ma-upload ang evidence: ${uploadError.message}`,
      );
    }

    const {
      error: evidenceError,
    } = await supabase
      .from("refund_evidence")
      .insert({
        refund_id:
          refundRequest.id,
        uploaded_by: user.id,
        storage_path:
          storagePath,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
      });

    if (evidenceError) {
      throw new Error(
        `Hindi ma-save ang evidence record: ${evidenceError.message}`,
      );
    }
  }
}

const { error: notificationError } =
  await supabase
    .from("notifications")
    .insert({
      user_id: currentOrder.seller_id,
      type: "refund_requested",
      title: "Refund request received",
      message:
        "The buyer submitted a refund request for an order.",
      href: `/orders/${id}`,
    });

if (notificationError) {
  throw new Error(
    `Hindi ma-send ang refund notification: ${notificationError.message}`,
  );
}

  redirect(
    `/orders/${id}?success=refund-requested`,
  );
}

async function respondToRefund(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const refundId = String(
    formData.get("refund_id") ?? "",
  ).trim();

  const sellerResponse = String(
    formData.get("seller_response") ?? "",
  ).trim();

  if (!refundId || sellerResponse.length < 3) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "Please enter a response.",
      )}`,
    );
  }

  const { data: refund } = await supabase
    .from("refund_requests")
    .select(
      "id, buyer_id, seller_id, status",
    )
    .eq("id", refundId)
    .single();

  if (!refund || refund.seller_id !== user.id) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        "Only the seller can respond to this refund request.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("refund_requests")
    .update({
      seller_response: sellerResponse,
      status:
        refund.status === "requested"
          ? "under_review"
          : refund.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", refundId);

  if (error) {
    redirect(
      `/orders/${id}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  const { error: notificationError } =
    await supabase
      .from("notifications")
      .insert({
        user_id: refund.buyer_id,
        type: "refund_seller_response",
        title: "Seller responded to your refund request",
        message:
          "The seller added a response to your refund request.",
        href: `/orders/${id}`,
      });

  if (notificationError) {
    throw new Error(
      `Hindi ma-send ang buyer notification: ${notificationError.message}`,
    );
  }

  redirect(
    `/orders/${id}?success=refund-response-sent`,
  );
}

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <AuthenticatedNavbar />
      <RefundRealtimeRefresh orderId={order.id} />
      <PaymentRealtimeRefresh orderId={order.id} /> 

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {messages.success === "submitted" && (
          <div className="mb-8 border border-[#173d32]/20 bg-[#dfe9df] p-5 text-sm">
            Isinumite na ang order para sa buyer review.
          </div>
        )}

        {messages.success === "completed" && (
          <div className="mb-8 border border-[#173d32]/20 bg-[#dfe9df] p-5 text-sm">
            Completed na ang order.
          </div>
        )}

        {messages.success === "delivery-saved" && (
  <div className="mb-8 border border-[#173d32]/20 bg-[#dfe9df] p-5 text-sm">
    Na-save na ang delivery details.
  </div>
)}
{messages.success === "refund-requested" && (
  <div className="mb-8 border border-[#173d32]/20 bg-[#dfe9df] p-5 text-sm">
    Your refund request has been submitted for review.
  </div>
)}

{messages.success === "refund-response-sent" && (
  <div className="mb-8 border border-[#173d32]/20 bg-[#dfe9df] p-5 text-sm">
    Your refund response has been sent.
  </div>
)}

        {messages.error && (
          <div className="mb-8 border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {messages.error}
          </div>
        )}

        <section className="grid gap-12 border-b border-[#173d32]/15 pb-12 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
              {request?.product_type ?? "Custom project"}
            </p>

            <h1 className="mt-3 font-serif text-5xl font-semibold">
              {request?.title ?? "Likha order"}
            </h1>

            <p className="mt-5 max-w-2xl leading-8 text-[#173d32]/65">
              {request?.description ??
                "Ang detalye ng napagkasunduang custom order."}
            </p>
          </div>

          <aside className="border border-[#173d32]/20 bg-[#fbf8f1] p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
              Order summary
            </p>

            <dl className="mt-6 space-y-5">
              <div>
                <dt className="text-sm text-[#173d32]/50">
                  Agreed price
                </dt>
                <dd className="mt-1 font-serif text-3xl font-semibold">
                  ₱{Number(order.agreed_price).toLocaleString()}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-[#173d32]/50">
                  Completion time
                </dt>
                <dd className="mt-1 font-semibold">
                  {order.delivery_days} days
                </dd>
              </div>

              <div>
                <dt className="text-sm text-[#173d32]/50">Due date</dt>
                <dd className="mt-1 font-semibold">
                  {new Date(order.due_date).toLocaleDateString("en-PH", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>

              {request?.quantity && (
                <div>
                  <dt className="text-sm text-[#173d32]/50">Quantity</dt>
                  <dd className="mt-1 font-semibold">{request.quantity}</dd>
                </div>
              )}

              {request?.location && (
                <div>
                  <dt className="text-sm text-[#173d32]/50">
                    Delivery location
                  </dt>
                  <dd className="mt-1 font-semibold">{request.location}</dd>
                </div>
              )}
            </dl>

<div className="mt-7 border-t border-[#173d32]/15 pt-6">
  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#173d32]/45">
    Payment
  </p>

  {paymentStatus === "unpaid" && (
    <>
      <p className="mt-2 font-semibold text-[#b76449]">
        Payment required
      </p>

      <p className="mt-1 text-xs leading-5 text-[#173d32]/50">
        The seller should only begin production after LIKHA confirms
        the payment.
      </p>

      {isBuyer && (
        <PayNowButton orderId={order.id} />
      )}
    </>
  )}

  {paymentStatus === "pending" && (
    <div className="mt-3">
      <p className="font-semibold text-[#b76449]">
        Payment processing
      </p>

      <p className="mt-1 text-xs leading-5 text-[#173d32]/50">
        LIKHA is waiting for payment confirmation from PayMongo.
      </p>

      {isBuyer && (
        <PayNowButton orderId={order.id} />
      )}
    </div>
  )}

  {paymentStatus === "paid" && (
    <div className="mt-3 rounded-xl bg-[#dfe9df] p-4">
      <p className="font-semibold">
        ✓ Payment secured by LIKHA
      </p>

      <p className="mt-1 text-xs leading-5 text-[#173d32]/55">
        The seller may now proceed with the order.
      </p>
    </div>
  )}

  {paymentStatus === "payout_pending" && (
    <div className="mt-3 rounded-xl bg-[#dfe9df] p-4">
      <p className="font-semibold">
        Seller payout pending
      </p>

      <p className="mt-1 text-xs leading-5 text-[#173d32]/55">
        The order is complete and the seller is eligible for payout.
      </p>
    </div>
  )}

  {paymentStatus === "payout_released" && (
    <div className="mt-3 rounded-xl bg-[#dfe9df] p-4">
      <p className="font-semibold">
        ✓ Seller paid
      </p>
    </div>
  )}

  {paymentStatus === "refunded" && (
    <div className="mt-3 rounded-xl bg-[#b76449]/10 p-4">
      <p className="font-semibold text-[#b76449]">
        Refunded
      </p>
    </div>
  )}

  {paymentStatus === "failed" && (
    <div className="mt-3">
      <p className="font-semibold text-red-700">
        Payment failed
      </p>

      {isBuyer && (
        <PayNowButton orderId={order.id} />
      )}
    </div>
  )}
</div>

          </aside>
        </section>

        <section className="border-b border-[#173d32]/15 py-10">
          <div className="flex flex-col gap-6 border border-[#173d32]/20 bg-[#fbf8f1] p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
                Order messages
              </p>

              <h2 className="mt-2 font-serif text-3xl font-semibold">
                Buyer & Seller conversation
              </h2>

              <p className="mt-2 text-sm text-[#173d32]/60">
                View messages and continue this conversation in your LIKHA inbox.
              </p>
            </div>

            <Link
              href={`/messages?order=${order.id}`}
              className="inline-flex shrink-0 items-center justify-center bg-[#173d32] px-7 py-4 font-semibold text-white transition hover:bg-[#b76449]"
            >
              Open Messages 
            </Link>
          </div>
        </section>
<section className="border-b border-[#173d32]/15 py-10">
  <div className="border border-[#173d32]/20 bg-[#fbf8f1] p-7">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
      Delivery
    </p>

    <h2 className="mt-2 font-serif text-3xl font-semibold">
      Delivery Details
    </h2>

    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#173d32]/60">
      Delivery information is kept inside LIKHA and is only
      visible to the buyer and the seller assigned to this order.
    </p>

    {isBuyer && (
      <form
        action={saveDeliveryDetails}
        className="mt-7 grid gap-5 md:grid-cols-2"
      >
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold">
            Recipient name *
          </span>

          <input
            name="recipient_name"
            required
            defaultValue={
              deliveryDetails?.recipient_name ?? ""
            }
            className="mt-2 w-full border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">
            Contact number *
          </span>

          <input
            name="contact_number"
            type="tel"
            required
            defaultValue={
              deliveryDetails?.contact_number ?? ""
            }
            className="mt-2 w-full border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">
            Postal code
          </span>

          <input
            name="postal_code"
            defaultValue={
              deliveryDetails?.postal_code ?? ""
            }
            className="mt-2 w-full border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold">
            House / Unit / Street *
          </span>

          <input
            name="address_line"
            required
            defaultValue={
              deliveryDetails?.address_line ?? ""
            }
            className="mt-2 w-full border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">
            Barangay
          </span>

          <input
            name="barangay"
            defaultValue={
              deliveryDetails?.barangay ?? ""
            }
            className="mt-2 w-full border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">
            City / Municipality *
          </span>

          <input
            name="city"
            required
            defaultValue={
              deliveryDetails?.city ?? ""
            }
            className="mt-2 w-full border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">
            Province *
          </span>

          <input
            name="province"
            required
            defaultValue={
              deliveryDetails?.province ?? ""
            }
            className="mt-2 w-full border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold">
            Delivery notes
          </span>

          <textarea
            name="delivery_notes"
            rows={3}
            defaultValue={
              deliveryDetails?.delivery_notes ?? ""
            }
            placeholder="Landmark, gate instructions, etc."
            className="mt-2 w-full border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
          />
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="bg-[#173d32] px-7 py-4 font-semibold text-white transition hover:bg-[#b76449]"
          >
            {deliveryDetails
              ? "Update Delivery Details"
              : "Save Delivery Details"}
          </button>
        </div>
      </form>
    )}

    {isSeller && !deliveryDetails && (
      <div className="mt-7 border border-dashed border-[#173d32]/25 p-6">
        <p className="font-semibold">
          Waiting for delivery details
        </p>

        <p className="mt-2 text-sm text-[#173d32]/55">
          The buyer has not added their shipping information yet.
        </p>
      </div>
    )}

    {isSeller && deliveryDetails && (
      <div className="mt-7 grid gap-5 border border-[#173d32]/15 p-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-[#173d32]/45">
            Recipient
          </p>
          <p className="mt-1 font-semibold">
            {deliveryDetails.recipient_name}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-[#173d32]/45">
            Contact
          </p>
          <p className="mt-1 font-semibold">
            {deliveryDetails.contact_number}
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-[0.15em] text-[#173d32]/45">
            Delivery address
          </p>

          <p className="mt-1 font-semibold leading-7">
            {deliveryDetails.address_line}
            {deliveryDetails.barangay
              ? `, ${deliveryDetails.barangay}`
              : ""}
            , {deliveryDetails.city},{" "}
            {deliveryDetails.province}
            {deliveryDetails.postal_code
              ? ` ${deliveryDetails.postal_code}`
              : ""}
          </p>
        </div>

        {deliveryDetails.delivery_notes && (
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.15em] text-[#173d32]/45">
              Delivery notes
            </p>

            <p className="mt-1 text-sm leading-6">
              {deliveryDetails.delivery_notes}
            </p>
          </div>
        )}
      </div>
    )}
  </div>
</section>

{isSeller &&
  deliveryDetails &&
  !deliveryDetails.shipped_at &&
  !isPaymentSecured && (
    <div className="mt-7 border-t border-[#173d32]/15 pt-7">
      <div className="border border-[#173d32]/20 bg-[#fbf8f1] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b76449]">
          Shipping Locked
        </p>

        <h3 className="mt-2 font-serif text-2xl font-semibold">
          Waiting for confirmed payment
        </h3>

        <p className="mt-2 text-sm leading-6 text-[#173d32]/60">
          Shipping will be available once LIKHA confirms the buyer&apos;s payment.
        </p>
      </div>
    </div>
  )}


{isSeller &&
  deliveryDetails &&
  !deliveryDetails.shipped_at &&
  isPaymentSecured && (
  <div className="mt-7 border-t border-[#173d32]/15 pt-7">
    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b76449]">
      Shipping
    </p>

    <h3 className="mt-2 font-serif text-2xl font-semibold">
      Ship this order
    </h3>

    <p className="mt-2 text-sm leading-6 text-[#173d32]/60">
      Use your preferred courier. The agreed order price should
      already include the shipping cost.
    </p>

    <form
      action={markOrderShipped}
      className="mt-6 grid gap-5 md:grid-cols-2"
    >
      <label>
        <span className="text-sm font-semibold">
          Courier *
        </span>

        <input
          type="text"
          name="courier"
          required
          placeholder="Example: J&T Express, LBC, Ninja Van"
          className="mt-2 w-full border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
        />
      </label>

      <label>
        <span className="text-sm font-semibold">
          Tracking number *
        </span>

        <input
          type="text"
          name="tracking_number"
          required
          placeholder="Enter courier tracking number"
          className="mt-2 w-full border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
        />
      </label>

      <div className="md:col-span-2">
        <button
          type="submit"
          className="bg-[#173d32] px-7 py-4 font-semibold text-white transition hover:bg-[#b76449]"
        >
          Mark as Shipped 
        </button>
      </div>
    </form>
  </div>
)}

{deliveryDetails?.shipped_at && (
  <div className="mt-7 rounded-xl border border-[#173d32]/15 bg-[#173d32]/5 p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#b76449]">
          Shipment Status
        </p>

        <h3 className="mt-2 font-serif text-2xl font-semibold">
          Shipped
        </h3>
      </div>

      <span className="w-fit rounded-full bg-[#173d32] px-4 py-2 text-xs font-semibold text-white">
        In Transit
      </span>
    </div>

    <dl className="mt-6 grid gap-5 sm:grid-cols-2">
      <div>
        <dt className="text-xs uppercase tracking-[0.14em] text-[#173d32]/45">
          Courier
        </dt>
        <dd className="mt-1 font-semibold">
          {deliveryDetails.courier}
        </dd>
      </div>

      <div>
        <dt className="text-xs uppercase tracking-[0.14em] text-[#173d32]/45">
          Tracking Number
        </dt>
        <dd className="mt-1 font-semibold">
          {deliveryDetails.tracking_number}
        </dd>
      </div>

      <div>
        <dt className="text-xs uppercase tracking-[0.14em] text-[#173d32]/45">
          Shipped At
        </dt>
        <dd className="mt-1 font-semibold">
          {new Date(
            deliveryDetails.shipped_at,
          ).toLocaleString("en-PH", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </dd>
      </div>
    </dl>
  </div>
)}


        <section className="py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
            Order progress
          </p>

          <h2 className="mt-3 font-serif text-4xl font-semibold">
            Kasalukuyang status
          </h2>

          <div className="mt-9 grid gap-px overflow-hidden border border-[#173d32]/15 bg-[#173d32]/15 md:grid-cols-3">
            {progressSteps.map((step, index) => {
              const isReached = index <= currentStep;

              return (
                <div
                  key={step.key}
                  className={
                    isReached
                      ? "bg-[#173d32] p-7 text-[#f5f0e6]"
                      : "bg-[#fbf8f1] p-7"
                  }
                >
                  <div
                    className={
                      isReached
                        ? "flex h-9 w-9 items-center justify-center rounded-full bg-[#b76449] font-semibold text-white"
                        : "flex h-9 w-9 items-center justify-center rounded-full border border-[#173d32]/25 font-semibold"
                    }
                  >
                    {isReached ? "✓" : index + 1}
                  </div>

                  <h3 className="mt-5 font-serif text-2xl font-semibold">
                    {step.title}
                  </h3>

                  <p
                    className={
                      isReached
                        ? "mt-3 leading-7 text-white/65"
                        : "mt-3 leading-7 text-[#173d32]/60"
                    }
                  >
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

{isSeller &&
  order.status === "in_progress" &&
  !isPaymentSecured && (
    <div className="mt-9 border border-[#173d32]/20 bg-[#fbf8f1] p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
        Payment Required
      </p>

      <h3 className="mt-2 font-serif text-3xl font-semibold">
        Waiting for buyer payment
      </h3>

      <p className="mt-3 leading-7 text-[#173d32]/65">
        Do not begin production yet. LIKHA will notify you once the
        buyer&apos;s payment has been confirmed.
      </p>
    </div>
  )}


        {isSeller &&
  order.status === "in_progress" &&
  isPaymentSecured && (
            <div className="mt-9 border border-[#173d32]/20 bg-[#fbf8f1] p-7">
              <h3 className="font-serif text-3xl font-semibold">
                Tapos na ba ang paggawa?
              </h3>

              <p className="mt-3 leading-7 text-[#173d32]/65">
                Kapag handa na ang order, isumite ito para ma-review ng buyer.
              </p>

              <form action={submitOrder}>
                <button
                  type="submit"
                  className="mt-6 bg-[#b76449] px-7 py-4 font-semibold text-white transition hover:bg-[#9f503c]"
                >
                  Submit for Buyer Review 
                </button>
              </form>
            </div>
          )}

          {isBuyer && order.status === "submitted" && (
            <div className="mt-9 border border-[#173d32]/20 bg-[#fbf8f1] p-7">
              <h3 className="font-serif text-3xl font-semibold">
                Na-review mo na ba ang order?
              </h3>

              <p className="mt-3 leading-7 text-[#173d32]/65">
                Markahan lamang bilang completed kapag natanggap at nasuri mo
                na ang finished order.
              </p>

              <form action={completeOrder}>
                <button
                  type="submit"
                  className="mt-6 bg-[#b76449] px-7 py-4 font-semibold text-white transition hover:bg-[#9f503c]"
                >
                  Mark as Completed 
                </button>
              </form>
            </div>
          )}
{isBuyer &&
  ["in_progress", "submitted", "completed"].includes(
    order.status,
  ) && (
   <div
  id="refund"
  className="mt-9 scroll-mt-28 border border-[#b76449]/25 bg-[#fbf8f1] p-7"
>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
        Refund
      </p>

      <h3 className="mt-2 font-serif text-3xl font-semibold">
        Need to request a refund?
      </h3>

      {existingRefund ? (
        <div className="mt-6 rounded-xl bg-[#173d32]/5 p-5">
          <p className="font-semibold">
            Refund request submitted
          </p>

          <p className="mt-2 text-sm text-[#173d32]/60">
            Status:{" "}
            <span className="font-semibold">
              {existingRefund.status}
            </span>
          </p>

          <p className="mt-2 text-sm text-[#173d32]/60">
            Reason: {existingRefund.reason}
          </p>
        </div>
      ) : (
        <form
          action={requestRefund}
          className="mt-6 space-y-5"
        >
          <div>
            <label
              htmlFor="reason"
              className="text-sm font-semibold"
            >
              Reason
            </label>

            <select
              id="reason"
              name="reason"
              required
              className="mt-2 w-full border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
            >
              <option value="">
                Select a reason
              </option>
              <option value="Order not as agreed">
                Order not as agreed
              </option>
              <option value="Seller unable to complete">
                Seller unable to complete
              </option>
              <option value="Delivery issue">
                Delivery issue
              </option>
              <option value="Duplicate payment">
                Duplicate payment
              </option>
              <option value="Other">
                Other
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="details"
              className="text-sm font-semibold"
            >
              Details
            </label>

            <textarea
              id="details"
              name="details"
              rows={5}
              placeholder="Explain what happened and why you are requesting a refund."
              className="mt-2 w-full resize-y border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
            />
          </div>
<RefundEvidenceUpload />
          <button
            type="submit"
            className="bg-[#b76449] px-7 py-4 font-semibold text-white transition hover:bg-[#9f503c]"
          >
            Submit Refund Request
          </button>
        </form>
      )}
    </div>
  )}

  {isSeller && existingRefund && (
  <div className="mt-9 border border-[#173d32]/20 bg-[#fbf8f1] p-7">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
      Refund Request
    </p>

    <h3 className="mt-2 font-serif text-3xl font-semibold">
      Buyer requested a refund
    </h3>

    <div className="mt-6 space-y-3 text-sm text-[#173d32]/65">
      <p>
        <span className="font-semibold text-[#173d32]">
          Status:
        </span>{" "}
        {existingRefund.status}
      </p>

      <p>
        <span className="font-semibold text-[#173d32]">
          Reason:
        </span>{" "}
        {existingRefund.reason}
      </p>

      {existingRefund.details && (
        <p>
          <span className="font-semibold text-[#173d32]">
            Details:
          </span>{" "}
          {existingRefund.details}
        </p>
      )}
    </div>

    <form
      action={respondToRefund}
      className="mt-6 space-y-4"
    >
      <input
        type="hidden"
        name="refund_id"
        value={existingRefund.id}
      />

      <div>
        <label
          htmlFor="seller_response"
          className="text-sm font-semibold"
        >
          Your response
        </label>

        <textarea
          id="seller_response"
          name="seller_response"
          rows={5}
          defaultValue={
            existingRefund.seller_response ?? ""
          }
          placeholder="Explain your side or provide relevant details."
          className="mt-2 w-full resize-y border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
        />
      </div>

      <button
        type="submit"
        className="bg-[#173d32] px-7 py-4 font-semibold text-white transition hover:bg-[#b76449]"
      >
        Send Response
      </button>
    </form>
  </div>
)}
          {order.status === "completed" && (
            <div className="mt-9 border border-[#173d32]/20 bg-[#dfe9df] p-7">
              <h3 className="font-serif text-3xl font-semibold">
                Completed na ang order.
              </h3>

              <p className="mt-3 text-[#173d32]/65">
                Matagumpay nang natapos ang paggawa sa Likha.
              </p>
<div className="mt-7">
  <Link
    href={`/profile/${revieweeId}`}
    className="inline-flex items-center border border-[#173d32]/20 px-5 py-3 text-sm font-semibold transition hover:border-[#b76449] hover:text-[#b76449]"
  >
    View {revieweeLabel === "seller" ? "Seller" : "Buyer"} Profile 
  </Link>
</div>

{messages.success === "shipped" && (
  <div className="mb-8 border border-[#173d32]/20 bg-[#dfe9df] p-5 text-sm">
    Na-mark na bilang shipped ang order at na-notify na ang buyer.
  </div>
)}

              <ReviewForm
  orderId={order.id}
  revieweeId={revieweeId}
  revieweeLabel={revieweeLabel}
  existingReview={existingReview}
/>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}