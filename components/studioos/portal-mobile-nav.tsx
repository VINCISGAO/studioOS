"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Users,
  Wallet
} from "lucide-react";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
  | "support";

const PORTAL_NAV_ICONS: Record<PortalMobileNavIconKey, LucideIcon> = {
  home: Home,
  invitations: Inbox,
  projects: FolderKanban,
  reviewRoom: Clapperboard,
  works: Palette,
  income: Receipt,
  deposit: Shield,
  messages: MessageSquare,
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
  support: Headphones
};

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/studio" || href === "/brand") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalMobileNav({
  locale,
  pathname: pathnameProp,
  items
}: {
  locale: Locale;
  pathname: string;
  items: { id: string; href: string; label: string; iconKey: PortalMobileNavIconKey }[];
}) {
  const pathnameFromRouter = usePathname();
  const pathname = pathnameFromRouter ?? pathnameProp;

  return (
    <nav
      className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
      aria-label={locale === "zh" ? "门户导航" : "Portal navigation"}
    >
      {items.map(({ id, href, label, iconKey }) => {
        const Icon = PORTAL_NAV_ICONS[iconKey];
        const active = isNavItemActive(pathname, href);
        const className = cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition",
          active ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"
        );

        if (href === "/") {
          return (
            <MarketingHomeLink key={id} locale={locale} className={className}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </MarketingHomeLink>
          );
        }

        return (
          <Link key={id} href={withLocale(href, locale)} className={className}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
