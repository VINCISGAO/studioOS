import type { PortalMobileNavIconKey } from "@/lib/studioos/portal-mobile-nav-types";
import type { brandNav } from "@/lib/studioos/vocabulary";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import {
  BarChart3,
  Clapperboard,
  FolderOpen,
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
};

/** Brand workspace sidebar — matches dashboard mockup IA. */
export const brandPortalNavItems: BrandPortalNavItem[] = [
  {
    href: brandPortalRoutes.dashboard,
    labelKey: "workspace",
    icon: LayoutDashboard,
    mobileIconKey: "layoutDashboard"
  },
  {
    href: `${brandPortalRoutes.dashboard}#my-ads`,
    labelKey: "adRequirements",
    icon: Megaphone,
    mobileIconKey: "home"
  },
  {
    href: brandPortalRoutes.brandTeam,
    labelKey: "team",
    icon: Users,
    mobileIconKey: "studios"
  },
  {
    href: brandPortalRoutes.reviewHub,
    labelKey: "reviewRoom",
    icon: Clapperboard,
    mobileIconKey: "reviewRoom"
  },
  {
    href: brandPortalRoutes.brandCenter,
    labelKey: "brandLibrary",
    icon: FolderOpen,
    mobileIconKey: "brandCenter"
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
    href: brandPortalRoutes.settings,
    labelKey: "settings",
    icon: Settings,
    mobileIconKey: "settings"
  }
];

/** Legacy / deep-link nav used on project flows. */
export const brandPortalLegacyNavKeys = ["reviewRoom", "finance", "brandCenter"] as const;
