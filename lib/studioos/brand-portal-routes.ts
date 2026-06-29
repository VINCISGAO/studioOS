import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

/** Canonical Brand Portal routes — all brand flows live under /brand */
export const brandPortalRoutes = {
  dashboard: "/brand",
  newProject: "/brand/projects/new",
  reviewHub: "/brand/review",
  settlement: "/brand/settlement",
  attribution: "/brand/attribution",
  profile: "/brand/profile",
  invoices: "/brand/invoices",
  project: (id: string) => `/brand/projects/${id}`,
  projectReview: (id: string) => `/brand/projects/${id}/review`,
  projectCheckout: (id: string) => `/brand/projects/${id}/checkout`,
  projectStudios: (id: string) => `/brand/projects/${id}/studios`
} as const;

export function localizedBrandRoute(path: string, locale: Locale) {
  return withLocale(path, locale);
}
