import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{
    verificationSessionId?: string;
    status?: string;
  }>;
};

type DiditFeatureResult = {
  status?: string;
};

type DiditDecision = {
  session_id?: string;
  session_kind?: string;
  status?: string;
  workflow_id?: string;
  vendor_data?: string;

  id_verifications?:
    | DiditFeatureResult[]
    | null;

  liveness_checks?:
    | DiditFeatureResult[]
    | null;

  face_matches?:
    | DiditFeatureResult[]
    | null;

  detail?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isApproved(status?: string) {
  return (
    status?.trim().toUpperCase() ===
    "APPROVED"
  );
}

function hasApprovedResult(
  results?: DiditFeatureResult[] | null,
) {
  return (
    Array.isArray(results) &&
    results.some((result) =>
      isApproved(result.status),
    )
  );
}

export default async function VerificationCompletePage({
  searchParams,
}: PageProps) {
  const parameters = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sessionId =
    parameters.verificationSessionId;

  let pageStatus:
    | "verified"
    | "pending"
    | "failed" = "failed";

  let message =
    "Hindi ma-confirm ang verification session.";

  if (
    sessionId &&
    UUID_PATTERN.test(sessionId)
  ) {
    const apiKey = process.env.DIDIT_API_KEY;
    const workflowId =
      process.env.DIDIT_WORKFLOW_ID;

    if (apiKey && workflowId) {
      try {
        const response = await fetch(
          `https://verification.didit.me/v3/session/${encodeURIComponent(
            sessionId,
          )}/decision/`,
          {
            headers: {
              "x-api-key": apiKey,
            },
            cache: "no-store",
          },
        );

        const decision =
          (await response.json()) as DiditDecision;

        if (!response.ok) {
          console.error(
            "Didit decision request failed:",
            response.status,
            decision.detail,
          );

          message =
            "Hindi pa makuha ang verification result. Subukan ulit mamaya.";
        } else if (
          decision.session_id !== sessionId ||
          decision.session_kind !== "user" ||
          decision.vendor_data !== user.id ||
          decision.workflow_id !== workflowId
        ) {
          console.error(
            "Didit verification ownership validation failed.",
          );

          message =
            "Hindi tugma ang verification session sa iyong LIKHA account.";
        } else {
          const overallApproved =
            isApproved(decision.status);

          const idApproved =
            hasApprovedResult(
              decision.id_verifications,
            );

          const livenessApproved =
            hasApprovedResult(
              decision.liveness_checks,
            );

          const faceMatchApproved =
            hasApprovedResult(
              decision.face_matches,
            );

          if (
            overallApproved &&
            idApproved &&
            livenessApproved &&
            faceMatchApproved
          ) {
            const admin =
              createAdminClient();

            const now =
              new Date().toISOString();

            const { error: updateError } =
              await admin
                .from(
                  "identity_verifications",
                )
                .upsert(
                  {
                    user_id: user.id,
                    status: "verified",
                    provider: "didit",
                    provider_reference:
                      sessionId,
                    verification_level:
                      "id_selfie_liveness",
                    submitted_at: now,
                    verified_at: now,
                    expires_at: null,
                  },
                  {
                    onConflict: "user_id",
                  },
                );

            if (updateError) {
              console.error(
                "Identity badge update failed:",
                updateError,
              );

              message =
                "Verified ang result pero hindi pa ma-update ang LIKHA badge. Makipag-ugnayan sa support.";
            } else {
              pageStatus = "verified";

              message =
                "Confirmed na ang iyong government ID, selfie, at liveness check.";
            }
          } else {
            const normalizedStatus =
              decision.status
                ?.trim()
                .toUpperCase();

            if (
              normalizedStatus ===
                "IN REVIEW" ||
              normalizedStatus ===
                "IN_REVIEW" ||
              normalizedStatus ===
                "IN PROGRESS" ||
              normalizedStatus ===
                "IN_PROGRESS" ||
              normalizedStatus ===
                "RESUBMITTED"
            ) {
              pageStatus = "pending";

              message =
                "Sinusuri pa ang iyong verification. Hindi mo kailangang magsumite ulit.";
            } else {
              pageStatus = "failed";

              message =
                "Hindi nakumpleto o hindi na-approve ang lahat ng identity checks. Maaari mong subukan ulit.";
            }
          }
        }
      } catch (error) {
        console.error(
          "Verification completion error:",
          error,
        );

        message =
          "Hindi makakonekta sa verification service ngayon.";
      }
    } else {
      message =
        "Hindi pa kumpleto ang verification server configuration.";
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f0e6] px-6 py-12 text-[#173d32]">
      <section className="w-full max-w-xl rounded-3xl border border-[#173d32]/15 bg-[#fbf8f1] p-8 text-center shadow-sm sm:p-12">
        {pageStatus === "verified" ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-[#173d32] px-4 py-2 text-sm font-semibold text-white">
            <span aria-hidden="true">✓</span>
            Identity Verified
          </span>
        ) : pageStatus === "pending" ? (
          <span className="inline-flex rounded-full border border-[#173d32]/20 bg-[#f5f0e6] px-4 py-2 text-sm font-semibold">
            Verification Pending
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-[#b76449]/40 bg-[#b76449]/10 px-4 py-2 text-sm font-semibold text-[#9f503c]">
            Verification Not Completed
          </span>
        )}

        <h1 className="mt-7 font-serif text-4xl font-semibold">
          {pageStatus === "verified"
            ? "Salamat sa pagpapatunay."
            : pageStatus === "pending"
              ? "Sinusuri pa ang iyong details."
              : "Hindi pa verified ang identity."}
        </h1>

        <p className="mt-5 leading-7 text-[#173d32]/65">
          {message}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/profile/${user.id}`}
            className="rounded-lg bg-[#173d32] px-6 py-3 font-semibold text-white transition hover:bg-[#b76449]"
          >
            Bumalik sa Profile
          </Link>

          {pageStatus === "failed" && (
            <Link
              href="/verification"
              className="rounded-lg border border-[#173d32]/20 px-6 py-3 font-semibold transition hover:border-[#b76449] hover:text-[#b76449]"
            >
              Subukan Ulit
            </Link>
          )}
        </div>

        <p className="mt-8 text-xs leading-5 text-[#173d32]/45">
          Hindi sine-save ng LIKHA ang iyong ID
          image o selfie. Verification status at
          provider reference lamang ang itinatala.
        </p>
      </section>
    </main>
  );
}