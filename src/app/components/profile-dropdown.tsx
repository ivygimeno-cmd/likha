"use client";

import { useEffect, useRef } from "react";

type ProfileDropdownProps = {
  children: React.ReactNode;
};

export default function ProfileDropdown({
  children,
}: ProfileDropdownProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        detailsRef.current &&
        !detailsRef.current.contains(target)
      ) {
        detailsRef.current.removeAttribute("open");
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
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