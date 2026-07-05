import type { Metadata } from "next";
import { AiCopilotRoot } from "@/components/ai-copilot/ai-copilot-root";
import { landingFontClassName } from "@/lib/studioos/landing-fonts";
import { studioOS } from "@/lib/studioos/vocabulary";
import "./globals.css";

export const metadata: Metadata = {
  title: "VINCIS | Hollywood Quality. Without Hollywood Costs.",
  description: studioOS.hero.en
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={landingFontClassName} suppressHydrationWarning>
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        {children}
        <AiCopilotRoot />
      </body>
    </html>
  );
}
