import type { Metadata, Viewport } from "next";
import {
  vincisDefaultOpenGraph,
  vincisDefaultTwitter,
  vincisRootMetadataIcons
} from "@/lib/marketing/site-seo";
import { VINCIS_ORGANIZATION, VINCIS_SITE_ORIGIN } from "@/lib/marketing/organization-schema";
import { landingFontClassName } from "@/lib/studioos/landing-fonts";
import { studioOS } from "@/lib/studioos/vocabulary";
import "./globals.css";

/** Explicit viewport — matches Next default; keeps Chrome / Safari / Edge aligned. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export const metadata: Metadata = {
  metadataBase: new URL(VINCIS_SITE_ORIGIN),
  title: {
    default: "VINCIS | AI Creative Production for Global Brands",
    template: "%s | VINCIS"
  },
  description: studioOS.hero.en,
  applicationName: VINCIS_ORGANIZATION.name,
  icons: vincisRootMetadataIcons(),
  openGraph: vincisDefaultOpenGraph(),
  twitter: vincisDefaultTwitter(),
  alternates: {
    canonical: VINCIS_SITE_ORIGIN,
    languages: {
      en: `${VINCIS_SITE_ORIGIN}/?lang=en`,
      "zh-CN": VINCIS_SITE_ORIGIN,
      "x-default": VINCIS_SITE_ORIGIN
    }
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
        className="min-h-dvh-safe bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
