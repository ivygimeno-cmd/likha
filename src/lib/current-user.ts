import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: isAdmin }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
  "role, full_name, business_name, avatar_url, account_tier, vip_expires_at, referral_code",
)
        .eq("id", user.id)
        .maybeSingle(),

      supabase.rpc("is_likha_admin"),
    ]);

  const vipExpiresAt = profile?.vip_expires_at
    ? new Date(profile.vip_expires_at)
    : null;

  const isVip =
    profile?.account_tier === "vip" &&
    vipExpiresAt !== null &&
    vipExpiresAt.getTime() > Date.now();

  return {
    user,
    profile,
    isAdmin: isAdmin === true,
    isVip,
  };
});