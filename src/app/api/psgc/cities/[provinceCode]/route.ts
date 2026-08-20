import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      provinceCode: string;
    }>;
  },
) {
  const { provinceCode } = await context.params;

  const response = await fetch(
    `https://psgc.cloud/api/v2/provinces/${provinceCode}/cities-municipalities`,
    {
      cache: "force-cache",
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to load cities and municipalities" },
      { status: response.status },
    );
  }

  const data = await response.json();

  return NextResponse.json(data);
}