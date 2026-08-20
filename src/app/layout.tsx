import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import SessionGuard from "@/app/components/session-guard";




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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
  {children}
</body>
    </html>
  );
}