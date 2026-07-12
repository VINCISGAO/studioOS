"use client";

import Link from "next/link";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { PortalMobileNav } from "@/components/studioos/portal-mobile-nav";
import { adminMobileNavItems } from "@/components/studioos/admin-portal-sidebar";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { Bell } from "lucide-react";

export function AdminPortalHeader({
  locale,
  pathname,
  failedNotificationCount = 0
}: {
  locale: Locale;
  pathname: string;
  failedNotificationCount?: number;
}) {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <MarketingHomeLink locale={locale} className="flex items-center gap-2 font-semibold text-zinc-950">
            <BrandLogoLockup
              contrastOn="light"
              markClassName="h-6 w-6 rounded-md shadow-sm ring-1 ring-violet-100"
              wordmarkClassName="h-[13px] w-[82px]"
            />
          </MarketingHomeLink>
        </div>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={withLocale(adminPortalRoutes.notifications, locale)}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50"
            aria-label={locale === "zh" ? "通知" : "Notifications"}
          >
            <Bell className="h-4 w-4" />
            {failedNotificationCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {failedNotificationCount > 99 ? "99+" : failedNotificationCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
      <div className="border-t border-zinc-100 px-4 py-3 lg:hidden">
        <PortalMobileNav locale={locale} pathname={pathname} items={adminMobileNavItems(locale, pathname)} />
      </div>
    </header>
  );
}
