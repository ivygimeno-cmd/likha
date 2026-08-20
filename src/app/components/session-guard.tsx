"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/email-change-complete",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(`${path}/`),
  );
}

export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  useEffect(() => {
    if (isPublicPath(pathname)) {
      return;
    }

    let cancelled = false;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || cancelled) {
        return;
      }

      const { data, error } = await supabase.rpc(
        "is_my_current_session_active",
      );

      if (cancelled) {
        return;
      }

      if (error) {
        console.error(
          "Session guard error:",
          error.message,
        );
        return;
      }

      if (data !== true) {
        await supabase.auth.signOut({
          scope: "local",
        });

        router.replace(
          "/login?session_revoked=1",
        );

        router.refresh();
      }
    }

    void checkSession();

    const interval = window.setInterval(
      checkSession,
      5000,
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pathname, router, supabase]);

  return null;
}