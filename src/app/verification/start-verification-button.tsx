"use client";

import Link from "next/link";
import { useState } from "react";

type StartVerificationResponse = {
  verificationUrl?: string;
  error?: string;
};

export default function StartVerificationButton() {
  const [consentAccepted, setConsentAccepted] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function startVerification() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/identity-verification/session",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            consentAccepted,
          }),
        },
      );

      const result =
        (await response.json()) as StartVerificationResponse;

      if (
        !response.ok ||
        !result.verificationUrl
      ) {
        setErrorMessage(
          result.error ??
            "Hindi makapagsimula ng verification.",
        );

        setLoading(false);
        return;
      }

      if (
        !result.verificationUrl.startsWith(
          "https://verify.didit.me/",
        )
      ) {
        setErrorMessage(
          "Invalid verification link.",
        );

        setLoading(false);
        return;
      }

      window.location.assign(
        result.verificationUrl,
      );
    } catch {
      setErrorMessage(
        "Hindi makakonekta sa verification service.",
      );

      setLoading(false);
    }
  }

  return (
    <div className="mt-7">
      <label className="flex items-start gap-3 rounded-xl border border-[#173d32]/15 bg-[#f5f0e6] p-4 text-sm leading-6">
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(event) =>
            setConsentAccepted(
              event.target.checked,
            )
          }
          className="mt-1 h-4 w-4 shrink-0 accent-[#b76449]"
        />

        <span>
          Kusang-loob akong pumapayag na gamitin
          ang aking government ID, selfie, at
          liveness information para sa identity
          verification. Nabasa ko ang{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#b76449] underline"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {errorMessage && (
        <p
          aria-live="polite"
          className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        onClick={startVerification}
        disabled={
          !consentAccepted || loading
        }
        className="mt-5 w-full rounded-lg bg-[#173d32] px-6 py-4 font-semibold text-white transition hover:bg-[#b76449] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {loading
          ? "Inihahanda ang secure verification..."
          : "Simulan ang Verification →"}
      </button>
    </div>
  );
}