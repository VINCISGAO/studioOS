import type { studioNav } from "@/lib/studioos/vocabulary";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import {
  Clapperboard,
  FolderKanban,
  Home,
  Inbox,
  MessageSquare,
  Palette,
  Receipt,
  Settings,
  Shield
} from "lucide-react";

export type CreatorPortalNavKey = keyof typeof studioNav.en;

export type CreatorPortalNavItem = {
  href: string;
  labelKey: CreatorPortalNavKey;
  icon: typeof Home;
  /** Locked when completedOrders >= 1 && !isVerified */
  requiresBusinessAccess: boolean;
  showUnreadDot?: boolean;
};

export const creatorPortalNavItems: CreatorPortalNavItem[] = [
  { href: creatorPortalRoutes.home, labelKey: "home", icon: Home, requiresBusinessAccess: false },
  {
    href: creatorPortalRoutes.invitations,
    labelKey: "invitations",
    icon: Inbox,
    requiresBusinessAccess: true
  },
  { href: creatorPortalRoutes.projects, labelKey: "projects", icon: FolderKanban, requiresBusinessAccess: true },
  { href: creatorPortalRoutes.reviewHub, labelKey: "reviewRoom", icon: Clapperboard, requiresBusinessAccess: true },
  { href: creatorPortalRoutes.works, labelKey: "works", icon: Palette, requiresBusinessAccess: false },
  { href: creatorPortalRoutes.income, labelKey: "income", icon: Receipt, requiresBusinessAccess: true },
  { href: creatorPortalRoutes.deposit, labelKey: "deposit", icon: Shield, requiresBusinessAccess: false },
  {
    href: creatorPortalRoutes.messages,
    labelKey: "messages",
    icon: MessageSquare,
    requiresBusinessAccess: true,
    showUnreadDot: true
  },
  { href: creatorPortalRoutes.settings, labelKey: "settings", icon: Settings, requiresBusinessAccess: false }
];
