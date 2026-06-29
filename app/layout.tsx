import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { studioOS } from "@/lib/studioos/vocabulary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "StudioOS | Hollywood-level ads at the lowest budget",
  description: studioOS.hero.en
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
