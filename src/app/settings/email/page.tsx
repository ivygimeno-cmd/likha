import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type EmailChangeRequest = {
  id: string;
  requested_value: string;
  reason: string;
  status: "pending" | "awaiting_verification";
  created_at: string;
};

export default async function EmailSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    submitted?: string;
    verify?: string;
    changed?: string;
    verification?: string;
  }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: emailChangeRequestData,
    error: emailChangeRequestError,
  } = await supabase
    .from("account_change_requests")
    .select(
      "id, requested_value, reason, status, created_at",
    )
    .eq("user_id", user.id)
    .eq("request_type", "email")
    .in("status", [
      "pending",
      "awaiting_verification",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (emailChangeRequestError) {
    throw new Error(
      `Hindi makuha ang email change request: ${emailChangeRequestError.message}`,
    );
  }

  const emailChangeRequest =
    emailChangeRequestData as EmailChangeRequest | null;

  /*
   * If Supabase already confirmed the new Auth email,
   * complete the LIKHA request automatically.
   */
  if (
    emailChangeRequest?.status ===
      "awaiting_verification" &&
    user.email?.trim().toLowerCase() ===
      emailChangeRequest.requested_value
        .trim()
        .toLowerCase()
  ) {
    const adminClient = createAdminClient();

    const now = new Date().toISOString();

    const { error: completeError } = await adminClient
      .from("account_change_requests")
      .update({
        status: "approved",
        updated_at: now,
      })
      .eq("id", emailChangeRequest.id)
      .eq("user_id", user.id)
      .eq("status", "awaiting_verification");

    if (completeError) {
      throw new Error(
        `Confirmed na ang email pero hindi ma-complete ang request: ${completeError.message}`,
      );
    }

    /*
     * Optional success notification.
     */
    await adminClient.from("notifications").insert({
      user_id: user.id,
      type: "email_change_completed",
      title: "Email address updated",
      message:
        "Your new email address has been confirmed. Use it the next time you sign in to LIKHA.",
      href: "/settings/email?changed=1",
    });

    redirect("/settings/email?changed=1");
  }

  async function submitEmailChangeRequest(
    formData: FormData,
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const requestedEmail = String(
      formData.get("requestedEmail") ?? "",
    )
      .trim()
      .toLowerCase();

    const reason = String(
      formData.get("reason") ?? "",
    ).trim();

    if (
      !requestedEmail ||
      !requestedEmail.includes("@")
    ) {
      throw new Error("Invalid email address.");
    }

    if (
      requestedEmail ===
      user.email?.trim().toLowerCase()
    ) {
      throw new Error(
        "The requested email is already your current email.",
      );
    }

    if (reason.length < 3) {
      throw new Error(
        "Please provide a reason for changing your email.",
      );
    }

    const {
      data: existingRequest,
      error: existingRequestError,
    } = await supabase
      .from("account_change_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("request_type", "email")
      .in("status", [
        "pending",
        "awaiting_verification",
      ])
      .limit(1)
      .maybeSingle();

    if (existingRequestError) {
      throw new Error(
        `Hindi ma-check ang existing request: ${existingRequestError.message}`,
      );
    }

    if (existingRequest) {
      throw new Error(
        "You already have an active email change request.",
      );
    }

    const { error } = await supabase
      .from("account_change_requests")
      .insert({
        user_id: user.id,
        request_type: "email",
        current_value: user.email ?? null,
        requested_value: requestedEmail,
        reason,
        status: "pending",
      });

    if (error) {
      throw new Error(
        `Hindi ma-submit ang email change request: ${error.message}`,
      );
    }

    redirect("/settings/email?submitted=1");
  }

  async function startEmailVerification(
    formData: FormData,
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const requestId = String(
      formData.get("requestId") ?? "",
    );

    if (!requestId) {
      throw new Error("Missing request ID.");
    }

    const {
      data: request,
      error: requestError,
    } = await supabase
      .from("account_change_requests")
      .select(
        "id, user_id, requested_value, request_type, status",
      )
      .eq("id", requestId)
      .eq("user_id", user.id)
      .eq("request_type", "email")
      .eq("status", "awaiting_verification")
      .single();

    if (requestError || !request) {
      throw new Error(
        `Hindi makuha ang approved email request: ${
          requestError?.message ??
          "Request not found."
        }`,
      );
    }

    const requestedEmail =
      request.requested_value.trim().toLowerCase();

    const currentEmail =
      user.email?.trim().toLowerCase() ?? "";

    /*
     * If confirmation already completed before the
     * user returned to this page, finish the request.
     */
    if (currentEmail === requestedEmail) {
      const adminClient = createAdminClient();

      const { error: completeError } =
        await adminClient
          .from("account_change_requests")
          .update({
            status: "approved",
            updated_at: new Date().toISOString(),
          })
          .eq("id", request.id)
          .eq("user_id", user.id)
          .eq("status", "awaiting_verification");

      if (completeError) {
        throw new Error(
          `Hindi ma-complete ang email request: ${completeError.message}`,
        );
      }

      redirect("/settings/email?changed=1");
    }

    /*
     * Starts Supabase's own email-change confirmation
     * flow. The Change Email Address template uses
     * {{ .ConfirmationURL }}.
     */
    const {
      error: emailChangeError,
    } = await supabase.auth.updateUser({
      email: requestedEmail,
    });

    if (emailChangeError) {
      throw new Error(
        `Hindi ma-send ang confirmation email: ${emailChangeError.message}`,
      );
    }

    redirect(
      "/settings/email?verification=sent#email-verification",
    );
  }

  async function resendEmailVerification(
    formData: FormData,
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const requestId = String(
      formData.get("requestId") ?? "",
    );

    if (!requestId) {
      throw new Error("Missing request ID.");
    }

    const {
      data: request,
      error: requestError,
    } = await supabase
      .from("account_change_requests")
      .select(
        "id, user_id, requested_value, request_type, status",
      )
      .eq("id", requestId)
      .eq("user_id", user.id)
      .eq("request_type", "email")
      .eq("status", "awaiting_verification")
      .single();

    if (requestError || !request) {
      throw new Error(
        `Hindi makuha ang email change request: ${
          requestError?.message ??
          "Request not found."
        }`,
      );
    }

    const requestedEmail =
      request.requested_value.trim().toLowerCase();

    const { error: resendError } =
      await supabase.auth.resend({
        type: "email_change",
        email: requestedEmail,
      });

    if (resendError) {
      throw new Error(
        `Hindi ma-resend ang confirmation email: ${resendError.message}`,
      );
    }

    redirect(
      "/settings/email?verification=sent#email-verification",
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/10 px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/settings"
            className="font-serif text-3xl tracking-[0.22em]"
          >
            LIKHA
          </Link>

          <Link
            href="/settings"
            className="text-sm font-medium transition hover:text-[#b76449]"
          >
             Settings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-14 sm:px-10 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b76449]">
          Account
        </p>

        <h1 className="mt-4 font-serif text-5xl font-normal">
          Email address
        </h1>

        <p className="mt-5 max-w-2xl leading-7 text-[#173d32]/55">
          Para sa seguridad ng iyong account, ang email
          address ay hindi direktang napapalitan.
          Mag-submit ng request at rerepasuhin ito ng
          LIKHA Admin.
        </p>

        <section className="mt-10 rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
          {params.changed === "1" && (
            <div className="mb-7 rounded-2xl border border-green-700/20 bg-green-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
                Email confirmed
              </p>

              <p className="mt-2 text-sm leading-6 text-[#173d32]/65">
                Your email address has been successfully
                changed. This is now the email you will use
                to sign in to your LIKHA account.
              </p>
            </div>
          )}

          {params.submitted === "1" && (
            <div className="mb-7 rounded-2xl border border-[#b76449]/20 bg-[#b76449]/5 p-5">
              <p className="text-sm font-medium text-[#173d32]">
                Request submitted
              </p>

              <p className="mt-2 text-sm leading-6 text-[#173d32]/55">
                Your email change request has been sent to
                the LIKHA Admin for review.
              </p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#173d32]/45">
              Current email
            </p>

            <p className="mt-2 text-lg">
              {user.email ?? "No email"}
            </p>
          </div>

          {emailChangeRequest ? (
            <div className="mt-8 rounded-2xl border border-[#b76449]/20 bg-[#b76449]/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b76449]">
                {emailChangeRequest.status ===
                "awaiting_verification"
                  ? "Approved — confirmation required"
                  : "Pending review"}
              </p>

              <p className="mt-3 text-sm text-[#173d32]/55">
                Requested email
              </p>

              <p className="mt-1 font-medium">
                {emailChangeRequest.requested_value}
              </p>

              <p className="mt-4 text-sm text-[#173d32]/55">
                Reason
              </p>

              <p className="mt-1 leading-6">
                {emailChangeRequest.reason}
              </p>

              <p className="mt-4 text-xs text-[#173d32]/40">
                Submitted{" "}
                {new Date(
                  emailChangeRequest.created_at,
                ).toLocaleString("en-PH", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>

              {emailChangeRequest.status ===
                "awaiting_verification" && (
                <div
                  id="email-verification"
                  className={`mt-6 border-t border-[#173d32]/10 pt-6 ${
                    params.verify === "1"
                      ? "scroll-mt-8"
                      : ""
                  }`}
                >
                  <p className="text-sm font-medium">
                    Confirm your new email
                  </p>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#173d32]/55">
                    Your request has been approved. We need
                    to confirm that you have access to your
                    new email address before LIKHA changes
                    your login email.
                  </p>

                  {params.verification === "sent" ? (
                    <>
                      <div className="mt-5 rounded-xl border border-[#173d32]/10 bg-white/60 p-4">
                        <p className="text-sm font-medium text-[#173d32]">
                          Confirmation email sent
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[#173d32]/55">
                          Open{" "}
                          <span className="font-medium text-[#173d32]">
                            {
                              emailChangeRequest.requested_value
                            }
                          </span>{" "}
                          and click “Confirm new email ”.
                          After confirmation, return to this
                          page.
                        </p>
                      </div>

                      <form
                        action={resendEmailVerification}
                        className="mt-4"
                      >
                        <input
                          type="hidden"
                          name="requestId"
                          value={emailChangeRequest.id}
                        />

                        <button
                          type="submit"
                          className="rounded-xl border border-[#173d32] px-5 py-3 text-sm font-medium text-[#173d32] transition hover:bg-[#173d32] hover:text-white"
                        >
                          Resend confirmation email
                        </button>
                      </form>
                    </>
                  ) : (
                    <form
                      action={startEmailVerification}
                      className="mt-5"
                    >
                      <input
                        type="hidden"
                        name="requestId"
                        value={emailChangeRequest.id}
                      />

                      <button
                        type="submit"
                        className="rounded-xl bg-[#173d32] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#245646]"
                      >
                        Send confirmation email
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form
              action={submitEmailChangeRequest}
              className="mt-8 space-y-6"
            >
              <div>
                <label
                  htmlFor="requestedEmail"
                  className="mb-2 block text-sm font-medium"
                >
                  New email address
                </label>

                <input
                  id="requestedEmail"
                  name="requestedEmail"
                  type="email"
                  required
                  placeholder="new@email.com"
                  className="w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 outline-none transition focus:border-[#b76449]"
                />
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="mb-2 block text-sm font-medium"
                >
                  Reason for changing
                </label>

                <textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  required
                  minLength={3}
                  placeholder="Halimbawa: Wala na akong access sa lumang email."
                  className="w-full resize-y rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 leading-7 outline-none transition focus:border-[#b76449]"
                />
              </div>

              <div className="border-t border-[#173d32]/10 pt-6">
                <button
                  type="submit"
                  className="rounded-xl bg-[#173d32] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#245646]"
                >
                  Submit change request
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}