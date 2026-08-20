import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://psgc.cloud/api/v2/provinces",
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      },
    );

    const text = await response.text();

    if (!response.ok) {
      console.error(
        "PSGC provinces error:",
        response.status,
        text,
      );

      return NextResponse.json(
        {
          error: "Failed to load provinces",
          status: response.status,
          details: text,
        },
        { status: 500 },
      );
    }

    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error) {
    console.error("PSGC provinces fetch failed:", error);

    return NextResponse.json(
      {
        error: "PSGC request failed",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}