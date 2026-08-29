import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PushSubscriptionPayload = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

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

    const body =
      (await request.json()) as {
        subscription?: PushSubscriptionPayload;
      };

    const subscription = body.subscription;

    if (
      !subscription?.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return NextResponse.json(
        { error: "Invalid push subscription." },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        },
      );

    if (error) {
      console.error(
        "Failed to save push subscription:",
        error,
      );

      return NextResponse.json(
        { error: "Failed to save push subscription." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Push subscription error:",
      error,
    );

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}