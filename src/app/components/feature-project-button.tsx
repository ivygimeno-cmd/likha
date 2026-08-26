"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type FeatureProjectButtonProps = {
  projectId: number;
  isVip: boolean;
  isFeatured: boolean;
};

export default function FeatureProjectButton({
  projectId,
  isVip,
  isFeatured,
}: FeatureProjectButtonProps) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [featured, setFeatured] = useState(isFeatured);
  const [error, setError] = useState("");

  async function handleFeature() {
    setLoading(true);
    setError("");

    const { error: featureError } = await supabase.rpc(
      "feature_portfolio_project",
      {
        p_project_id: projectId,
      },
    );

    if (featureError) {
      setError(featureError.message);
      setLoading(false);
      return;
    }

    setFeatured(true);
    setLoading(false);
  }

  if (featured) {
    return (
      <span className="inline-flex rounded-full bg-[#789b82]/15 px-3 py-1.5 text-xs font-semibold text-[#173d32]">
        Featured on LIKHA
      </span>
    );
  }

  if (!isVip) {
    return (
      <div className="mt-4">
        <p className="text-xs text-[#173d32]/50">
          VIP members can feature their work.
        </p>

        <Link
          href="/vip"
          className="mt-2 inline-block text-sm font-semibold text-[#b76449]"
        >
          Upgrade to VIP
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleFeature}
        disabled={loading}
        className="rounded-lg bg-[#173d32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245646] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Featuring..." : "Feature this project"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}