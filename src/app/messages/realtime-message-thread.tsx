"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type RealtimeMessageThreadProps = {
  orderId: string;
  latestMessageId: string | null;
  children: ReactNode;
};

export default function RealtimeMessageThread({
  orderId,
  latestMessageId,
  children,
}: RealtimeMessageThreadProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldStayAtBottom = useRef(true);

  useEffect(() => {
    shouldStayAtBottom.current = true;

    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;

      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [orderId]);

  useEffect(() => {
    if (!shouldStayAtBottom.current) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;

      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [latestMessageId]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`order-messages-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_messages",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          const container = containerRef.current;

          if (container) {
            const distanceFromBottom =
              container.scrollHeight -
              container.scrollTop -
              container.clientHeight;

            shouldStayAtBottom.current =
              distanceFromBottom < 120;
          }

          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orderId, router]);

  function handleScroll() {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    shouldStayAtBottom.current = distanceFromBottom < 120;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[55vh] min-h-[320px] max-h-[560px] flex-none scroll-smooth overflow-y-auto overscroll-contain bg-[#f7f2e9] px-6 py-6"
    >
      {children}
    </div>
  );
}