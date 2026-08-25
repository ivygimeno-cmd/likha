"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FollowButtonProps = {
  viewerId: string;
  profileId: string;
};

export default function FollowButton({
  viewerId,
  profileId,
}: FollowButtonProps) {
  const supabase = createClient();

  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkFollowing() {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", viewerId)
        .eq("following_id", profileId)
        .maybeSingle();

      if (!active) return;

      if (!error) {
        setFollowing(Boolean(data));
      }

      setLoading(false);
    }

    checkFollowing();

    return () => {
      active = false;
    };
  }, [profileId, viewerId, supabase]);

  async function handleFollow() {
    if (loading) return;

    setLoading(true);

    if (following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", viewerId)
        .eq("following_id", profileId);

      if (!error) {
        setFollowing(false);
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({
          follower_id: viewerId,
          following_id: profileId,
        });

      if (!error) {
        setFollowing(true);
      }
    }

    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleFollow}
      disabled={loading}
 className={`rounded-lg bg-[#173d32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245646] ${
  following
    ? "opacity-80"
    : ""
} disabled:cursor-not-allowed disabled:opacity-60`}
    >
   {loading
  ? "Loading"
  : following
    ? "Following"
    : "Follow"}
    </button>
  );
}