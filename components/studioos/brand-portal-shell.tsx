import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/app/actions";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/language-switcher";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import { Button } from "@/components/ui/button";
import { brandNav, studioOS } from "@/lib/studioos/vocabulary";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Clapperboard,
  LayoutDashboard,
  Plus,
  Receipt,
  Sparkles,
  UserRound,
  Wallet
} from "lucide-react";

type NavItem = {
  href: string;
  labelKey: keyof typeof brandNav.en;
  icon: typeof LayoutDashboard;
};

const navItems: NavItem[] = [
  { href: brandPortalRoutes.dashboard, labelKey: "dashboard", icon: LayoutDashboard },
  { href: brandPortalRoutes.newProject, labelKey: "newBrief", icon: Plus },
  { href: brandPortalRoutes.reviewHub, labelKey: "reviewRoom", icon: Clapperboard },
  { href: brandPortalRoutes.settlement, labelKey: "settlement", icon: Wallet },
  { href: brandPortalRoutes.invoices, labelKey: "invoices", icon: Receipt },
  { href: brandPortalRoutes.attribution, labelKey: "analytics", icon: BarChart3 },
  { href: brandPortalRoutes.profile, labelKey: "team", icon: UserRound }
];

export function BrandPortalShell({
  locale,
  pathname,
  search,
  children
}: {
  locale: Locale;
  pathname: string;
  search: string;
  children: React.ReactNode;
}) {
  const nav = brandNav[locale];
  const isReviewRoom =
    /\/brand\/projects\/[^/]+\/review/.test(pathname) ||
    /\/brand\/orders\/[^/]+\/review/.test(pathname);

  const focus =
    !isReviewRoom &&
    (pathname.includes("/review") ||
      pathname.includes("/projects/new") ||
      pathname.includes("/studios") ||
      pathname.includes("/checkout") ||
      /\/brand\/projects\/[^/]+$/.test(pathname));

  if (isReviewRoom) {
    return <div className="min-h-svh bg-[#f4f7fb]">{children}</div>;
  }

  function isActive(item: NavItem) {
    if (item.labelKey === "dashboard") {
      return pathname === brandPortalRoutes.dashboard;
    }
    if (item.labelKey === "newBrief") {
      return pathname.startsWith("/brand/projects/new") || pathname.includes("/brief/");
    }
    if (item.labelKey === "reviewRoom") {
      return (
        pathname === brandPortalRoutes.reviewHub ||
        pathname.startsWith("/brand/review") ||
        /\/workspace\/projects\/[^/]+\/review$/.test(pathname)
      );
    }
    if (item.labelKey === "invoices") {
      return pathname === brandPortalRoutes.invoices || pathname.startsWith("/brand/invoices");
    }
    if (item.labelKey === "settlement") {
      return pathname === brandPortalRoutes.settlement || pathname.startsWith("/brand/settlement");
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
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
              {locale === "zh" ? "品牌" : "Brand"}
            </span>
          </MarketingHomeLink>

          <nav className="flex-1 space-y-0.5 px-3">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href + item.labelKey}
                  href={withLocale(item.href, locale)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-gradient-to-r from-zinc-100/90 via-zinc-50 to-white text-zinc-900 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                >
                  {active ? (
                    <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-zinc-900" />
                  ) : null}
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{nav[item.labelKey]}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-zinc-100 p-4">
            <BrandStartBriefButton
              locale={locale}
              size="sm"
              className="h-10 w-full rounded-xl bg-zinc-900 hover:bg-zinc-800"
              label={locale === "zh" ? "发布广告" : "Create ad"}
            />
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
              <div className="flex items-center gap-2">
                <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
                  <LanguageSwitcher locale={locale} pathname={pathname} search={search} />
                </Suspense>
                <form action={signOutAction}>
                  <input type="hidden" name="lang" value={locale} />
                  <Button type="submit" variant="outline" size="sm" className="rounded-xl">
                    {locale === "zh" ? "退出" : "Sign out"}
                  </Button>
                </form>
              </div>
            </div>
          </header>

          <main
            className={cn(
              "flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
              focus ? "max-w-[1600px]" : "max-w-5xl"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
