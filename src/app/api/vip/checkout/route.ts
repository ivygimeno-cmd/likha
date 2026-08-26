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

    const body = await request.json().catch(() => ({}));

    const requestedType =
      body?.paymentType === "renewal"
        ? "renewal"
        : "initial";

    const amount =
      requestedType === "renewal"
        ? 200
        : 100;

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
     * Prevent another initial VIP purchase
     * while the user is already VIP.
     */
    const { data: profile, error: profileError } =
      await adminSupabase
        .from("profiles")
        .select(
          "account_tier, vip_expires_at",
        )
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error:
            "Unable to load your VIP account status.",
        },
        { status: 500 },
      );
    }

    const vipExpiresAt = profile.vip_expires_at
      ? new Date(profile.vip_expires_at)
      : null;

    const currentlyVip =
      profile.account_tier === "vip" &&
      vipExpiresAt !== null &&
      vipExpiresAt.getTime() > Date.now();

    if (
      requestedType === "initial" &&
      currentlyVip
    ) {
      return NextResponse.json(
        {
          error:
            "You already have an active VIP membership.",
        },
        { status: 409 },
      );
    }

    /*
     * Renewal is only available when the
     * user is currently VIP or has previously
     * had a VIP membership.
     *
     * We still allow renewal after expiry.
     */
    if (
      requestedType === "renewal" &&
      !profile.vip_expires_at
    ) {
      return NextResponse.json(
        {
          error:
            "Renewal is not available yet. Please purchase VIP first.",
        },
        { status: 400 },
      );
    }

    const amountInCentavos =
      amount * 100;

    const origin =
      new URL(request.url).origin;

    /*
     * Create PayMongo Checkout Session.
     */
    const paymongoResponse =
      await fetch(
        "https://api.paymongo.com/v1/checkout_sessions",
        {
          method: "POST",

          headers: {
            Authorization:
              "Basic " +
              Buffer.from(
                `${paymongoSecretKey}:`,
              ).toString("base64"),

            "Content-Type":
              "application/json",
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

                    name:
                      requestedType === "renewal"
                        ? "LIKHA VIP Renewal"
                        : "LIKHA VIP Membership",

                    quantity: 1,
                  },
                ],

                payment_method_types: [
                  "gcash",
                  "paymaya",
                  "card",
                ],

                description:
                  requestedType === "renewal"
                    ? "LIKHA VIP 30-day renewal"
                    : "LIKHA VIP 30-day membership",

                success_url:
                  `${origin}/vip?payment=success`,

                cancel_url:
                  `${origin}/vip?payment=cancelled`,

                reference_number:
                  `VIP-${user.id}-${Date.now()}`,

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
        "PayMongo VIP checkout error:",
        paymongoData,
      );

      return NextResponse.json(
        {
          error:
            paymongoData?.errors?.[0]
              ?.detail ??
            "Unable to create VIP checkout.",
        },
        {
          status:
            paymongoResponse.status,
        },
      );
    }

    const checkoutId =
      paymongoData?.data?.id;

    const checkoutUrl =
      paymongoData?.data?.attributes
        ?.checkout_url;

    if (
      !checkoutId ||
      !checkoutUrl
    ) {
      return NextResponse.json(
        {
          error:
            "PayMongo did not return a valid VIP checkout session.",
        },
        { status: 500 },
      );
    }

    /*
     * Save pending VIP payment.
     *
     * IMPORTANT:
     * pending does NOT activate VIP.
     * VIP will only activate after
     * PayMongo confirms payment.
     */
    const {
      error: paymentRecordError,
    } = await adminSupabase
      .from("vip_payments")
      .insert({
        user_id: user.id,

        amount,

        payment_type:
          requestedType,

        status: "pending",

        paymongo_checkout_id:
          checkoutId,

        transaction_reference:
          `VIP-${user.id}-${Date.now()}`,
      });

    if (paymentRecordError) {
      console.error(
        "VIP payment record error:",
        paymentRecordError,
      );

      return NextResponse.json(
        {
          error:
            "Checkout was created, but LIKHA could not save the VIP payment record.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      checkoutUrl,
    });
  } catch (error) {
    console.error(
      "VIP checkout route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unexpected error while creating VIP checkout.",
      },
      { status: 500 },
    );
  }
}