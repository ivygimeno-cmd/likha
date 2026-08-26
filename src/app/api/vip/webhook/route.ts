import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

function verifyPayMongoSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  isLiveMode: boolean,
) {
  const parts = signatureHeader.split(",");

  let timestamp = "";
  let testSignature = "";
  let liveSignature = "";

  for (const part of parts) {
    const [key, value] = part.split("=");

    if (key === "t") {
      timestamp = value ?? "";
    }

    if (key === "te") {
      testSignature = value ?? "";
    }

    if (key === "li") {
      liveSignature = value ?? "";
    }
  }

  if (!timestamp) {
    return false;
  }

  const providedSignature = isLiveMode
    ? liveSignature
    : testSignature;

  if (!providedSignature) {
    return false;
  }

  const signaturePayload =
    `${timestamp}.${rawBody}`;

  const expectedSignature =
    crypto
      .createHmac("sha256", secret)
      .update(signaturePayload)
      .digest("hex");

  const expectedBuffer =
    Buffer.from(expectedSignature, "utf8");

  const providedBuffer =
    Buffer.from(providedSignature, "utf8");

  if (
    expectedBuffer.length !==
    providedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    providedBuffer,
  );
}

export async function POST(request: Request) {
  try {
    /*
     * IMPORTANT:
     * Read the raw body BEFORE JSON parsing.
     * PayMongo uses the raw body when creating
     * the webhook signature.
     */
    const rawBody = await request.text();

    const signatureHeader =
      request.headers.get("paymongo-signature");

    const webhookSecret =
      process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "PAYMONGO_WEBHOOK_SECRET is not configured.",
      );

      return NextResponse.json(
        {
          error:
            "Webhook secret is not configured.",
        },
        { status: 500 },
      );
    }

    if (!signatureHeader) {
      return NextResponse.json(
        {
          error:
            "Missing PayMongo signature.",
        },
        { status: 401 },
      );
    }

    /*
     * Parse only after signature verification
     * is possible.
     *
     * We need livemode from the payload to know
     * whether to compare the live or test signature.
     */
    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error: "Invalid webhook payload.",
        },
        { status: 400 },
      );
    }

    const isLiveMode =
      payload?.data?.livemode === true;

    const isValid =
      verifyPayMongoSignature(
        rawBody,
        signatureHeader,
        webhookSecret,
        isLiveMode,
      );

    if (!isValid) {
      console.error(
        "Invalid PayMongo webhook signature.",
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature.",
        },
        { status: 401 },
      );
    }

    /*
     * We only subscribed to this event,
     * but still check it explicitly.
     */
    const eventType =
      payload?.data?.type;

    if (
      eventType !==
      "checkout_session.payment.paid"
    ) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    /*
     * PayMongo's checkout webhook contains
     * the Checkout Session under data.data.
     */
    const checkoutSession =
      payload?.data?.data;

    const checkoutId =
      checkoutSession?.id;

    const checkoutAttributes =
      checkoutSession?.attributes ?? {};

    const referenceNumber =
      checkoutAttributes.reference_number;

    if (!checkoutId) {
      console.error(
        "PayMongo webhook has no checkout session ID.",
      );

      return NextResponse.json(
        {
          error:
            "Missing checkout session ID.",
        },
        { status: 400 },
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (
      !supabaseUrl ||
      !supabaseSecretKey
    ) {
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
     * Find the VIP payment created when
     * the checkout session was started.
     */
    const {
      data: vipPayment,
      error: vipPaymentError,
    } = await adminSupabase
      .from("vip_payments")
      .select(
        `
          id,
          user_id,
          amount,
          payment_type,
          status,
          paymongo_checkout_id
        `,
      )
      .eq(
        "paymongo_checkout_id",
        checkoutId,
      )
      .maybeSingle();

    if (vipPaymentError) {
      console.error(
        "VIP payment lookup error:",
        vipPaymentError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to find VIP payment record.",
        },
        { status: 500 },
      );
    }

    if (!vipPayment) {
      console.error(
        "No VIP payment found for checkout:",
        checkoutId,
        referenceNumber,
      );

      return NextResponse.json(
        {
          error:
            "VIP payment record not found.",
        },
        { status: 404 },
      );
    }

    /*
     * Idempotency:
     * PayMongo may retry a webhook.
     *
     * If this payment has already been processed,
     * do not activate another 30-day period.
     */
    if (vipPayment.status === "paid") {
      return NextResponse.json({
        received: true,
        alreadyProcessed: true,
      });
    }

    /*
     * Confirm the successful payment amount.
     */
    const payments =
      checkoutAttributes.payments ?? [];

    const successfulPayment =
      payments.find(
        (payment: any) =>
          payment?.attributes?.status ===
          "paid",
      );

    const paidAmount =
      Number(
        successfulPayment?.attributes?.amount ??
          0,
      );

    const expectedAmount =
      Number(vipPayment.amount) * 100;

    if (
      !Number.isFinite(paidAmount) ||
      paidAmount !== expectedAmount
    ) {
      console.error(
        "VIP payment amount mismatch:",
        {
          expectedAmount,
          paidAmount,
          checkoutId,
        },
      );

      return NextResponse.json(
        {
          error:
            "VIP payment amount mismatch.",
        },
        { status: 400 },
      );
    }

    const now =
      new Date();

    /*
     * Load the user's current VIP period.
     */
    const {
      data: profile,
      error: profileError,
    } = await adminSupabase
      .from("profiles")
      .select(
        "account_tier, vip_started_at, vip_expires_at",
      )
      .eq("id", vipPayment.user_id)
      .single();

    if (profileError || !profile) {
      console.error(
        "VIP profile lookup error:",
        profileError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load VIP profile.",
        },
        { status: 500 },
      );
    }

    const existingExpiry =
      profile.vip_expires_at
        ? new Date(profile.vip_expires_at)
        : null;

    /*
     * If someone renews before their VIP expires,
     * continue from the existing expiry date.
     *
     * If already expired, start from now.
     */
    const periodStart =
      existingExpiry &&
      existingExpiry.getTime() >
        now.getTime()
        ? existingExpiry
        : now;

    const periodEnd =
      new Date(periodStart);

    periodEnd.setDate(
      periodEnd.getDate() + 30,
    );

    /*
     * Mark the payment as paid.
     */
    const {
      error: paymentUpdateError,
    } = await adminSupabase
      .from("vip_payments")
      .update({
        status: "paid",
        updated_at:
          now.toISOString(),
      })
      .eq(
        "id",
        vipPayment.id,
      );

    if (paymentUpdateError) {
      console.error(
        "VIP payment update error:",
        paymentUpdateError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to update VIP payment.",
        },
        { status: 500 },
      );
    }

    /*
     * Activate VIP for 30 days.
     */
    const {
      error: profileUpdateError,
    } = await adminSupabase
      .from("profiles")
      .update({
        account_tier: "vip",
        vip_started_at:
          now.toISOString(),
        vip_expires_at:
          periodEnd.toISOString(),
      })
      .eq(
        "id",
        vipPayment.user_id,
      );

    if (profileUpdateError) {
      console.error(
        "VIP profile activation error:",
        profileUpdateError,
      );

      return NextResponse.json(
        {
          error:
            "Payment was recorded but VIP activation failed.",
        },
        { status: 500 },
      );
    }

    console.log(
      "LIKHA VIP activated:",
      {
        userId: vipPayment.user_id,
        paymentId: vipPayment.id,
        paymentType:
          vipPayment.payment_type,
        checkoutId,
        vipStartedAt:
          now.toISOString(),
        vipExpiresAt:
          periodEnd.toISOString(),
      },
    );

    /*
     * Acknowledge PayMongo.
     */
    return NextResponse.json({
      received: true,
      vipActivated: true,
    });
  } catch (error) {
    console.error(
      "VIP webhook error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unexpected error while processing VIP webhook.",
      },
      { status: 500 },
    );
  }
}