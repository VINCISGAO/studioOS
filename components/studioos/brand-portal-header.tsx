"use client";

import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { NotificationCenterBell } from "@/components/studioos/notification-center-bell";
import { PortalMobileNav } from "@/components/studioos/portal-mobile-nav";
import { StudioUserMenu } from "@/components/studioos/studio-user-menu";
import { brandPortalNavItems, type BrandPortalNavItem } from "@/lib/studioos/brand-portal-nav";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { Locale } from "@/lib/i18n";

export function BrandPortalHeader({
  locale,
  pathname,
  navLabels,
  initials,
  avatarUrl,
  brandName,
  unreadMessageCount,
  isNavItemActive
}: {
  locale: Locale;
  pathname: string;
  navLabels: Record<string, string>;
  initials: string;
  avatarUrl?: string;
  brandName?: string;
  unreadMessageCount: number;
  isNavItemActive: (item: BrandPortalNavItem) => boolean;
}) {
  return (
    <header
      data-brand-portal-header
      className="sticky top-0 z-40 shrink-0 border-b border-zinc-200/80 bg-white/95 backdrop-blur"
    >
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <MarketingHomeLink locale={locale} className="flex items-center gap-2 font-semibold text-zinc-950">
            <BrandLogoLockup
              contrastOn="light"
              markClassName="h-6 w-6 rounded-md shadow-sm"
              wordmarkClassName="h-[13px] w-[82px]"
            />
          </MarketingHomeLink>
        </div>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationCenterBell locale={locale} />
          <StudioUserMenu
            locale={locale}
            initials={initials}
            avatarUrl={avatarUrl}
            name={brandName}
            profileHref={brandPortalRoutes.brandCenter}
            roleLabel={locale === "zh" ? "品牌方" : "Brand"}
            imageFit="photo"
          />
        </div>
      </div>

      <div className="border-t border-zinc-100 px-4 py-3 lg:hidden">
        <PortalMobileNav
          locale={locale}
          pathname={pathname}
          items={brandPortalNavItems
            .filter((item) => !item.disabled)
            .map((item) => ({
              id: item.labelKey,
              href: item.href,
              label: navLabels[item.labelKey],
              iconKey: item.mobileIconKey,
              active: isNavItemActive(item)
            }))}
        />
      </div>
    </header>
  );
}
