import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type StartVerificationRequest = {
  consentAccepted?: boolean;
};

type DiditSessionResponse = {
  session_id?: string;
  url?: string;
  detail?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Kailangan mong mag-sign in.",
      },
      {
        status: 401,
      },
    );
  }

  let requestBody: StartVerificationRequest;

  try {
    requestBody =
      (await request.json()) as StartVerificationRequest;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request.",
      },
      {
        status: 400,
      },
    );
  }

  if (requestBody.consentAccepted !== true) {
    return NextResponse.json(
      {
        error:
          "Kailangan muna ang iyong pahintulot bago simulan ang verification.",
      },
      {
        status: 400,
      },
    );
  }

  const apiKey = process.env.DIDIT_API_KEY;
  const workflowId =
    process.env.DIDIT_WORKFLOW_ID;

  if (!apiKey || !workflowId) {
    return NextResponse.json(
      {
        error:
          "Hindi pa kumpleto ang Didit server configuration.",
      },
      {
        status: 500,
      },
    );
  }

  const { error: consentError } =
    await supabase.rpc(
      "record_my_identity_verification_consent",
      {
        p_consent_version: "1.0",
      },
    );

  if (consentError) {
    console.error(
      "Verification consent recording failed:",
      consentError,
    );

    return NextResponse.json(
      {
        error:
          "Hindi ma-record ang verification consent.",
      },
      {
        status: 500,
      },
    );
  }

  const callbackUrl = new URL(
    "/verification/complete",
    request.url,
  ).toString();

  try {
    const response = await fetch(
      "https://verification.didit.me/v3/session/",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },

        body: JSON.stringify({
          workflow_id: workflowId,
          callback: callbackUrl,
          vendor_data: user.id,

          metadata: {
            source: "likha_profile",
            verification_level:
              "id_selfie_liveness",
            consent_version: "1.0",
          },

          language: "en",

          expected_details: {
            expected_document_types: [
              "P",
              "ID",
              "DL",
            ],
          },
        }),

        cache: "no-store",
      },
    );

    const session =
      (await response.json()) as DiditSessionResponse;

    if (!response.ok) {
      console.error(
        "Didit session creation failed:",
        response.status,
        session.detail,
      );

      return NextResponse.json(
        {
          error:
            "Hindi makapagsimula ng verification ngayon. Subukan ulit mamaya.",
        },
        {
          status: response.status,
        },
      );
    }

    if (
      !session.url ||
      !session.url.startsWith(
        "https://verify.didit.me/",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid verification session response.",
        },
        {
          status: 502,
        },
      );
    }

    return NextResponse.json({
      verificationUrl: session.url,
    });
  } catch (error) {
    console.error(
      "Didit verification connection error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Hindi makakonekta sa verification service.",
      },
      {
        status: 502,
      },
    );
  }
}