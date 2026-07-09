import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

/** Canonical Creator Portal routes */
export const creatorPortalRoutes = {
  home: "/studio",
  invitations: "/studio/invitations",
  projects: "/studio/projects",
  works: "/studio/works",
  income: "/studio/income",
  deposit: "/studio/deposit",
  messages: "/studio/messages",
  aiAssistant: "/studio/ai",
  settings: "/studio/settings",
  project: (orderId: string) => `/studio/projects/${orderId}`,
  review: (orderId: string) => `/studio/review/${orderId}`,
  reviewHub: "/studio/review",
  profile: "/studio/profile",
  /** Legacy aliases */
  dashboard: "/studio",
  delivery: "/studio/projects",
  deliveryForOrder: (orderId: string) => `/studio/projects/${orderId}`,
  campaignReview: (campaignId: string) => {
    void campaignId;
    return "/studio/review";
  }
} as const;

export function localizedCreatorRoute(path: string, locale: Locale) {
  return withLocale(path, locale);
}
