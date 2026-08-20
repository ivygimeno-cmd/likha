import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      cityCode: string;
    }>;
  },
) {
  const { cityCode } = await context.params;

  const response = await fetch(
    `https://psgc.cloud/api/v2/cities-municipalities/${cityCode}/barangays`,
    {
      cache: "force-cache",
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to load barangays" },
      { status: response.status },
    );
  }

  const data = await response.json();

  return NextResponse.json(data);
}