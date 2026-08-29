"use client";

import Link from "next/link";
import { useState } from "react";

type SupportChatProps = {
  isVip: boolean;
};

export default function SupportChat({
  isVip,
}: SupportChatProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-[#173d32] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#245646]"
        >
          Talk to Support
        </button>
      )}

      {open && (
        <>
          {/* Click outside to close */}
          <button
            type="button"
            aria-label="Isara ang support chat"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[59] cursor-default bg-transparent"
          />

          {/* Chat panel */}
          <div className="fixed bottom-6 right-6 z-[60] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#173d32] px-5 py-4 text-white">
              <div>
                <p className="font-semibold">
                  LIKHA Support
                </p>

                <p className="mt-0.5 text-xs text-white/60">
                  {isVip
                    ? "Priority Support"
                    : "Support"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Isara ang support chat"
                className="text-xl text-white/60 transition hover:text-white"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {isVip ? (
                <>
                  <p className="text-sm leading-6 text-[#173d32]/70">
                    Kumusta! Paano ka namin matutulungan?
                  </p>

                  <Link
                    href="/support/new"
                    onClick={() => setOpen(false)}
                    className="mt-5 block w-full rounded-lg bg-[#b76449] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#9f503c]"
                  >
                    Makipag-chat sa Support
                  </Link>

                  <p className="mt-3 text-center text-xs leading-5 text-[#173d32]/45">
                    Bilang VIP member, may access ka
                    sa Priority Support.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">
                    Priority Support ay para sa
                    LIKHA VIP members.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#173d32]/60">
                    Mag-upgrade sa VIP para magkaroon
                    ng priority access sa aming support.
                  </p>

                  <Link
                    href="/vip"
                    onClick={() => setOpen(false)}
                    className="mt-5 block w-full rounded-lg bg-[#173d32] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#245646]"
                  >
                    Mag-upgrade sa VIP
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}