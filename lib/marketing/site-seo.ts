import type { Metadata } from "next";
import {
  VINCIS_BRAND_LOGO_PATH,
  VINCIS_ORGANIZATION,
  VINCIS_SITE_ORIGIN
} from "@/lib/marketing/organization-schema";

export { VINCIS_BRAND_LOGO_PATH } from "@/lib/marketing/organization-schema";

export const VINCIS_FAVICON_PATHS = {
  ico: "/favicon.ico",
  png48: "/favicon-48x48.png",
  png96: "/favicon-96x96.png",
  png192: "/favicon-192x192.png",
  png512: "/favicon-512x512.png",
  apple: "/apple-touch-icon.png"
} as const;

export function absoluteBrandLogoUrl(origin: string = VINCIS_SITE_ORIGIN) {
  return `${origin.replace(/\/$/u, "")}${VINCIS_BRAND_LOGO_PATH}`;
}

export function vincisRootMetadataIcons(): NonNullable<Metadata["icons"]> {
  return {
    icon: [
      { url: VINCIS_FAVICON_PATHS.ico, sizes: "any" },
      { url: VINCIS_FAVICON_PATHS.png48, sizes: "48x48", type: "image/png" },
      { url: VINCIS_FAVICON_PATHS.png96, sizes: "96x96", type: "image/png" },
      { url: VINCIS_FAVICON_PATHS.png192, sizes: "192x192", type: "image/png" },
      { url: VINCIS_FAVICON_PATHS.png512, sizes: "512x512", type: "image/png" }
    ],
    apple: VINCIS_FAVICON_PATHS.apple,
    shortcut: VINCIS_FAVICON_PATHS.ico
  };
}

export function vincisDefaultOpenGraph(): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: VINCIS_ORGANIZATION.name,
    images: [{ url: absoluteBrandLogoUrl(), alt: VINCIS_ORGANIZATION.name }]
  };
}

export function vincisDefaultTwitter(): NonNullable<Metadata["twitter"]> {
  return {
    card: "summary_large_image",
    images: [absoluteBrandLogoUrl()]
  };
}
