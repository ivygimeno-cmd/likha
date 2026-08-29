import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

type PayMongoEvent = {
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      type?: string;
      livemode?: boolean;
      data?: {
        id?: string;
        type?: string;
        attributes?: {
          amount?: number;
          currency?: string;
          status?: string;
          paid_at?: number;
          reference_number?: string | null;
          external_reference_number?: string | null;
        };
      };
    };
  };
};


function verifyPayMongoSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  livemode: boolean,
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

  const providedSignature = livemode
    ? liveSignature
    : testSignature;

  if (!providedSignature) {
    return false;
  }

  const signedPayload =
    `${timestamp}.${rawBody}`;

  const expectedSignature =
    crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
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
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error(
        "Missing Supabase server credentials.",
      );

      return NextResponse.json(
        { received: false },
        { status: 500 },
      );
    }

    const adminSupabase = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const webhookSecret =
  process.env.PAYMONGO_CREDITS_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error(
    "Missing PayMongo Credits webhook secret.",
  );

  return NextResponse.json(
    { received: false },
    { status: 500 },
  );
}

const rawBody = await request.text();

const signatureHeader =
  request.headers.get("paymongo-signature");

if (!signatureHeader) {
  console.error(
    "Missing PayMongo-Signature header.",
  );

  return NextResponse.json(
    { received: false },
    { status: 401 },
  );
}

let payload: PayMongoEvent;

try {
  payload =
    JSON.parse(rawBody) as PayMongoEvent;
} catch {
  return NextResponse.json(
    { received: false },
    { status: 400 },
  );
}

const livemode =
  payload.data?.attributes?.livemode ?? false;

const isValidSignature =
  verifyPayMongoSignature(
    rawBody,
    signatureHeader,
    webhookSecret,
    livemode,
  );

if (!isValidSignature) {
  console.error(
    "Invalid PayMongo webhook signature.",
  );

  return NextResponse.json(
    { received: false },
    { status: 401 },
  );
}

const eventId =
  payload.data?.id ?? "";

const eventType =
  payload.data?.attributes?.type ?? "";


    if (!eventId || !eventType) {
      return NextResponse.json(
        { received: false },
        { status: 400 },
      );
    }

    /*
     * --------------------------------------------------
     * IDEMPOTENCY
     * --------------------------------------------------
     *
     * Do not process the same PayMongo event twice.
     */

    const {
      data: existingEvent,
      error: existingEventError,
    } = await adminSupabase
      .from("paymongo_webhook_events")
      .select("event_id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEventError) {
      console.error(
        "Webhook event lookup failed:",
        existingEventError,
      );

      return NextResponse.json(
        { received: false },
        { status: 500 },
      );
    }

    if (existingEvent) {
      return NextResponse.json({
        received: true,
        duplicate: true,
      });
    }

    /*
     * --------------------------------------------------
     * ONLY PROCESS SUCCESSFUL PAYMENTS
     * --------------------------------------------------
     */

    if (eventType === "payment.paid") {
      const payment =
        payload.data?.attributes?.data;

      const paymentId =
        payment?.id ?? "";

      const attributes =
        payment?.attributes;

      const status =
        attributes?.status;

      const amount =
        attributes?.amount;

      const referenceNumber =
        attributes?.external_reference_number ??
        attributes?.reference_number ??
        null;

      if (
        !paymentId ||
        status !== "paid"
      ) {
        return NextResponse.json(
          {
            received: false,
            reason:
              "Invalid paid payment event.",
          },
          { status: 400 },
        );
      }

      /*
       * --------------------------------------------------
       * FIND CREDIT PURCHASE
       * --------------------------------------------------
       */

      let purchase = null;

      /*
       * First try PayMongo payment ID.
       */

      const {
        data: purchaseByPaymentId,
      } = await adminSupabase
        .from("likha_credit_purchases")
        .select(
          `
            id,
            user_id,
            bundle_code,
            credits,
            amount,
            status,
            paymongo_checkout_id,
            paymongo_payment_id,
            transaction_reference,
            paid_at
          `,
        )
        .eq(
          "paymongo_payment_id",
          paymentId,
        )
        .maybeSingle();

      purchase =
        purchaseByPaymentId;

      /*
       * If payment ID was not saved yet,
       * find the purchase using our reference.
       */

      if (
        !purchase &&
        referenceNumber
      ) {
        const {
          data: purchaseByReference,
        } = await adminSupabase
          .from("likha_credit_purchases")
          .select(
            `
              id,
              user_id,
              bundle_code,
              credits,
              amount,
              status,
              paymongo_checkout_id,
              paymongo_payment_id,
              transaction_reference,
              paid_at
            `,
          )
          .eq(
            "transaction_reference",
            referenceNumber,
          )
          .maybeSingle();

        purchase =
          purchaseByReference;
      }

      if (!purchase) {
        console.error(
          "No LIKHA credit purchase matched PayMongo payment:",
          paymentId,
          referenceNumber,
        );

        return NextResponse.json(
          {
            received: false,
            reason:
              "Credit purchase record not found.",
          },
          { status: 404 },
        );
      }

      /*
       * --------------------------------------------------
       * VERIFY PAYMENT AMOUNT
       * --------------------------------------------------
       */

      const expectedAmount =
        Math.round(
          Number(purchase.amount) * 100,
        );

      if (
        typeof amount !== "number" ||
        amount !== expectedAmount
      ) {
        console.error(
          "Credit payment amount mismatch:",
          {
            expectedAmount,
            receivedAmount: amount,
            purchaseId: purchase.id,
          },
        );

        return NextResponse.json(
          {
            received: false,
            reason:
              "Payment amount mismatch.",
          },
          { status: 400 },
        );
      }

      /*
       * --------------------------------------------------
       * IF ALREADY PAID, DO NOT ADD CREDITS AGAIN
       * --------------------------------------------------
       */

      if (purchase.status === "paid") {
        /*
         * Still record the payment ID if missing.
         */

        if (
          !purchase.paymongo_payment_id
        ) {
          await adminSupabase
            .from(
              "likha_credit_purchases",
            )
            .update({
              paymongo_payment_id:
                paymentId,
            })
            .eq(
              "id",
              purchase.id,
            );
        }

        return NextResponse.json({
          received: true,
          alreadyProcessed: true,
        });
      }

      /*
       * --------------------------------------------------
       * MARK PURCHASE AS PAID
       * --------------------------------------------------
       */

      const paidAt =
        attributes?.paid_at
          ? new Date(
              attributes.paid_at * 1000,
            ).toISOString()
          : new Date().toISOString();

      const {
        error: purchaseUpdateError,
      } = await adminSupabase
        .from("likha_credit_purchases")
        .update({
          status: "paid",
          paymongo_payment_id:
            paymentId,
          paid_at: paidAt,
        })
        .eq(
          "id",
          purchase.id,
        )
        .eq(
          "status",
          "pending",
        );

      if (purchaseUpdateError) {
        console.error(
          "Unable to mark credit purchase paid:",
          purchaseUpdateError,
        );

        return NextResponse.json(
          { received: false },
          { status: 500 },
        );
      }

      /*
       * --------------------------------------------------
       * ADD CREDITS
       * --------------------------------------------------
       *
       * entry_key is unique per purchase.
       * This prevents the same purchase from
       * awarding credits more than once.
       */

      const entryKey =
        `credit_purchase:${purchase.id}`;

      const {
        data: existingLedgerEntry,
      } = await adminSupabase
        .from("likha_credit_ledger")
        .select("id")
        .eq(
          "entry_key",
          entryKey,
        )
        .maybeSingle();

      if (!existingLedgerEntry) {
        const {
          error: ledgerInsertError,
        } = await adminSupabase
          .from("likha_credit_ledger")
          .insert({
            user_id:
              purchase.user_id,

            amount:
              purchase.credits,

            entry_type:
              "credit_purchase",

            entry_key:
              entryKey,

            reference_id:
              String(purchase.id),

            description:
              `${purchase.credits} LIKHA Credits purchased (${purchase.bundle_code})`,
          });

        if (ledgerInsertError) {
          console.error(
            "Unable to add LIKHA Credits:",
            ledgerInsertError,
          );

          return NextResponse.json(
            {
              received: false,
              reason:
                "Payment marked paid but credits could not be added.",
            },
            { status: 500 },
          );
        }
      }

      console.log(
        "LIKHA Credits purchase completed:",
        {
          purchaseId: purchase.id,
          userId: purchase.user_id,
          credits: purchase.credits,
          amount: purchase.amount,
        },
      );
    }

    /*
     * --------------------------------------------------
     * RECORD WEBHOOK EVENT
     * --------------------------------------------------
     */

    const {
      error: eventInsertError,
    } = await adminSupabase
      .from("paymongo_webhook_events")
      .insert({
        event_id: eventId,
        event_type: eventType,
        livemode,
      });

    if (eventInsertError) {
      /*
       * 23505 = duplicate event.
       * Safe to ignore.
       */

      if (
        eventInsertError.code !==
        "23505"
      ) {
        console.error(
          "Unable to record webhook event:",
          eventInsertError,
        );

        return NextResponse.json(
          { received: false },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Credits PayMongo webhook error:",
      error,
    );

    return NextResponse.json(
      { received: false },
      { status: 500 },
    );
  }
}