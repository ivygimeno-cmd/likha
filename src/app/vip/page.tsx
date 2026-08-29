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
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-10 lg:py-20">

        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b76449]">
            LIKHA VIP
          </p>

          <h1 className="mt-4 max-w-2xl font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Give your work a little more room to shine.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-[#173d32]/60">
            Get more visibility, feature your work, and enjoy
            priority benefits across the LIKHA community.
          </p>
        </div>

        {/* Main content */}
        <div className="mt-14 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-20">

          {/* Offer */}
          <section className="border-t border-[#173d32]/15 pt-7">

            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#173d32]/50">
                First-time VIP
              </p>

              <span className="rounded-full bg-[#b76449]/10 px-3 py-1 text-xs font-semibold text-[#b76449]">
                25% off
              </span>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="font-serif text-6xl font-semibold leading-none sm:text-7xl">
                ₱150
              </span>

              <span className="mb-1 text-sm text-[#173d32]/50">
                / first 30 days
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-[#173d32]/60">
              Regular VIP price is ₱200 every 30 days.
              Start your first 30 days at ₱150.
            </p>

            {/* First-time credit */}
            <div className="mt-9 border-y border-[#173d32]/10 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b76449]">
                Included with your first VIP
              </p>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-serif text-3xl">
                  50
                </span>

                <span className="text-sm text-[#173d32]/60">
                  LIKHA Credits
                </span>
              </div>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#173d32]/55">
                A one-time 50-credit bonus when you join VIP
                for the first time.
              </p>
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
              className="mt-8 w-full rounded-lg bg-[#173d32] px-6 py-4 font-semibold text-white transition hover:bg-[#245646] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[260px]"
            >
              {loading
                ? "Opening PayMongo..."
                : "Get VIP for ₱150"}
            </button>

            <p className="mt-4 max-w-md text-xs leading-5 text-[#173d32]/45">
              One-time payment. No automatic recurring charges.
            </p>
          </section>

          {/* Benefits */}
          <section className="border-t border-[#173d32]/15 pt-7">

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#173d32]/50">
              VIP benefits
            </p>

            <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">
              More ways to be seen.
            </h2>

            <div className="mt-8 divide-y divide-[#173d32]/10 border-y border-[#173d32]/10">

              <div className="flex gap-5 py-5">
                <span className="font-serif text-lg text-[#b76449]">
                  01
                </span>

                <div>
                  <p className="font-semibold">
                    Feature your portfolio projects
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                    Give your best work more visibility within
                    the LIKHA community.
                  </p>
                </div>
              </div>

              <div className="flex gap-5 py-5">
                <span className="font-serif text-lg text-[#b76449]">
                  02
                </span>

                <div>
                  <p className="font-semibold">
                    More portfolio slots
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                    Showcase more of the projects you want
                    people to discover.
                  </p>
                </div>
              </div>

              <div className="flex gap-5 py-5">
                <span className="font-serif text-lg text-[#b76449]">
                  03
                </span>

                <div>
                  <p className="font-semibold">
                    Priority visibility
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                    Get additional visibility across relevant
                    areas of LIKHA.
                  </p>
                </div>
              </div>

              <div className="flex gap-5 py-5">
                <span className="font-serif text-lg text-[#b76449]">
                  04
                </span>

                <div>
                  <p className="font-semibold">
                    VIP badge
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                    Let others know that you are part of the
                    LIKHA VIP community.
                  </p>
                </div>
              </div>

              <div className="flex gap-5 py-5">
                <span className="font-serif text-lg text-[#b76449]">
                  05
                </span>

                <div>
                  <p className="font-semibold">
                    Priority support
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                    Get priority assistance when you need
                    support.
                  </p>
                </div>
              </div>

              <div className="flex gap-5 py-5">
                <span className="font-serif text-lg text-[#b76449]">
                  06
                </span>

                <div>
                  <p className="font-semibold">
                    Featured project rotation
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                    Give your selected projects opportunities
                    to be featured within LIKHA.
                  </p>
                </div>
              </div>

            </div>

            {/* Renewal */}
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#173d32]/50">
                After your first 30 days
              </p>

              <p className="mt-3 text-sm leading-7 text-[#173d32]/60">
                Renew for{" "}
                <strong className="font-semibold text-[#173d32]">
                  ₱200 every 30 days
                </strong>{" "}
                and keep the same VIP benefits.
              </p>
            </div>
          </section>
        </div>

        {/* Back */}
        <div className="mt-14 border-t border-[#173d32]/10 pt-6">
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