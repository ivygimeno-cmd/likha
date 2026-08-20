import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const testBundles = {
  starter: {
    credits: 50,
    description: "Starter test credit bundle",
  },
  creator: {
    credits: 120,
    description: "Creator test credit bundle",
  },
  studio: {
    credits: 300,
    description: "Studio test credit bundle",
  },
} as const;

type TestBundleCode = keyof typeof testBundles;

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        error:
          "Test credit purchases are disabled outside local development.",
      },
      {
        status: 403,
      },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Mag-sign in ulit bago bumili ng test credits.",
      },
      {
        status: 401,
      },
    );
  }

  const body = (await request
    .json()
    .catch(() => null)) as {
    bundleCode?: unknown;
  } | null;

  const bundleCode = body?.bundleCode;

  if (
    typeof bundleCode !== "string" ||
    !(bundleCode in testBundles)
  ) {
    return NextResponse.json(
      {
        error: "Invalid credit bundle.",
      },
      {
        status: 400,
      },
    );
  }

  const selectedBundle =
    testBundles[bundleCode as TestBundleCode];

  const admin = createAdminClient();

  const { error: insertError } = await admin
    .from("likha_credit_ledger")
    .insert({
      user_id: user.id,
      amount: selectedBundle.credits,
      entry_type: "admin_test",
      entry_key: [
        "admin_test",
        user.id,
        bundleCode,
        crypto.randomUUID(),
      ].join(":"),
      reference_id: bundleCode,
      description: selectedBundle.description,
    });

  if (insertError) {
    return NextResponse.json(
      {
        error: insertError.message,
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    success: true,
    creditsAdded: selectedBundle.credits,
  });
}