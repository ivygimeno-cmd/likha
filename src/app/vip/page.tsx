"use client";

import { useState } from "react";
import Link from "next/link";

export default function VipPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleUpgrade() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/vip/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentType: "initial",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data?.error ?? "Unable to start VIP checkout.",
        );
        setLoading(false);
        return;
      }

      if (!data?.checkoutUrl) {
        setErrorMessage(
          "PayMongo did not return a checkout URL.",
        );
        setLoading(false);
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setErrorMessage(
        "Something went wrong while starting checkout.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
            LIKHA VIP
          </p>

          <h1 className="mt-3 font-serif text-5xl font-semibold">
            Stand out on LIKHA.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#173d32]/65">
            Get more visibility, feature your work, and enjoy
            priority benefits across the LIKHA community.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-8 shadow-sm">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#173d32]/45">
              First-time VIP
            </p>

            <div className="mt-3 flex items-end justify-center gap-2">
              <span className="font-serif text-6xl font-semibold">
                ₱100
              </span>

              <span className="mb-2 text-sm text-[#173d32]/50">
                / 30 days
              </span>
            </div>

            <p className="mt-3 text-sm text-[#173d32]/55">
              Introductory price for your first VIP membership.
            </p>
          </div>

          <div className="my-8 border-t border-[#173d32]/10" />

          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="font-semibold text-[#b76449]">✓</span>
              <p className="text-sm">
                Feature your portfolio projects
              </p>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-[#b76449]">✓</span>
              <p className="text-sm">
                More portfolio slots
              </p>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-[#b76449]">✓</span>
              <p className="text-sm">
                Priority visibility
              </p>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-[#b76449]">✓</span>
              <p className="text-sm">
                VIP badge and priority support
              </p>
            </div>

            <div className="flex gap-3">
              <span className="font-semibold text-[#b76449]">✓</span>
              <p className="text-sm">
                Featured project rotation
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading}
            className="mt-8 w-full rounded-lg bg-[#173d32] px-6 py-4 font-semibold text-white transition hover:bg-[#245646] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Opening PayMongo..."
              : "Upgrade to VIP — ₱100"}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-[#173d32]/45">
            One-time payment. No automatic recurring charges.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-md text-center">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-[#b76449] transition hover:text-[#9f503c]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}