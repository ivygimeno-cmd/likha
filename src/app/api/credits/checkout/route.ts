import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const creditBundles = {
  starter: {
    credits: 50,
    amount: 99,
    name: "LIKHA Credits - Starter",
  },
  creator: {
    credits: 120,
    amount: 199,
    name: "LIKHA Credits - Creator",
  },
  studio: {
    credits: 300,
    amount: 449,
    name: "LIKHA Credits - Studio",
  },
} as const;

type BundleCode = keyof typeof creditBundles;

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

    const bundleCode = body?.bundleCode;

    if (
      typeof bundleCode !== "string" ||
      !(bundleCode in creditBundles)
    ) {
      return NextResponse.json(
        { error: "Invalid credit bundle." },
        { status: 400 },
      );
    }

    const bundle =
      creditBundles[bundleCode as BundleCode];

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

    const transactionReference =
      `CREDIT-${user.id}-${Date.now()}`;

    const origin =
      new URL(request.url).origin;

    const amountInCentavos =
      bundle.amount * 100;

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

                    name: bundle.name,

                    quantity: 1,
                  },
                ],

               payment_method_types: [
  "qrph",
],

                description:
                  `${bundle.credits} LIKHA Credits`,

                success_url:
                  `${origin}/credits?payment=success`,

                cancel_url:
                  `${origin}/credits?payment=cancelled`,

                reference_number:
                  transactionReference,

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
        "PayMongo credits checkout error:",
        paymongoData,
      );

      return NextResponse.json(
        {
          error:
            paymongoData?.errors?.[0]?.detail ??
            "Unable to create credit checkout.",
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

    if (!checkoutId || !checkoutUrl) {
      return NextResponse.json(
        {
          error:
            "PayMongo did not return a valid checkout session.",
        },
        { status: 500 },
      );
    }

    const {
      error: paymentRecordError,
    } = await adminSupabase
      .from("likha_credit_purchases")
      .insert({
        user_id: user.id,
        bundle_code: bundleCode,
        credits: bundle.credits,
        amount: bundle.amount,
        status: "pending",
        paymongo_checkout_id: checkoutId,
        transaction_reference:
          transactionReference,
      });

    if (paymentRecordError) {
      console.error(
        "Credit purchase record error:",
        paymentRecordError,
      );

      return NextResponse.json(
        {
          error:
            "Checkout was created, but LIKHA could not save the purchase record.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      checkoutUrl,
    });
  } catch (error) {
    console.error(
      "Credits checkout route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unexpected error while creating credit checkout.",
      },
      { status: 500 },
    );
  }
}