"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Clapperboard,
  CreditCard,
  Crown,
  Flag,
  FolderKanban,
  Headphones,
  Home,
  Inbox,
  LayoutDashboard,
  LineChart,
  Lock,
  MessageSquare,
  Palette,
  Receipt,
  Scale,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Megaphone,
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Bell,
  Activity
} from "lucide-react";
import {
  isPortalMobileNavIconKey,
  type PortalMobileNavIconKey
} from "@/lib/studioos/portal-mobile-nav-types";

const PORTAL_NAV_ICONS: Record<PortalMobileNavIconKey, LucideIcon> = {
  home: Home,
  invitations: Inbox,
  projects: FolderKanban,
  reviewRoom: Clapperboard,
  works: Palette,
  income: Receipt,
  deposit: Shield,
  messages: MessageSquare,
  aiAssistant: Sparkles,
  settings: Settings,
  brandCenter: Building2,
  finance: Wallet,
  attribution: LineChart,
  lock: Lock,
  layoutDashboard: LayoutDashboard,
  brands: Building2,
  adminProjects: Clapperboard,
  studios: Users,
  payments: CreditCard,
  membership: Crown,
  disputes: Scale,
  audit: ScrollText,
  featureFlags: Flag,
  quality: ShieldCheck,
  support: Headphones,
  campaigns: Megaphone,
  settlements: ArrowDownToLine,
  withdrawals: ArrowUpFromLine,
  adminWallets: Wallet,
  ledger: BookOpen,
  notifications: Bell,
  activityLog: Activity,
  analytics: LineChart
};

export function resolvePortalNavIcon(iconKey: string | undefined): LucideIcon {
  if (iconKey && isPortalMobileNavIconKey(iconKey)) {
    const icon = PORTAL_NAV_ICONS[iconKey];
    if (icon) {
      return icon;
    }
  }
  return LayoutDashboard;
}
