import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const payload =
      (await request.json()) as PayMongoEvent;

    const eventId =
      payload.data?.id ?? "";

    const eventType =
      payload.data?.attributes?.type ?? "";

    const livemode =
      payload.data?.attributes?.livemode ??
      false;

    if (!eventId || !eventType) {
      return NextResponse.json(
        { received: false },
        { status: 400 },
      );
    }

    /*
     * Idempotency:
     * Ignore an event we've already processed.
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
     * Only handle successful payments for now.
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

      /*
       * PayMongo payment events may expose
       * different reference fields depending
       * on the payment workflow.
       */
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
       * First try finding payment by
       * PayMongo payment id.
       */
      let paymentRecord = null;

      const {
        data: paymentById,
      } = await adminSupabase
        .from("order_payments")
        .select(
          `
            id,
            order_id,
            buyer_id,
            creator_id,
            amount,
            status
          `,
        )
        .eq(
          "paymongo_payment_id",
          paymentId,
        )
        .maybeSingle();

      paymentRecord = paymentById;

      /*
       * If we don't have the payment id yet,
       * fall back to our order reference.
       */
      if (
        !paymentRecord &&
        referenceNumber
      ) {
        const {
          data: paymentByReference,
        } = await adminSupabase
          .from("order_payments")
          .select(
            `
              id,
              order_id,
              buyer_id,
              creator_id,
              amount,
              status
            `,
          )
          .eq(
            "paymongo_reference_number",
            referenceNumber,
          )
          .maybeSingle();

        paymentRecord =
          paymentByReference;
      }

      if (!paymentRecord) {
        console.error(
          "No LIKHA payment record matched PayMongo payment:",
          paymentId,
        );

        return NextResponse.json(
          {
            received: false,
            reason:
              "Payment record not found.",
          },
          { status: 404 },
        );
      }

      /*
       * Verify amount.
       * PayMongo amount is in centavos.
       */
      const expectedAmount =
        Math.round(
          Number(paymentRecord.amount) *
            100,
        );

      if (
        typeof amount !== "number" ||
        amount !== expectedAmount
      ) {
        console.error(
          "Payment amount mismatch.",
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
       * Update LIKHA payment.
       */
      const paidAt =
        attributes?.paid_at
          ? new Date(
              attributes.paid_at * 1000,
            ).toISOString()
          : new Date().toISOString();

      const {
        error: paymentUpdateError,
      } = await adminSupabase
        .from("order_payments")
        .update({
          status: "paid",
          paymongo_payment_id:
            paymentId,
          paid_at: paidAt,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          paymentRecord.id,
        );

      if (paymentUpdateError) {
        console.error(
          "Unable to mark payment paid:",
          paymentUpdateError,
        );

        return NextResponse.json(
          { received: false },
          { status: 500 },
        );
      }

      /*
       * Notify both sides.
       */
      const {
        error: notificationError,
      } = await adminSupabase
        .from("notifications")
        .insert([
          {
            user_id:
              paymentRecord.buyer_id,
            type: "payment_paid",
            title:
              "Payment confirmed",
            message:
              "Your payment has been confirmed by LIKHA.",
            href: `/orders/${paymentRecord.order_id}`,
          },
          {
            user_id:
              paymentRecord.creator_id,
            type: "payment_received",
            title:
              "Order payment secured",
            message:
              "The buyer's payment has been confirmed. You may proceed with the order.",
            href: `/orders/${paymentRecord.order_id}`,
          },
        ]);

      if (notificationError) {
        console.error(
          "Payment notification error:",
          notificationError,
        );
      }
    }

    /*
     * Record event only after our
     * processing succeeds.
     */
    const {
      error: eventInsertError,
    } = await adminSupabase
      .from(
        "paymongo_webhook_events",
      )
      .insert({
        event_id: eventId,
        event_type: eventType,
        livemode,
      });

    if (eventInsertError) {
      /*
       * 23505 = already recorded.
       * That's safe/idempotent.
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
      "PayMongo webhook error:",
      error,
    );

    return NextResponse.json(
      { received: false },
      { status: 500 },
    );
  }
}