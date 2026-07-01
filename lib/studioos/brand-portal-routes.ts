import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

/** Canonical Brand Portal routes — advertiser workspace under /brand */
export const brandPortalRoutes = {
  dashboard: "/brand",
  /** Legacy list URL — redirects to dashboard (#my-ads). */
  campaigns: "/brand/campaigns",
  campaign: (id: string) => `/brand/campaigns/${id}`,
  finance: "/brand/finance",
  financeEscrow: "/brand/finance/escrow",
  financePayments: "/brand/finance/payments",
  financeInvoices: "/brand/finance/invoices",
  financeMethods: "/brand/finance/methods",
  brandCenter: "/brand/brand-center",
  brandProfile: "/brand/brand-center/profile",
  brandGuidelines: "/brand/brand-center/guidelines",
  brandTeam: "/brand/brand-center/team",
  messages: "/brand/messages",
  settings: "/brand/settings",
  /** Legacy / deep links — still used by wizard & review flows */
  newProject: "/brand/projects/new",
  reviewHub: "/brand/review",
  settlement: "/brand/settlement",
  attribution: "/brand/attribution",
  profile: "/brand/profile",
  invoices: "/brand/invoices",
  team: "/brand/team",
  project: (id: string) => `/brand/projects/${id}`,
  projectReview: (id: string) => `/brand/projects/${id}/review`,
  projectCheckout: (id: string) => `/brand/projects/${id}/checkout`,
  projectStudios: (id: string) => `/brand/projects/${id}/studios`
} as const;

export function localizedBrandRoute(path: string, locale: Locale) {
  return withLocale(path, locale);
}
