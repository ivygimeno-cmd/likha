import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import SessionGuard from "@/app/components/session-guard";
import PushNotificationSetup from "@/app/components/push-notification-setup";
import { createClient } from "@/lib/supabase/server";
import VipSupportChat from "@/app/components/vip-support-chat";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Likha | Gawang Lokal, Para sa Iyo",
  description:
    "Magpagawa ng custom products mula sa mahuhusay na lokal na Filipino creators.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isVip = false;
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_tier, vip_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    if (
      profile?.account_tier === "vip" &&
      profile?.vip_expires_at &&
      new Date(profile.vip_expires_at).getTime() >
        Date.now()
    ) {
      isVip = true;
    }
  }

  if (user) {
  const { data: adminCheck } =
    await supabase.rpc("is_likha_admin");

  isAdmin = adminCheck === true;
}

  return (
    <html
      lang="fil"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${cormorant.variable} antialiased`}
      >
<SessionGuard />

{isAdmin && <PushNotificationSetup />}

{children}

{user && (
  <VipSupportChat
    userId={user.id}
    isVip={isVip}
  />
)}

      </body>
    </html>
  );
}