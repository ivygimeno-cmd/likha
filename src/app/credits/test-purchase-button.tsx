"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TestPurchaseButtonProps = {
  bundleCode: string;
  credits: number;
  featured?: boolean;
};

export default function TestPurchaseButton({
  bundleCode,
  credits,
  featured = false,
}: TestPurchaseButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  async function handleTestPurchase() {
    setLoading(true);
    setMessage("");
    setHasError(false);

    try {
      const response = await fetch(
        "/api/credits/test-purchase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bundleCode,
          }),
        },
      );

      const result = (await response.json()) as {
        error?: string;
        creditsAdded?: number;
      };

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Hindi makumpleto ang test purchase.",
        );
      }

      setMessage(
        `Nagdagdag ng ${result.creditsAdded ?? credits} test credits.`,
      );

      router.refresh();
    } catch (error) {
      setHasError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Hindi makumpleto ang test purchase.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-7">
      <button
        type="button"
        onClick={handleTestPurchase}
        disabled={loading}
        className={`w-full rounded-lg px-5 py-3.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
          featured
            ? "bg-[#b76449] hover:bg-[#9f503c]"
            : "bg-[#173d32] hover:bg-[#245646]"
        }`}
      >
        {loading
          ? "Ina-add ang test credits..."
          : `Bumili ng ${credits} Test Credits `}
      </button>

      {message && (
        <p
          className={`mt-3 text-sm ${
            hasError
              ? "text-red-700"
              : "text-[#173d32]/65"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}