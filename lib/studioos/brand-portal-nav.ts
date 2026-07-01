import type { brandNav } from "@/lib/studioos/vocabulary";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { Building2, Clapperboard, Home, LineChart, MessageSquare, Settings, Wallet } from "lucide-react";

export type BrandPortalNavKey = keyof typeof brandNav.en;

export type BrandPortalNavItem = {
  href: string;
  labelKey: BrandPortalNavKey;
  icon: typeof Home;
};

export const brandPortalNavItems: BrandPortalNavItem[] = [
  { href: brandPortalRoutes.brandCenter, labelKey: "brandCenter", icon: Building2 },
  { href: brandPortalRoutes.dashboard, labelKey: "home", icon: Home },
  { href: brandPortalRoutes.reviewHub, labelKey: "reviewRoom", icon: Clapperboard },
  { href: brandPortalRoutes.messages, labelKey: "messages", icon: MessageSquare },
  { href: brandPortalRoutes.finance, labelKey: "finance", icon: Wallet },
  { href: brandPortalRoutes.attribution, labelKey: "attribution", icon: LineChart },
  { href: brandPortalRoutes.settings, labelKey: "settings", icon: Settings }
];
