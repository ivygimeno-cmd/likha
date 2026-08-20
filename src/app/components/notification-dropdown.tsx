"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type NotificationDropdownProps = {
  children: ReactNode;
};

export default function NotificationDropdown({
  children,
}: NotificationDropdownProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const details = detailsRef.current;

      if (
        details?.open &&
        !details.contains(event.target as Node)
      ) {
        details.open = false;
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
    };
  }, []);

  return (
    <details
      ref={detailsRef}
      className="relative"
    >
      {children}
    </details>
  );
}