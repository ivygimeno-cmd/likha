import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import SessionGuard from "@/app/components/session-guard";
import PushNotificationSetup from "@/app/components/push-notification-setup";
import VipSupportChat from "@/app/components/vip-support-chat";
import { getCurrentUser } from "@/lib/current-user";

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
  const currentUser = await getCurrentUser();

  const user = currentUser?.user ?? null;
  const isVip = currentUser?.isVip ?? false;
  const isAdmin = currentUser?.isAdmin ?? false;

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