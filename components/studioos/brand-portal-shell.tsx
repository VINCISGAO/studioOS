import Link from "next/link";
import { Suspense } from "react";
import { PortalMobileNav, type PortalMobileNavIconKey } from "@/components/studioos/portal-mobile-nav";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/language-switcher";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { StudioUserMenu } from "@/components/studioos/studio-user-menu";
import { brandNav, studioOS } from "@/lib/studioos/vocabulary";
import { brandPortalNavItems, type BrandPortalNavItem } from "@/lib/studioos/brand-portal-nav";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

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

  function isActive(item: BrandPortalNavItem) {
    if (item.labelKey === "home") {
      return (
        (pathname === brandPortalRoutes.dashboard ||
          pathname.startsWith("/brand/projects") ||
          pathname.startsWith("/brand/campaigns")) &&
        !/\/brand\/projects\/[^/]+\/review/.test(pathname)
      );
    }
    if (item.labelKey === "reviewRoom") {
      return pathname === brandPortalRoutes.reviewHub || /\/brand\/projects\/[^/]+\/review/.test(pathname);
    }
    if (item.labelKey === "finance") {
      return pathname === brandPortalRoutes.finance || pathname.startsWith("/brand/finance");
    }
    if (item.labelKey === "brandCenter") {
      return pathname === brandPortalRoutes.brandCenter || pathname.startsWith("/brand/brand-center");
    }
    if (item.labelKey === "messages") {
      return pathname === brandPortalRoutes.messages || pathname.startsWith("/brand/messages");
    }
    if (item.labelKey === "attribution") {
      return pathname === brandPortalRoutes.attribution || pathname.startsWith("/brand/attribution");
    }
    if (item.labelKey === "settings") {
      return pathname === brandPortalRoutes.settings || pathname.startsWith("/brand/settings");
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function sidebarLinkClass(active: boolean) {
    return cn(
      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
      active
        ? "bg-gradient-to-r from-zinc-100/90 via-zinc-50 to-white text-zinc-900 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-zinc-200/80 bg-white lg:flex">
          <MarketingHomeLink
            locale={locale}
            className="flex items-center gap-2.5 px-5 py-5 transition hover:opacity-80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950">{studioOS.productName}</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
              {locale === "zh" ? "广告主" : "Brand"}
            </span>
          </MarketingHomeLink>

          <nav className="flex-1 space-y-0.5 px-3">
            {brandPortalNavItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href + item.labelKey}
                  href={withLocale(item.href, locale)}
                  className={sidebarLinkClass(active)}
                >
                  {active ? (
                    <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-zinc-900" />
                  ) : null}
                  <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-zinc-900")} />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span>{nav[item.labelKey]}</span>
                    {item.labelKey === "messages" && unreadMessageCount > 0 ? (
                      <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-zinc-100 p-4">
            {brandAccount ? (
              <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                  {initials.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{brandAccount.name}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {locale === "zh" ? "广告主" : "Brand"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 shrink-0 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
            <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 lg:hidden">
                <MarketingHomeLink locale={locale} className="flex items-center gap-2 font-semibold text-zinc-950">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  {studioOS.productName}
                </MarketingHomeLink>
              </div>
              <div className="hidden lg:block" />
              <div className="flex items-center gap-2 sm:gap-3">
                <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
                  <LanguageSwitcher locale={locale} pathname={pathname} search={search} />
                </Suspense>
                <StudioUserMenu
                  locale={locale}
                  initials={initials}
                  name={brandAccount?.name}
                  profileHref={brandPortalRoutes.brandProfile}
                  roleLabel={locale === "zh" ? "广告主" : "Brand"}
                />
              </div>
            </div>

            <div className="border-t border-zinc-100 px-4 py-3 lg:hidden">
              <PortalMobileNav
                locale={locale}
                pathname={pathname}
                items={brandPortalNavItems.map(({ href, labelKey }) => ({
                  id: labelKey,
                  href,
                  label: nav[labelKey],
                  iconKey: labelKey as PortalMobileNavIconKey
                }))}
              />
            </div>
          </header>

          <main
            className={cn(
              "flex-1 px-4 py-6 sm:px-6 lg:px-8",
              isProjectReview ? "lg:py-6" : "lg:py-8",
              !isProjectReview && (focus ? "max-w-[1600px]" : "max-w-6xl")
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
