import type { PortalMobileNavIconKey } from "@/lib/studioos/portal-mobile-nav-types";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import type { AdminNavKey } from "@/lib/studioos/admin-i18n";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  BookOpen,
  BookMarked,
  Building2,
  Clapperboard,
  CreditCard,
  Crown,
  Flag,
  Headphones,
  Languages,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Scale,
  ScrollText,
  Settings,
  Users,
  Wallet
} from "lucide-react";

export type AdminPortalNavSection = "operations" | "users" | "finance" | "platform";

export type AdminPortalNavItem = {
  key: AdminNavKey;
  href: string;
  icon: typeof LayoutDashboard;
  iconKey: PortalMobileNavIconKey;
  section: AdminPortalNavSection;
};

export const adminPortalSectionLabels: Record<AdminPortalNavSection, Record<"en" | "zh", string>> = {
  operations: { en: "Operations", zh: "运营" },
  users: { en: "Users", zh: "用户" },
  finance: { en: "Finance", zh: "财务" },
  platform: { en: "Platform", zh: "平台" }
};

/** Curated admin nav — real routes only, grouped like brand portal IA. */
export const adminPortalNavItems: AdminPortalNavItem[] = [
  { key: "dashboard", href: adminPortalRoutes.dashboard, icon: LayoutDashboard, iconKey: "layoutDashboard", section: "operations" },
  { key: "analytics", href: adminPortalRoutes.analytics, icon: LineChart, iconKey: "analytics", section: "operations" },
  { key: "campaigns", href: adminPortalRoutes.campaigns, icon: Megaphone, iconKey: "campaigns", section: "operations" },
  { key: "disputes", href: adminPortalRoutes.disputes, icon: Scale, iconKey: "disputes", section: "operations" },
  { key: "activityLog", href: adminPortalRoutes.activityLog, icon: Activity, iconKey: "activityLog", section: "operations" },
  { key: "brands", href: adminPortalRoutes.brands, icon: Building2, iconKey: "brands", section: "users" },
  { key: "studios", href: adminPortalRoutes.studios, icon: Users, iconKey: "studios", section: "users" },
  { key: "payments", href: adminPortalRoutes.payments, icon: CreditCard, iconKey: "finance", section: "finance" },
  { key: "settlements", href: adminPortalRoutes.settlements, icon: ArrowDownToLine, iconKey: "settlements", section: "finance" },
  { key: "withdrawals", href: adminPortalRoutes.withdrawals, icon: ArrowUpFromLine, iconKey: "withdrawals", section: "finance" },
  { key: "wallets", href: adminPortalRoutes.wallets, icon: Wallet, iconKey: "adminWallets", section: "finance" },
  { key: "ledger", href: adminPortalRoutes.ledger, icon: BookOpen, iconKey: "ledger", section: "finance" },
  { key: "notifications", href: adminPortalRoutes.notifications, icon: Bell, iconKey: "notifications", section: "platform" },
  { key: "membership", href: adminPortalRoutes.membership, icon: Crown, iconKey: "membership", section: "platform" },
  { key: "showcase", href: adminPortalRoutes.showcase, icon: Clapperboard, iconKey: "campaigns", section: "platform" },
  { key: "knowledge", href: adminPortalRoutes.knowledge, icon: BookMarked, iconKey: "ledger", section: "platform" },
  { key: "languages", href: adminPortalRoutes.languages, icon: Languages, iconKey: "settings", section: "platform" },
  { key: "featureFlags", href: adminPortalRoutes.featureFlags, icon: Flag, iconKey: "featureFlags", section: "platform" },
  { key: "audit", href: adminPortalRoutes.audit, icon: ScrollText, iconKey: "audit", section: "platform" },
  { key: "settings", href: adminPortalRoutes.settings, icon: Settings, iconKey: "settings", section: "platform" },
  { key: "support", href: adminPortalRoutes.support, icon: Headphones, iconKey: "support", section: "platform" }
];

export function adminPortalNavBySection(section: AdminPortalNavSection) {
  return adminPortalNavItems.filter((item) => item.section === section);
}

export function isAdminNavActive(pathname: string, href: string) {
  if (href === adminPortalRoutes.dashboard) {
    return pathname === href || pathname === "/admin/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
