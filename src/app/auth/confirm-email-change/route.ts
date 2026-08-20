import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const tokenHash =
    requestUrl.searchParams.get("token_hash");

  const type =
    requestUrl.searchParams.get("type");

  const next =
    requestUrl.searchParams.get("next") ??
    "/email-change-complete";

  if (!tokenHash || type !== "email_change") {
    return NextResponse.redirect(
      new URL(
        "/email-change-complete?error=invalid_link",
        requestUrl.origin,
      ),
    );
  }

  const supabase = await createClient();

  const {
    data,
    error: verifyError,
  } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email_change",
  });

  if (verifyError || !data.user) {
    return NextResponse.redirect(
      new URL(
        `/email-change-complete?error=${encodeURIComponent(
          verifyError?.message ?? "Verification failed",
        )}`,
        requestUrl.origin,
      ),
    );
  }

  const newEmail =
    data.user.email?.trim().toLowerCase();

  if (!newEmail) {
    return NextResponse.redirect(
      new URL(
        "/email-change-complete?error=email_not_updated",
        requestUrl.origin,
      ),
    );
  }

  const adminClient = createAdminClient();

  const {
    data: changeRequest,
    error: requestError,
  } = await adminClient
    .from("account_change_requests")
    .select(
      "id, requested_value, status",
    )
    .eq("user_id", data.user.id)
    .eq("request_type", "email")
    .eq("status", "awaiting_verification")
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (requestError) {
    return NextResponse.redirect(
      new URL(
        `/email-change-complete?error=${encodeURIComponent(
          requestError.message,
        )}`,
        requestUrl.origin,
      ),
    );
  }

  if (
    changeRequest &&
    changeRequest.requested_value
      .trim()
      .toLowerCase() === newEmail
  ) {
    const now = new Date().toISOString();

    await adminClient
      .from("account_change_requests")
      .update({
        status: "approved",
        updated_at: now,
      })
      .eq("id", changeRequest.id);

    await adminClient
      .from("notifications")
      .insert({
        user_id: data.user.id,
        type: "email_change_completed",
        title: "Email address updated",
        message:
          "Your email address has been successfully changed. Use your new email the next time you sign in to LIKHA.",
        href: "/login",
      });
  }

  /*
   * Global sign out:
   * revoke the user's refresh sessions.
   */
  await supabase.auth.signOut({
    scope: "global",
  });

  const destination = new URL(
    next,
    requestUrl.origin,
  );

  destination.searchParams.set(
    "email",
    newEmail,
  );

  return NextResponse.redirect(destination);
}