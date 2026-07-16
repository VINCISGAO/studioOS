import type { PortalMobileNavIconKey } from "@/lib/studioos/portal-mobile-nav-types";
import type { brandNav } from "@/lib/studioos/vocabulary";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import {
  BarChart3,
  Building2,
  Clapperboard,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  Users
} from "lucide-react";

export type BrandPortalNavKey = keyof typeof brandNav.en;

export type BrandPortalNavItem = {
  href: string;
  labelKey: BrandPortalNavKey;
  icon: typeof LayoutDashboard;
  mobileIconKey: PortalMobileNavIconKey;
  disabled?: boolean;
};

/** Brand workspace sidebar — matches dashboard mockup IA. */
export const brandPortalNavItems: BrandPortalNavItem[] = [
  {
    href: brandPortalRoutes.dashboard,
    labelKey: "adRequirements",
    icon: Megaphone,
    mobileIconKey: "home"
  },
  {
    href: brandPortalRoutes.brandCenter,
    labelKey: "brandCenter",
    icon: Building2,
    mobileIconKey: "brandCenter"
  },
  {
    href: brandPortalRoutes.reviewHub,
    labelKey: "reviewRoom",
    icon: Clapperboard,
    mobileIconKey: "reviewRoom"
  },
  {
    href: brandPortalRoutes.financeAccount,
    labelKey: "brandAccount",
    icon: CreditCard,
    mobileIconKey: "finance"
  },
  {
    href: brandPortalRoutes.attribution,
    labelKey: "attribution",
    icon: BarChart3,
    mobileIconKey: "attribution"
  },
  {
    href: brandPortalRoutes.messages,
    labelKey: "messages",
    icon: MessageSquare,
    mobileIconKey: "messages"
  },
  {
    href: brandPortalRoutes.brandTeam,
    labelKey: "team",
    icon: Users,
    mobileIconKey: "studios",
    disabled: true
  },
  {
    href: brandPortalRoutes.settings,
    labelKey: "settings",
    icon: Settings,
    mobileIconKey: "settings"
  }
];

/** Legacy / deep-link nav used on project flows. */
export const brandPortalLegacyNavKeys = ["reviewRoom", "finance", "brandCenter"] as const;
