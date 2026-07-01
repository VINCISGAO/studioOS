/** Shared mobile nav icon keys — keep free of "use client" so server nav configs can import safely. */
export type PortalMobileNavIconKey =
  | "home"
  | "invitations"
  | "projects"
  | "reviewRoom"
  | "works"
  | "income"
  | "deposit"
  | "messages"
  | "settings"
  | "brandCenter"
  | "finance"
  | "attribution"
  | "lock"
  | "layoutDashboard"
  | "brands"
  | "adminProjects"
  | "studios"
  | "payments"
  | "membership"
  | "disputes"
  | "audit"
  | "featureFlags"
  | "quality"
  | "support"
  | "campaigns"
  | "settlements"
  | "withdrawals"
  | "adminWallets"
  | "ledger"
  | "notifications"
  | "activityLog"
  | "analytics";

export const portalMobileNavIconKeys: PortalMobileNavIconKey[] = [
  "home",
  "invitations",
  "projects",
  "reviewRoom",
  "works",
  "income",
  "deposit",
  "messages",
  "settings",
  "brandCenter",
  "finance",
  "attribution",
  "lock",
  "layoutDashboard",
  "brands",
  "adminProjects",
  "studios",
  "payments",
  "membership",
  "disputes",
  "audit",
  "featureFlags",
  "quality",
  "support",
  "campaigns",
  "settlements",
  "withdrawals",
  "adminWallets",
  "ledger",
  "notifications",
  "activityLog",
  "analytics"
];

export function isPortalMobileNavIconKey(value: string): value is PortalMobileNavIconKey {
  return (portalMobileNavIconKeys as string[]).includes(value);
}
