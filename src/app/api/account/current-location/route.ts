import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SessionRow = {
  session_id: string;
  ip: string | null;
  is_current: boolean;
};

type GeoResponse = {
  success?: boolean;
  city?: string;
  region?: string;
  country?: string;
};

type JwtPayload = {
  session_id?: string;
};

function readJwtPayload(
  accessToken: string,
): JwtPayload | null {
  try {
    const [, payload] = accessToken.split(".");

    if (!payload) {
      return null;
    }

    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = Buffer.from(
      normalized,
      "base64",
    ).toString("utf8");

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = await createClient();

  /*
   * First verify that the browser really has
   * an authenticated Supabase user.
   */
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

  /*
   * After getUser() has verified the authenticated
   * user, read this browser's current session.
   */
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (
    sessionError ||
    !session?.access_token
  ) {
    return NextResponse.json({
      city: null,
      region: null,
      country: null,
    });
  }

  /*
   * session_id is a standard Supabase JWT claim.
   * It corresponds directly to auth.sessions.id.
   */
  const payload = readJwtPayload(
    session.access_token,
  );

  const sessionId =
    payload?.session_id ?? null;

  if (!sessionId) {
    return NextResponse.json({
      city: null,
      region: null,
      country: null,
    });
  }

  /*
   * Your RPC accepts the actual current session ID
   * and returns only this user's sessions.
   */
  const {
    data,
    error: sessionsError,
  } = await supabase.rpc(
    "get_my_sessions",
    {
      current_session_id: sessionId,
    },
  );

  if (sessionsError) {
    return NextResponse.json(
      {
        error: sessionsError.message,
      },
      { status: 500 },
    );
  }

  const sessions =
    (data ?? []) as SessionRow[];

  const currentSession =
    sessions.find(
      (item) => item.is_current,
    );

  const ip = currentSession?.ip;

  if (!ip) {
    return NextResponse.json({
      city: null,
      region: null,
      country: null,
    });
  }

  /*
   * Convert the session IP into an approximate
   * city / region / country.
   *
   * Raw IP is NOT returned to the normal user.
   */
  try {
    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(
        "Location lookup failed.",
      );
    }

    const geo =
      (await response.json()) as GeoResponse;

    if (geo.success === false) {
      throw new Error(
        "Location unavailable.",
      );
    }

    return NextResponse.json({
      city: geo.city ?? null,
      region: geo.region ?? null,
      country: geo.country ?? null,
    });
  } catch {
    return NextResponse.json({
      city: null,
      region: null,
      country: null,
    });
  }
}