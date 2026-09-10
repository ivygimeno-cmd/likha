"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type FeatureProjectButtonProps = {
  projectId: number;
  isVip: boolean;
  isFeatured: boolean;
};

const MAX_FEATURED_PROJECTS = 3;

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

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    const user = userData.user;

    if (userError || !user) {
      setError(
        "Mag-sign in ulit bago mag-feature ng project.",
      );
      setLoading(false);
      return;
    }

    const { count, error: countError } =
      await supabase
        .from("featured_projects")
        .select("project_id", {
          count: "exact",
          head: true,
        })
        .eq("profile_id", user.id)
        .eq("is_active", true);

    if (countError) {
      setError(countError.message);
      setLoading(false);
      return;
    }

    if ((count ?? 0) >= MAX_FEATURED_PROJECTS) {
      setError(
        `Maximum na ${MAX_FEATURED_PROJECTS} featured projects para sa VIP.`,
      );
      setLoading(false);
      return;
    }

    const { error: featureError } =
      await supabase.rpc(
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
      <span className="inline-flex items-center rounded-full border border-[#789b82]/25 bg-[#789b82]/15 px-3 py-2 text-xs font-semibold text-[#173d32]">
        Featured on LIKHA
      </span>
    );
  }

  if (!isVip) {
    return (
      <div>
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
    <div>
      <button
        type="button"
        onClick={handleFeature}
        disabled={loading}
        className="inline-flex items-center rounded-full border border-[#173d32]/15 bg-[#fbf8f1] px-3 py-2 text-xs font-semibold text-[#173d32] transition hover:border-[#173d32]/30 hover:bg-[#f3eee3] disabled:cursor-not-allowed disabled:opacity-60"
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