"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RefundRealtimeRefresh({
  orderId,
}: {
  orderId: string;
}) {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  useEffect(() => {
    const channel = supabase
      .channel(`refund-order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "refund_requests",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orderId, router, supabase]);

  return null;
}