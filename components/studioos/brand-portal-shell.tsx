import Link from "next/link";
import { Suspense } from "react";
import { PortalMobileNav } from "@/components/studioos/portal-mobile-nav";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/language-switcher";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { StudioUserMenu } from "@/components/studioos/studio-user-menu";
import { brandNav, studioOS } from "@/lib/studioos/vocabulary";
import { brandPortalNavItems, type BrandPortalNavItem } from "@/lib/studioos/brand-portal-nav";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
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
  pathname,
  search,
  unreadMessageCount = 0,
  brandAccount,
  children
}: {
  locale: Locale;
  pathname: string;
  search: string;
  unreadMessageCount?: number;
  brandAccount?: { name: string; email: string } | null;
  children: React.ReactNode;
}) {
  const nav = brandNav[locale];
  const initials = brandAccount ? brandInitials(brandAccount.name) : "BR";
  const isProjectReview = /\/brand\/projects\/[^/]+\/review/.test(pathname);

  const focus =
    !isProjectReview &&
    (pathname.includes("/projects/new") ||
    pathname.includes("/studios") ||
    pathname.includes("/checkout") ||
    /\/brand\/(campaigns|projects)\/[^/]+$/.test(pathname));

  const isWizardCreate = pathname.includes("/projects/new");

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
        pathname.startsWith("/brand/finance") ||
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

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="flex min-h-screen">
        {!isWizardCreate ? (
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-zinc-200/80 bg-white lg:flex">
          <MarketingHomeLink
            locale={locale}
            className="flex items-center gap-2.5 px-5 py-5 transition hover:opacity-80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950">
                {locale === "zh" ? "品牌工作台" : "Brand workspace"}
              </p>
              <p className="truncate text-[11px] text-zinc-500">{studioOS.productName}</p>
            </div>
          </MarketingHomeLink>

          <nav className="flex-1 space-y-0.5 px-3">
            {brandPortalNavItems.map((item) => {
              const active = isActive(item);
              const workspaceActive = item.labelKey === "workspace" && active;
              const Icon = item.icon ?? LayoutDashboard;
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

          <div className="mt-auto space-y-3 border-t border-zinc-100 p-4">
            <div className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50/50 p-4">
              <div className="relative h-16 rounded-xl bg-white/60" aria-hidden>
                <div className="absolute left-3 top-3 h-8 w-8 rounded-lg bg-violet-200/80" />
                <div className="absolute right-4 top-5 h-6 w-6 rounded-full bg-indigo-300/80" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-900">
                {locale === "zh" ? "提升合作效率" : "Work better together"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {locale === "zh" ? "邀请团队成员一起管理广告项目" : "Invite teammates to manage campaigns"}
              </p>
              <Link
                href={withLocale(brandPortalRoutes.brandTeam, locale)}
                className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-violet-600 px-4 text-xs font-medium text-white hover:bg-violet-700"
              >
                {locale === "zh" ? "邀请成员" : "Invite members"}
              </Link>
            </div>
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
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 shrink-0 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
            <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
              {isWizardCreate ? (
                <Link
                  href={withLocale(brandPortalRoutes.dashboard, locale)}
                  className="flex items-center gap-2.5 text-sm font-semibold text-zinc-950"
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
              {!isWizardCreate ? <div className="hidden lg:block" /> : null}
              <div className="flex items-center gap-2 sm:gap-3">
                <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
                  <LanguageSwitcher locale={locale} pathname={pathname} search={search} />
                </Suspense>
                {!isWizardCreate ? (
                  <Link
                    href={withLocale(brandPortalRoutes.messages, locale)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
                    aria-label={locale === "zh" ? "通知" : "Notifications"}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadMessageCount > 0 ? (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    ) : null}
                  </Link>
                ) : null}
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
                items={brandPortalNavItems.map(({ href, labelKey, mobileIconKey }) => ({
                  id: labelKey,
                  href,
                  label: nav[labelKey],
                  iconKey: mobileIconKey
                }))}
              />
            </div>
            ) : null}
          </header>

          <main
            className={cn(
              "flex-1 px-4 py-6 sm:px-6 lg:px-8",
              isProjectReview ? "lg:py-6" : "lg:py-8",
              !isProjectReview && (focus ? "mx-auto max-w-6xl" : "mx-auto max-w-6xl")
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
