import Link from "next/link";
import { PortalMobileNav, type PortalMobileNavIconKey } from "@/components/studioos/portal-mobile-nav";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { signOutAction } from "@/app/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { studioOS } from "@/lib/studioos/vocabulary";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Building2,
  Clapperboard,
  CreditCard,
  Flag,
  Headphones,
  Home,
  LayoutDashboard,
  LogOut,
  Crown,
  Scale,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

const navItems = [
  { href: adminPortalRoutes.dashboard, label: { en: "Overview", zh: "总览" }, iconKey: "layoutDashboard" as const, icon: LayoutDashboard },
  { href: adminPortalRoutes.brands, label: { en: "Brands", zh: "Brands" }, iconKey: "brands" as const, icon: Building2 },
  { href: adminPortalRoutes.projects, label: { en: "Projects", zh: "Projects" }, iconKey: "adminProjects" as const, icon: Clapperboard },
  { href: adminPortalRoutes.studios, label: { en: "Studios", zh: "Studios" }, iconKey: "studios" as const, icon: Users },
  { href: adminPortalRoutes.payments, label: { en: "Payments", zh: "Payments" }, iconKey: "payments" as const, icon: CreditCard },
  { href: adminPortalRoutes.membership, label: { en: "Membership", zh: "会员" }, iconKey: "membership" as const, icon: Crown },
  { href: adminPortalRoutes.disputes, label: { en: "Disputes", zh: "争议" }, iconKey: "disputes" as const, icon: Scale },
  { href: adminPortalRoutes.audit, label: { en: "Audit", zh: "审计" }, iconKey: "audit" as const, icon: ScrollText },
  { href: adminPortalRoutes.featureFlags, label: { en: "Flags", zh: "开关" }, iconKey: "featureFlags" as const, icon: Flag },
  { href: adminPortalRoutes.quality, label: { en: "Quality", zh: "Quality" }, iconKey: "quality" as const, icon: ShieldCheck },
  { href: adminPortalRoutes.support, label: { en: "Support", zh: "Support" }, iconKey: "support" as const, icon: Headphones }
];

export function AdminPortalShell({
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
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <MarketingHomeLink locale={locale} className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            {studioOS.productName}
            <span className="hidden text-xs font-normal text-zinc-500 sm:inline">Admin</span>
          </MarketingHomeLink>
          <div className="flex items-center gap-2">
            <MarketingHomeLink
              locale={locale}
              className="hidden inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 sm:inline-flex"
            >
              <Home className="h-4 w-4" />
              {locale === "zh" ? "首页" : "Home"}
            </MarketingHomeLink>
            <LanguageSwitcher locale={locale} pathname={pathname} search={search} />
            <form action={signOutAction}>
              <input type="hidden" name="lang" value={locale} />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                aria-label={locale === "zh" ? "退出" : "Sign out"}
                className="h-9 gap-2 px-2.5 sm:px-3"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{locale === "zh" ? "退出" : "Sign out"}</span>
              </Button>
            </form>
          </div>
        </div>
        <div className="border-t border-zinc-100 px-4 py-3 sm:px-6 lg:hidden">
          <PortalMobileNav
            locale={locale}
            pathname={pathname}
            items={[
              { id: "home", href: "/", label: locale === "zh" ? "首页" : "Home", iconKey: "home" },
              ...navItems.map(({ href, label, iconKey }) => ({
                id: href,
                href,
                label: label[locale],
                iconKey
              }))
            ]}
          />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href !== adminPortalRoutes.dashboard && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={withLocale(href, locale)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-white hover:text-zinc-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label[locale]}
                </Link>
              );
            })}
            <MarketingHomeLink
              locale={locale}
              className="mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-white hover:text-zinc-900"
            >
              <Home className="h-4 w-4" />
              {locale === "zh" ? "返回首页" : "Back to home"}
            </MarketingHomeLink>
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
