"use client";

import { useState } from "react";

type BuyCreditsButtonProps = {
  bundleCode: string;
  credits: number;
  price: number;
  featured?: boolean;
};

export default function BuyCreditsButton({
  bundleCode,
  credits,
  price,
  featured = false,
}: BuyCreditsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handlePurchase() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        "/api/credits/checkout",
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

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data?.error ??
            "Unable to start credit checkout.",
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
    <div className="mt-7">
      <button
        type="button"
        onClick={handlePurchase}
        disabled={loading}
        className={`w-full rounded-lg px-5 py-3.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
          featured
            ? "bg-[#b76449] hover:bg-[#9f503c]"
            : "bg-[#173d32] hover:bg-[#245646]"
        }`}
      >
        {loading
          ? "Opening PayMongo..."
          : `Buy ${credits} Credits — ₱${price}`}
      </button>

      {errorMessage && (
        <p className="mt-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
    </div>
  );
}