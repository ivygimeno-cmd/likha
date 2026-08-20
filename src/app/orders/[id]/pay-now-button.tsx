"use client";

import { useState } from "react";

export default function PayNowButton({
  orderId,
}: {
  orderId: string;
}) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handlePay() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/payments/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            orderId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to start payment.",
        );
      }

      window.location.href =
        data.checkoutUrl;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to start payment.",
      );

      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-[#173d32] px-6 py-4 font-semibold text-white transition hover:bg-[#b76449] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Opening PayMongo..."
          : "Pay Now →"}
      </button>

      <p className="mt-2 text-xs text-[#173d32]/45">
        Test mode only. No real payment
        will be collected.
      </p>

      {error && (
        <p className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}