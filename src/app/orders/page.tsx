import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthenticatedNavbar from "@/app/components/authenticated-navbar";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
  }>;
}) {
  const params = await searchParams;
  const activeFilter = params.filter ?? "all";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const { data: orderRows, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, request_id, agreed_price, delivery_days, due_date, status, created_at",
    )
    .order("created_at", { ascending: false });

    const orderIds = (orderRows ?? []).map(
  (order) => order.id,
);

const { data: refundRows } =
  orderIds.length > 0
    ? await supabase
        .from("refund_requests")
        .select("order_id, status")
        .in("order_id", orderIds)
    : { data: [] };

const refundOrderIds = new Set(
  (refundRows ?? []).map(
    (refund) => refund.order_id,
  ),
);

  if (ordersError) {
    throw new Error(`Hindi makuha ang orders: ${ordersError.message}`);
  }

  const orders = await Promise.all(
    (orderRows ?? []).map(async (order) => {
      const { data: project } = await supabase
        .rpc("get_order_project", {
          p_order_id: order.id,
        })
        .maybeSingle();

      return {
        ...order,
        project_requests: project,
      };
    }),
  );

  const isSeller = profile?.role === "seller";
  const filteredOrders = orders.filter((order) => {
  if (activeFilter === "completed") {
    return order.status === "completed";
  }

  if (activeFilter === "processing") {
    return order.status === "in_progress";
  }

  if (activeFilter === "refunds") {
    return refundOrderIds.has(order.id);
  }

  return true;
});

  function statusLabel(status: string) {
    if (status === "in_progress") return "In progress";
    if (status === "submitted") return "For buyer review";
    if (status === "completed") return "Completed";
    if (status === "cancelled") return "Cancelled";

    return status;
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
<AuthenticatedNavbar />

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <section className="border-b border-[#173d32]/15 pb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76449]">
            {isSeller ? "Seller workspace" : "Buyer workspace"}
          </p>

          <h1 className="mt-3 font-serif text-5xl font-semibold">
            Mga kasalukuyang order
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-[#173d32]/65">
            Subaybayan ang napagkasunduang presyo, deadline at kasalukuyang
            progress ng bawat project.
          </p>
        </section>

        <nav className="mt-8 flex flex-wrap gap-3">
  {[
    {
      label: "All",
      value: "all",
    },
    {
      label: "Completed",
      value: "completed",
    },
    {
      label: "Processing",
      value: "processing",
    },
    {
      label: "Refunds",
      value: "refunds",
    },
  ].map((filter) => {
    const active =
      activeFilter === filter.value;

    const href =
      filter.value === "all"
        ? "/orders"
        : `/orders?filter=${filter.value}`;

    return (
      <Link
        key={filter.value}
        href={href}
        className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
          active
            ? "border-[#173d32] bg-[#173d32] text-white"
            : "border-[#173d32]/15 bg-transparent text-[#173d32] hover:border-[#b76449] hover:text-[#b76449]"
        }`}
      >
        {filter.label}
      </Link>
    );
  })}
</nav>

{filteredOrders.length === 0 ? (
  <section className="py-20 text-center">
    <h2 className="font-serif text-3xl font-semibold">
      {activeFilter === "all"
        ? "Wala ka pang order."
        : activeFilter === "completed"
          ? "Wala pang completed orders."
          : activeFilter === "processing"
            ? "Walang order na kasalukuyang pinoproseso."
            : "Wala pang refund requests."}
    </h2>

    <p className="mt-3 text-[#173d32]/60">
      {activeFilter === "all"
        ? "Lalabas dito ang order kapag may tinanggap na seller proposal."
        : "Subukan ang ibang filter upang makita ang iba mong orders."}
    </p>

    <Link
      href={activeFilter === "all" ? "/dashboard" : "/orders"}
      className="mt-7 inline-block font-semibold text-[#b76449]"
    >
      {activeFilter === "all"
        ? "Bumalik sa Dashboard "
        : "Tingnan lahat ng orders "}
    </Link>
  </section>
        ) : (
          <section className="mt-10 divide-y divide-[#173d32]/15 border-y border-[#173d32]/15">
           {filteredOrders.map((order) => {
              const project = Array.isArray(order.project_requests)
                ? order.project_requests[0]
                : order.project_requests;

              return (
                <article
                  key={order.id}
                  className="grid gap-7 py-8 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto] md:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#b76449]">
                      {project?.product_type ?? "Custom project"}
                    </p>

                    <h2 className="mt-1 font-serif text-3xl font-semibold">
                      {project?.title ?? "Likha order"}
                    </h2>

                    <p className="mt-2 text-sm text-[#173d32]/55">
                      {project?.location}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#173d32]/45">
                      Agreed price
                    </p>

                    <p className="mt-2 font-semibold">
                      ₱{Number(order.agreed_price).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#173d32]/45">
                      Due date
                    </p>

                    <p className="mt-2 font-semibold">
                      {new Date(order.due_date).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-[#b76449]">
                      {statusLabel(order.status)}
                    </p>
                  </div>

     <div className="flex flex-col items-start gap-3 md:items-end">
  <Link
    href={`/orders/${order.id}`}
    className="font-semibold text-[#b76449]"
  >
    Tingnan ang Order 
  </Link>


  {!isSeller &&
    ["in_progress", "submitted", "completed"].includes(
      order.status,
    ) && (
      <Link
        href={`/orders/${order.id}#refund`}
        className="text-sm font-semibold text-[#173d32]/65 transition hover:text-[#b76449]"
      >
        Request a Refund 
      </Link>
    )}
</div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}