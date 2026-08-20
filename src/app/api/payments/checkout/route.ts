import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const orderId = String(body.orderId ?? "").trim();

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID." },
        { status: 400 },
      );
    }

    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .select(
          "id, buyer_id, seller_id, agreed_price, status",
        )
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 },
      );
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Only the buyer can pay for this order.",
        },
        { status: 403 },
      );
    }

    const paymongoSecretKey =
      process.env.PAYMONGO_SECRET_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!paymongoSecretKey) {
      return NextResponse.json(
        {
          error:
            "PayMongo secret key is not configured.",
        },
        { status: 500 },
      );
    }

    if (!supabaseUrl || !supabaseSecretKey) {
      return NextResponse.json(
        {
          error:
            "Supabase server credentials are not configured.",
        },
        { status: 500 },
      );
    }

    /*
     * Server-only Supabase client.
     * Never expose SUPABASE_SECRET_KEY to the browser.
     */
    const adminSupabase =
      createSupabaseAdmin(
        supabaseUrl,
        supabaseSecretKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );

    /*
     * Check existing payment state.
     */
    const {
      data: existingPayment,
      error: existingPaymentError,
    } = await adminSupabase
      .from("order_payments")
      .select(
        `
          id,
          status,
          paymongo_checkout_id
        `,
      )
      .eq("order_id", order.id)
      .maybeSingle();

    if (existingPaymentError) {
      return NextResponse.json(
        {
          error:
            existingPaymentError.message,
        },
        { status: 500 },
      );
    }

    /*
     * Never create another checkout if this
     * order has already been successfully paid.
     */
    if (
      existingPayment &&
      [
        "paid",
        "payout_pending",
        "payout_released",
      ].includes(existingPayment.status)
    ) {
      return NextResponse.json(
        {
          error:
            "This order has already been paid.",
        },
        { status: 409 },
      );
    }

    const amountInCentavos = Math.round(
      Number(order.agreed_price) * 100,
    );

    if (
      !Number.isFinite(amountInCentavos) ||
      amountInCentavos <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid order amount.",
        },
        { status: 400 },
      );
    }

    const origin = new URL(request.url).origin;

    /*
     * Create PayMongo Checkout Session.
     */
    const paymongoResponse = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${paymongoSecretKey}:`,
            ).toString("base64"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              billing: {
                email:
                  user.email ?? undefined,
              },

              line_items: [
                {
                  amount:
                    amountInCentavos,
                  currency: "PHP",
                  name: `LIKHA Order ${order.id.slice(
                    0,
                    8,
                  )}`,
                  quantity: 1,
                },
              ],

              payment_method_types: [
                "gcash",
                "paymaya",
                "card",
              ],

              description:
                "LIKHA marketplace test payment",

              success_url:
                `${origin}/orders/${order.id}?payment=success`,

              cancel_url:
                `${origin}/orders/${order.id}?payment=cancelled`,

              reference_number: order.id,

              send_email_receipt: false,
              show_description: true,
              show_line_items: true,
            },
          },
        }),
      },
    );

    const paymongoData =
      await paymongoResponse.json();

    if (!paymongoResponse.ok) {
      console.error(
        "PayMongo checkout error:",
        paymongoData,
      );

      return NextResponse.json(
        {
          error:
            paymongoData?.errors?.[0]
              ?.detail ??
            "Unable to create PayMongo checkout.",
        },
        {
          status: paymongoResponse.status,
        },
      );
    }

    const checkoutId =
      paymongoData?.data?.id;

    const checkoutUrl =
      paymongoData?.data?.attributes
        ?.checkout_url;

    if (!checkoutId || !checkoutUrl) {
      return NextResponse.json(
        {
          error:
            "PayMongo did not return a valid checkout session.",
        },
        { status: 500 },
      );
    }

    /*
     * Create or update LIKHA payment record.
     *
     * IMPORTANT:
     * `pending` only means checkout has started.
     * It DOES NOT mean buyer has paid.
     */
    const {
      error: paymentRecordError,
    } = await adminSupabase
      .from("order_payments")
      .upsert(
        {
          order_id: order.id,
          buyer_id: order.buyer_id,
          seller_id: order.seller_id,
          amount: order.agreed_price,
          currency: "PHP",
          status: "pending",

          paymongo_checkout_id:
            checkoutId,

          paymongo_reference_number:
            order.id,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "order_id",
        },
      );

    if (paymentRecordError) {
      console.error(
        "Payment record error:",
        paymentRecordError,
      );

      return NextResponse.json(
        {
          error:
            "Checkout was created, but LIKHA could not save the payment record.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      checkoutUrl,
    });
  } catch (error) {
    console.error(
      "Checkout route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unexpected error while creating checkout.",
      },
      { status: 500 },
    );
  }
}