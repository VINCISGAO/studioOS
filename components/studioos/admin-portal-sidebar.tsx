"use client";

import Link from "next/link";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { PortalSidebarFrame } from "@/components/studioos/portal/portal-sidebar-frame";
import { AdminPortalAccountMenu } from "@/components/studioos/admin-portal-account-menu";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { adminChrome } from "@/lib/studioos/admin-copy";
import { adminNavLabels } from "@/lib/studioos/admin-i18n";
import {
  adminPortalNavBySection,
  adminPortalNavItems,
  adminPortalSectionLabels,
  isAdminNavActive,
  type AdminPortalNavSection
} from "@/lib/studioos/admin-portal-nav";
import { cn } from "@/lib/utils";
import { LayoutDashboard } from "lucide-react";

const sections: AdminPortalNavSection[] = ["operations", "users", "finance", "platform"];

function sidebarLinkClass(active: boolean, workspaceActive = false) {
  return cn(
    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
    workspaceActive
      ? "bg-violet-50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.12)]"
      : active
        ? "bg-zinc-100/80 text-zinc-900"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
  );
}

export function AdminPortalSidebar({
  locale,
  pathname,
  adminAccount
}: {
  locale: Locale;
  pathname: string;
  adminAccount: { name: string; email: string; initials: string };
}) {
  const chrome = adminChrome(locale);

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
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">
              {chrome.controlCenter}
            </p>
          </div>
        </MarketingHomeLink>
      }
      nav={
        <div className="space-y-5 px-3 pb-3">
          {sections.map((section) => {
            const items = adminPortalNavBySection(section);
            return (
              <div key={section}>
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  {adminPortalSectionLabels[section][locale]}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = isAdminNavActive(pathname, item.href);
                    const workspaceActive = item.key === "dashboard" && active;
                    const Icon = item.icon ?? LayoutDashboard;
                    return (
                      <Link
                        key={item.key}
                        href={withLocale(item.href, locale)}
                        className={sidebarLinkClass(active, workspaceActive)}
                      >
                        <Icon className={cn("h-[18px] w-[18px] shrink-0", workspaceActive && "text-violet-700")} />
                        <span>{adminNavLabels[item.key][locale]}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      }
      footer={
        <AdminPortalAccountMenu
          locale={locale}
          initials={adminAccount.initials}
          name={adminAccount.name}
          email={adminAccount.email}
        />
      }
    />
  );
}

export function adminMobileNavItems(locale: Locale, pathname: string) {
  return adminPortalNavItems.map(({ href, key, iconKey }) => ({
    id: href,
    href,
    label: adminNavLabels[key][locale],
    iconKey,
    active: isAdminNavActive(pathname, href)
  }));
}
