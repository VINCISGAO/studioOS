import { MARKETING_SITE_NAV_PATHS } from "@/lib/marketing/marketing-site-nav";

export const PUBLIC_LUCIEN_PAGE_PATHS = [
  MARKETING_SITE_NAV_PATHS.faq,
  MARKETING_SITE_NAV_PATHS.about,
  MARKETING_SITE_NAV_PATHS.process,
  MARKETING_SITE_NAV_PATHS.cases,
  MARKETING_SITE_NAV_PATHS.pricing,
  MARKETING_SITE_NAV_PATHS.resources
] as const;

export type PublicLucienPagePath = (typeof PUBLIC_LUCIEN_PAGE_PATHS)[number];

export function isPublicLucienPagePath(path: string): path is PublicLucienPagePath {
  return (PUBLIC_LUCIEN_PAGE_PATHS as readonly string[]).includes(path);
}

export function normalizePublicLucienPagePath(pathname: string | null | undefined): PublicLucienPagePath {
  const path = pathname?.split("?")[0]?.trim() || MARKETING_SITE_NAV_PATHS.faq;
  return isPublicLucienPagePath(path) ? path : MARKETING_SITE_NAV_PATHS.faq;
}
