"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { resolvePortalNavIcon } from "@/components/studioos/portal-mobile-nav-icons";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { PortalMobileNavIconKey } from "@/lib/studioos/portal-mobile-nav-types";
import { isPortalMobileNavIconKey } from "@/lib/studioos/portal-mobile-nav-types";
import { cn } from "@/lib/utils";

export type { PortalMobileNavIconKey } from "@/lib/studioos/portal-mobile-nav-types";

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
  items: {
    id: string;
    href: string;
    label: string;
    iconKey: PortalMobileNavIconKey | string;
    onClick?: () => void;
    active?: boolean;
  }[];
}) {
  const pathnameFromRouter = usePathname();
  const pathname = pathnameFromRouter ?? pathnameProp;

  return (
    <nav
      className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
      aria-label={locale === "zh" ? "门户导航" : "Portal navigation"}
    >
      {items.map(({ id, href, label, iconKey, onClick, active: activeOverride }) => {
        const Icon = resolvePortalNavIcon(isPortalMobileNavIconKey(iconKey) ? iconKey : undefined);
        const active = activeOverride ?? isNavItemActive(pathname, href);
        const className = cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition",
          active ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"
        );

        if (onClick) {
          return (
            <button key={id} type="button" onClick={onClick} className={className}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        }

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
