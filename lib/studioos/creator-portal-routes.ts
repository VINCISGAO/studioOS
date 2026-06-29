import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

/** Canonical Creator Portal routes — all creator flows live under /studio */
export const creatorPortalRoutes = {
  dashboard: "/studio",
  invitations: "/studio/invitations",
  delivery: "/studio/delivery",
  reviewHub: "/studio/review",
  profile: "/studio/profile",
  income: "/studio/income",
  project: (orderId: string) => `/studio/projects/${orderId}`,
  review: (orderId: string) => `/studio/review/${orderId}`,
  deliveryForOrder: (orderId: string) => `/studio/delivery?order=${orderId}`,
  campaignReview: (campaignId: string) => `/brand/projects/${campaignId}/review`
} as const;

export function localizedCreatorRoute(path: string, locale: Locale) {
  return withLocale(path, locale);
}
