import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const adminClient = createAdminClient();

  const { error: notificationError } =
    await adminClient
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "password_changed",
        title: "Password changed",
        message:
          "Your LIKHA account password was changed successfully. If you did not make this change, contact LIKHA Support immediately.",
        href: "/settings",
      });

  if (notificationError) {
    return NextResponse.json(
      {
        error: notificationError.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}