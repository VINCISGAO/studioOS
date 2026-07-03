"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { PortalMobileNav } from "@/components/studioos/portal-mobile-nav";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/language-switcher";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { StudioUserMenu } from "@/components/studioos/studio-user-menu";
import { brandNav, studioOS } from "@/lib/studioos/vocabulary";
import { brandPortalNavItems, type BrandPortalNavItem } from "@/lib/studioos/brand-portal-nav";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import {
  isBrandPortalFocusRoute,
  isBrandPortalProjectReviewRoute,
  isBrandPortalWizardCreateRoute
} from "@/lib/studioos/portal-focus-mode";
import { PortalShellChromeProvider } from "@/components/studioos/portal-shell-chrome-context";
import {
  ReviewFocusModeProvider,
  usePortalReviewFocus
} from "@/components/studioos/reviewer-skeleton/use-review-focus-mode";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Bell, ChevronDown, Home, LayoutDashboard, Sparkles } from "lucide-react";

function brandInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function BrandPortalShell({
  locale,
  pathname: pathnameProp,
  search,
  unreadMessageCount = 0,
  brandAccount,
  children
}: {
  locale: Locale;
  pathname?: string;
  search: string;
  unreadMessageCount?: number;
  brandAccount?: { name: string; email: string } | null;
  children: React.ReactNode;
}) {
  return (
    <ReviewFocusModeProvider searchFallback={search}>
      <BrandPortalShellInner
        locale={locale}
        pathname={pathnameProp}
        search={search}
        unreadMessageCount={unreadMessageCount}
        brandAccount={brandAccount}
      >
        {children}
      </BrandPortalShellInner>
    </ReviewFocusModeProvider>
  );
}

function BrandPortalShellInner({
  locale,
  pathname: pathnameProp,
  search,
  unreadMessageCount = 0,
  brandAccount,
  children
}: {
  locale: Locale;
  pathname?: string;
  search: string;
  unreadMessageCount?: number;
  brandAccount?: { name: string; email: string } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? pathnameProp ?? "/brand";
  const { isFocusMode: isReviewFocusMode } = usePortalReviewFocus();
  const nav = brandNav[locale];
  const initials = brandAccount ? brandInitials(brandAccount.name) : "BR";
  const isProjectReview = isBrandPortalProjectReviewRoute(pathname);
  const focusRoute = isBrandPortalFocusRoute(pathname);
  const isWizardCreate = isBrandPortalWizardCreateRoute(pathname);
  const isProfileEditorPage = pathname === brandPortalRoutes.brandProfile || pathname === brandPortalRoutes.profile;
  const portalChrome = {
    initials,
    userName: brandAccount?.name,
    profileHref: brandPortalRoutes.brandProfile,
    roleLabel: locale === "zh" ? "广告主" : "Brand",
    unreadMessageCount,
    messagesHref: brandPortalRoutes.messages
  };

  if (isProjectReview && isReviewFocusMode) {
    return (
      <PortalShellChromeProvider value={portalChrome}>
        <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#f8f9fb]">{children}</div>
      </PortalShellChromeProvider>
    );
  }

  function isActive(item: BrandPortalNavItem) {
    if (item.labelKey === "workspace") {
      return pathname === brandPortalRoutes.dashboard;
    }
    if (item.labelKey === "adRequirements") {
      return pathname === brandPortalRoutes.campaigns || pathname.startsWith("/brand/campaigns/");
    }
    if (item.labelKey === "team") {
      return pathname === brandPortalRoutes.brandTeam || pathname === brandPortalRoutes.team;
    }
    if (item.labelKey === "brandLibrary") {
      return pathname === brandPortalRoutes.brandCenter || pathname.startsWith("/brand/brand-center");
    }
    if (item.labelKey === "dataAnalysis" || item.labelKey === "attribution") {
      return pathname === brandPortalRoutes.attribution || pathname.startsWith("/brand/attribution");
    }
    if (item.labelKey === "messages") {
      return pathname === brandPortalRoutes.messages || pathname.startsWith("/brand/messages");
    }
    if (item.labelKey === "settings") {
      return pathname === brandPortalRoutes.settings || pathname.startsWith("/brand/settings");
    }
    if (item.labelKey === "brandAccount") {
      return pathname === brandPortalRoutes.financeAccount;
    }
    if (item.labelKey === "home") {
      return (
        (pathname === brandPortalRoutes.dashboard ||
          pathname.startsWith("/brand/projects") ||
          pathname.startsWith("/brand/campaigns")) &&
        !/\/brand\/projects\/[^/]+\/review/.test(pathname) &&
        !pathname.includes("/checkout")
      );
    }
    if (item.labelKey === "reviewRoom") {
      return pathname === brandPortalRoutes.reviewHub || /\/brand\/projects\/[^/]+\/review/.test(pathname);
    }
    if (item.labelKey === "finance") {
      return (
        pathname === brandPortalRoutes.finance ||
        (pathname.startsWith("/brand/finance") && pathname !== brandPortalRoutes.financeAccount) ||
        pathname.includes("/checkout")
      );
    }
    if (item.labelKey === "brandCenter") {
      return pathname === brandPortalRoutes.brandCenter || pathname.startsWith("/brand/brand-center");
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

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

  function sidebarDisabledClass() {
    return cn(
      "relative flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
      "text-zinc-400 opacity-65"
    );
  }

  return (
    <PortalShellChromeProvider value={portalChrome}>
      <div className="min-h-screen bg-[#f8f9fc] lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden">
      <div className="flex min-h-screen lg:h-[100dvh] lg:min-h-0 lg:max-h-[100dvh] lg:overflow-hidden">
        <aside
          className={cn(
            "hidden h-[100dvh] max-h-[100dvh] w-[248px] shrink-0 flex-col overflow-hidden border-r border-zinc-200/80 bg-white lg:sticky lg:top-0 lg:flex",
            isWizardCreate && "max-lg:hidden"
          )}
        >
          <MarketingHomeLink
            locale={locale}
            className="flex shrink-0 items-center gap-2.5 px-5 py-5 transition hover:opacity-80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950">
                {locale === "zh" ? "品牌方工作台" : "Brand workspace"}
              </p>
            </div>
          </MarketingHomeLink>

          <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
            {brandPortalNavItems.map((item) => {
              const active = isActive(item);
              const workspaceActive = item.labelKey === "workspace" && active;
              const Icon = item.icon ?? LayoutDashboard;
              if (item.disabled) {
                return (
                  <div
                    key={item.href + item.labelKey}
                    className={sidebarDisabledClass()}
                    aria-disabled="true"
                    title={locale === "zh" ? "暂未开放" : "Coming soon"}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span>{nav[item.labelKey]}</span>
                    </span>
                  </div>
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
                    <span>{nav[item.labelKey]}</span>
                    {item.labelKey === "messages" && unreadMessageCount > 0 ? (
                      <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto shrink-0 border-t border-zinc-100 p-4">
            {brandAccount ? (
              <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                  {initials.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{brandAccount.name.split(" ")[0]}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {locale === "zh" ? "品牌管理员" : "Brand admin"}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
              </div>
            ) : null}
          </div>
        </aside>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden",
            isProjectReview && "h-[100dvh] max-h-[100dvh] overflow-hidden"
          )}
        >
          {!isProjectReview ? (
            <header className="sticky top-0 z-40 shrink-0 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
              <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
                {isWizardCreate ? (
                  <Link
                    href={withLocale(brandPortalRoutes.dashboard, locale)}
                    className="flex items-center gap-2.5 text-sm font-semibold text-zinc-950 lg:hidden"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700">
                      <Home className="h-4 w-4" />
                    </span>
                    {locale === "zh" ? "新建广告需求" : "New ad brief"}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 lg:hidden">
                    <MarketingHomeLink locale={locale} className="flex items-center gap-2 font-semibold text-zinc-950">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      {studioOS.productName}
                    </MarketingHomeLink>
                  </div>
                )}
                <div className="hidden lg:block" />
                <div className="flex items-center gap-2 sm:gap-3">
                  <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
                    <LanguageSwitcher locale={locale} pathname={pathname} search={search} />
                  </Suspense>
                  <Link
                    href={withLocale(brandPortalRoutes.messages, locale)}
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50",
                      isWizardCreate && "hidden lg:flex"
                    )}
                    aria-label={locale === "zh" ? "通知" : "Notifications"}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadMessageCount > 0 ? (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    ) : null}
                  </Link>
                  <StudioUserMenu
                    locale={locale}
                    initials={initials}
                    name={brandAccount?.name}
                    profileHref={brandPortalRoutes.brandProfile}
                    roleLabel={locale === "zh" ? "广告主" : "Brand"}
                  />
                </div>
              </div>

              {!isWizardCreate ? (
              <div className="border-t border-zinc-100 px-4 py-3 lg:hidden">
                <PortalMobileNav
                  locale={locale}
                  pathname={pathname}
                  items={brandPortalNavItems
                    .filter((item) => !item.disabled)
                    .map(({ href, labelKey, mobileIconKey }) => ({
                      id: labelKey,
                      href,
                      label: nav[labelKey],
                      iconKey: mobileIconKey
                    }))}
                />
              </div>
              ) : null}
            </header>
          ) : null}

          <main
            className={cn(
              "min-h-0 min-w-0 flex-1",
              isProjectReview
                ? "flex w-full flex-col overflow-hidden p-0"
                : cn(
                    "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 lg:overflow-y-auto",
                    isProfileEditorPage ? "max-w-none" : focusRoute ? "max-w-[920px] lg:max-w-[1280px]" : "max-w-[1280px]"
                  )
            )}
          >
            {children}
          </main>
        </div>
      </div>
      </div>
    </PortalShellChromeProvider>
  );
}
