import type { Metadata } from "next";
import { AiCopilotRoot } from "@/components/ai-copilot/ai-copilot-root";
import { landingFontClassName } from "@/lib/studioos/landing-fonts";
import { studioOS } from "@/lib/studioos/vocabulary";
import "./globals.css";

export const metadata: Metadata = {
  title: "VINCIS | AI Creative Production for Global Brands",
  description: studioOS.hero.en,
  icons: {
    icon: "/images/LOGO.png?v=202607061900",
    shortcut: "/images/LOGO.png?v=202607061900",
    apple: "/images/LOGO.png?v=202607061900"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="zh-CN" className={landingFontClassName} suppressHydrationWarning>
      {isDev ? (
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
(() => {
  const stripCursorRefs = (root) => {
    if (!root || root.nodeType !== 1) return;
    if (root.hasAttribute && root.hasAttribute("data-cursor-ref")) {
      root.removeAttribute("data-cursor-ref");
    }
    if (root.querySelectorAll) {
      root.querySelectorAll("[data-cursor-ref]").forEach((node) => node.removeAttribute("data-cursor-ref"));
    }
  };

  stripCursorRefs(document.documentElement);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        stripCursorRefs(mutation.target);
      } else {
        mutation.addedNodes.forEach(stripCursorRefs);
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-cursor-ref"],
    childList: true,
    subtree: true
  });

  window.addEventListener("load", () => {
    window.setTimeout(() => observer.disconnect(), 1000);
  });
})();
`
            }}
          />
        </head>
      ) : null}
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
