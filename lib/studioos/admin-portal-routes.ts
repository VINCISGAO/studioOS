/** Canonical admin portal routes — Sprint 15 */
export const adminPortalRoutes = {
  dashboard: "/admin",
  disputes: "/admin/disputes",
  disputeDetail: (id: string) => `/admin/disputes/${id}`,
  audit: "/admin/audit",
  featureFlags: "/admin/feature-flags",
  brands: "/admin/brands",
  projects: "/admin/projects",
  studios: "/admin/studios",
  payments: "/admin/payments",
  deposits: "/admin/deposits",
  quality: "/admin/quality",
  support: "/admin/support",
  membership: "/admin/membership"
} as const;
