import type { PortalMobileNavIconKey } from "@/lib/studioos/portal-mobile-nav-types";
import type { studioNav } from "@/lib/studioos/vocabulary";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import {
  Clapperboard,
  ClipboardList,
  FolderKanban,
  Home,
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
  mobileIconKey: PortalMobileNavIconKey;
  /** Locked when completedOrders >= 1 && !isVerified */
  requiresBusinessAccess: boolean;
  showUnreadDot?: boolean;
};

/** Creator sidebar IA — home → profile → orders → project details → review → income → messages → certification → settings */
export const creatorPortalNavItems: CreatorPortalNavItem[] = [
  {
    href: creatorPortalRoutes.home,
    labelKey: "home",
    icon: Home,
    mobileIconKey: "home",
    requiresBusinessAccess: false
  },
  {
    href: creatorPortalRoutes.profile,
    labelKey: "works",
    icon: Palette,
    mobileIconKey: "works",
    requiresBusinessAccess: false
  },
  {
    href: creatorPortalRoutes.invitations,
    labelKey: "orders",
    icon: ClipboardList,
    mobileIconKey: "invitations",
    requiresBusinessAccess: true
  },
  {
    href: creatorPortalRoutes.projects,
    labelKey: "projectDetails",
    icon: FolderKanban,
    mobileIconKey: "projects",
    requiresBusinessAccess: true
  },
  {
    href: creatorPortalRoutes.reviewHub,
    labelKey: "reviewRoom",
    icon: Clapperboard,
    mobileIconKey: "reviewRoom",
    requiresBusinessAccess: true
  },
  {
    href: creatorPortalRoutes.income,
    labelKey: "income",
    icon: Receipt,
    mobileIconKey: "income",
    /** Always available — creators can withdraw earnings before certifying. */
    requiresBusinessAccess: false
  },
  {
    href: creatorPortalRoutes.messages,
    labelKey: "messages",
    icon: MessageSquare,
    mobileIconKey: "messages",
    requiresBusinessAccess: true,
    showUnreadDot: true
  },
  {
    href: creatorPortalRoutes.deposit,
    labelKey: "deposit",
    icon: Shield,
    mobileIconKey: "deposit",
    requiresBusinessAccess: false
  },
  {
    href: creatorPortalRoutes.settings,
    labelKey: "settings",
    icon: Settings,
    mobileIconKey: "settings",
    requiresBusinessAccess: false
  }
];
