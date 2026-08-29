"use client";

import { useState } from "react";
import Link from "next/link";

function BotanicalLeaves() {
  return (
    <>
      {/* Top-right botanical leaves */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 hidden overflow-hidden lg:block"
      >
        <svg
          width="430"
          height="500"
          viewBox="0 0 430 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-[0.13]"
        >
          <path
            d="M430 20C355 35 287 82 263 154C238 229 280 302 351 329C397 347 426 344 430 344V20Z"
            fill="#173D32"
          />

          <path
            d="M430 20C355 35 287 82 263 154C238 229 280 302 351 329"
            stroke="#173D32"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M428 69C383 104 349 143 325 191"
            stroke="#F5F0E6"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M428 132C389 154 359 182 337 219"
            stroke="#F5F0E6"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M428 198C394 209 369 229 350 255"
            stroke="#F5F0E6"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M428 266C403 269 382 281 365 298"
            stroke="#F5F0E6"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M304 4C256 35 222 77 214 126C206 178 232 217 274 234C299 244 316 242 316 242C315 181 321 91 304 4Z"
            fill="#B76449"
            opacity="0.45"
          />

          <path
            d="M303 7C276 76 269 144 275 220"
            stroke="#F5F0E6"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Bottom-left botanical leaves */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 overflow-hidden"
      >
        <svg
          width="470"
          height="420"
          viewBox="0 0 470 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-[0.10]"
        >
          <path
            d="M0 420C76 383 123 319 119 253C115 193 71 151 0 130V420Z"
            fill="#173D32"
          />

          <path
            d="M0 420C76 383 123 319 119 253C115 193 71 151 0 130"
            stroke="#173D32"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M42 385C54 318 47 257 15 202"
            stroke="#F5F0E6"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M87 340C83 300 70 264 47 234"
            stroke="#F5F0E6"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M112 287C94 265 77 251 58 241"
            stroke="#F5F0E6"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M173 420C238 376 278 314 274 249C270 190 230 150 171 132C165 207 150 321 173 420Z"
            fill="#B76449"
            opacity="0.45"
          />

          <path
            d="M181 406C206 325 215 242 204 160"
            stroke="#F5F0E6"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );
}

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
          data?.error ??
            "Hindi masimulan ang VIP checkout.",
        );
        setLoading(false);
        return;
      }

      if (!data?.checkoutUrl) {
        setErrorMessage(
          "Walang checkout link na ibinigay ng PayMongo.",
        );
        setLoading(false);
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setErrorMessage(
        "May nangyaring error habang sinisimulan ang checkout.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f0e6] text-[#173d32]">

      <BotanicalLeaves />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 lg:px-10 lg:py-20">

        {/* Header */}
        <div className="max-w-3xl">


          <h1 className="mt-4 max-w-2xl font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Mas maraming pagkakataon para
            makita ang iyong gawa.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-[#173d32]/60">
            Mas mapansin ang iyong portfolio,
            magkaroon ng dagdag na benepisyo,
            at makakuha ng priority support
            bilang LIKHA VIP member.
          </p>

        </div>

        {/* Main content */}
        <div className="mt-14 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-20">

          {/* Offer */}
          <section className="relative border-t border-[#173d32]/15 pt-7">

            {/* Promotion */}
            <div className="flex flex-wrap items-center gap-4">

              <p className="font-serif text-2xl font-semibold sm:text-3xl">
                First-time VIP
              </p>

              <span className="rounded-full bg-[#b76449] px-5 py-2.5 text-base font-bold text-white shadow-sm sm:text-lg">
                25% OFF
              </span>

            </div>

            {/* Price */}
            <div className="mt-8 flex items-end gap-4">

              <span className="font-serif text-7xl font-semibold leading-none sm:text-8xl">
                ₱150
              </span>

              <span className="mb-2 max-w-[100px] text-sm leading-5 text-[#173d32]/50">
                / unang
                <br />
                30 araw
              </span>

            </div>

            <p className="mt-5 max-w-lg text-sm leading-7 text-[#173d32]/60">
              Ang regular na VIP membership ay
              ₱200 bawat 30 araw.
              Para sa unang 30 araw, ₱150 lamang
              ang iyong babayaran.
            </p>

            {/* First-time credit */}
            <div className="mt-9 rounded-2xl border border-[#173d32]/10 bg-white/35 px-6 py-6">

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b76449]">
                Kasama sa unang VIP membership
              </p>

              <div className="mt-3 flex items-baseline gap-3">

                <span className="font-serif text-5xl font-semibold text-[#b76449]">
                  50
                </span>

                <span className="text-sm text-[#173d32]/60">
                  LIKHA Credits
                </span>

              </div>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#173d32]/55">
                Makakatanggap ka ng
                50 LIKHA Credits bilang
                one-time bonus sa unang pag-join
                mo sa VIP.
              </p>

            </div>

            {errorMessage && (
              <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="mt-8 w-full rounded-xl bg-[#173d32] px-6 py-4 font-semibold text-white shadow-sm transition hover:bg-[#245646] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[280px]"
            >
              {loading
                ? "Binubuksan ang payment..."
                : "Mag-join sa VIP sa ₱150"}
            </button>

        <p className="mt-4 max-w-md text-xs leading-5 text-[#173d32]/45">
  One-time payment. Walang automatic
  na recurring charge.
</p>

<Link
  href="/dashboard"
  className="mt-5 inline-flex rounded-lg border border-[#b76449]/20 bg-[#b76449]/5 px-4 py-2 text-xs font-medium text-[#b76449]/80 transition hover:bg-[#b76449]/10 hover:text-[#b76449]"
>
  Mamaya na
</Link>

          </section>

          {/* Benefits */}
          <section className="border-t border-[#173d32]/15 pt-7">


            <h2 className="mt-4 max-w-lg font-serif text-3xl leading-tight sm:text-4xl">
              Mas maraming paraan para
              mapansin ang iyong gawa.
            </h2>

            <div className="mt-8 divide-y divide-[#173d32]/10 border-y border-[#173d32]/10">

              <div className="py-5">
                <p className="font-semibold">
                  I-feature ang iyong portfolio
                </p>

                <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                  Mas mapansin ang iyong mga
                  napiling proyekto sa loob
                  ng LIKHA community.
                </p>
              </div>

              <div className="py-5">
                <p className="font-semibold">
                  Mas maraming portfolio slots
                </p>

                <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                  Magpakita ng mas marami sa
                  iyong mga proyekto at gawa
                  na gusto mong makita ng iba.
                </p>
              </div>

              <div className="py-5">
                <p className="font-semibold">
                  Mas mataas na visibility
                </p>

                <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                  Magkaroon ng dagdag na
                  pagkakataong makita sa mga
                  relevant na bahagi ng LIKHA.
                </p>
              </div>

              <div className="py-5">
                <p className="font-semibold">
                  VIP badge
                </p>

                <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                  Makikita ng ibang members na
                  bahagi ka ng LIKHA VIP community.
                </p>
              </div>

              <div className="py-5">
                <p className="font-semibold">
                  Priority support
                </p>

                <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                  Makakuha ng priority assistance
                  kapag kailangan mo ng tulong
                  tungkol sa LIKHA.
                </p>
              </div>

              <div className="py-5">
                <p className="font-semibold">
                  Pagkakataong ma-feature ang proyekto
                </p>

                <p className="mt-1 text-sm leading-6 text-[#173d32]/55">
                  Ang iyong mga napiling proyekto
                  ay maaaring magkaroon ng
                  pagkakataong ma-feature sa LIKHA.
                </p>
              </div>

            </div>

            {/* Renewal */}
            <div className="mt-8">

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b76449]">
                Pagkatapos ng unang 30 araw
              </p>

              <p className="mt-3 text-sm leading-7 text-[#173d32]/60">
                Maaari kang mag-renew sa{" "}
                <strong className="font-semibold text-[#173d32]">
                  ₱200 bawat 30 araw
                </strong>{" "}
                para ipagpatuloy ang iyong
                VIP benefits.
              </p>

            </div>

          </section>

        </div>

   
      </div>
    </main>
  );
}