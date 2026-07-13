"use client";

import Link from "next/link";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { PortalSidebarFrame } from "@/components/studioos/portal/portal-sidebar-frame";
import { PortalSidebarAccountMenu } from "@/components/studioos/portal-sidebar-account-menu";
import { brandPortalNavItems, type BrandPortalNavItem } from "@/lib/studioos/brand-portal-nav";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LayoutDashboard } from "lucide-react";

function sidebarLinkClass(active: boolean, workspaceActive = false) {
  return cn(
    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
    workspaceActive
      ? "bg-violet-50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.1)]"
      : active
        ? "bg-zinc-100/80 text-zinc-900"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
  );
}

export function BrandPortalSidebar({
  locale,
  navLabels,
  unreadMessageCount,
  brandAccount,
  initials,
  avatarUrl,
  isActive,
  onMyAdsClick
}: {
  locale: Locale;
  navLabels: Record<string, string>;
  unreadMessageCount: number;
  brandAccount?: { name: string; email: string } | null;
  initials: string;
  avatarUrl?: string;
  isActive: (item: BrandPortalNavItem) => boolean;
  onMyAdsClick: () => void;
}) {
  return (
    <PortalSidebarFrame
      logo={
        <MarketingHomeLink
          locale={locale}
          className="flex items-center gap-2.5 px-5 py-5 transition hover:opacity-80"
        >
          <BrandLogoLockup
            contrastOn="light"
            markClassName="h-8 w-8 rounded-lg shadow-sm ring-1 ring-violet-100"
            wordmarkClassName="h-[17px] w-[106px]"
            priority
          />
        </MarketingHomeLink>
      }
      nav={
        <div className="space-y-0.5 px-3 pb-3">
          {brandPortalNavItems.map((item) => {
            const active = isActive(item);
            const workspaceActive = item.labelKey === "workspace" && active;
            const Icon = item.icon ?? LayoutDashboard;
            if (item.disabled) {
              return (
                <div
                  key={item.href + item.labelKey}
                  className="relative flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 opacity-65"
                  aria-disabled="true"
                  title={locale === "zh" ? "暂未开放" : "Coming soon"}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{navLabels[item.labelKey]}</span>
                </div>
              );
            }
            if (item.labelKey === "adRequirements") {
              return (
                <button
                  key={item.href + item.labelKey}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    onMyAdsClick();
                  }}
                  className={sidebarLinkClass(active, false)}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span>{navLabels[item.labelKey]}</span>
                  </span>
                </button>
              );
            }
            return (
              <Link
                key={item.href + item.labelKey}
                href={withLocale(item.href, locale)}
                className={sidebarLinkClass(active, workspaceActive)}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", workspaceActive && "text-violet-700")} />
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span>{navLabels[item.labelKey]}</span>
                  {item.labelKey === "messages" && unreadMessageCount > 0 ? (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </div>
      }
      footer={
        brandAccount ? (
          <PortalSidebarAccountMenu
            locale={locale}
            initials={initials}
            avatarUrl={avatarUrl}
            name={brandAccount.name}
            roleLabel={locale === "zh" ? "品牌方" : "Brand"}
            profileHref={brandPortalRoutes.brandCenter}
            imageFit="photo"
          />
        ) : null
      }
    />
  );
}
