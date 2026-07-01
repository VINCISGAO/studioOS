import Link from "next/link";
import { PortalMobileNav } from "@/components/studioos/portal-mobile-nav";
import { signOutAction } from "@/app/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { adminNavLabels, type AdminNavKey } from "@/lib/studioos/admin-i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  BookOpen,
  Building2,
  CreditCard,
  Flag,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  LineChart,
  LogOut,
  Megaphone,
  Monitor,
  Scale,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet
} from "lucide-react";

type NavItem = {
  key: AdminNavKey;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconKey: string;
  section?: "primary" | "secondary";
};

const navItems: NavItem[] = [
  { key: "dashboard", href: adminPortalRoutes.dashboard, icon: LayoutDashboard, iconKey: "layoutDashboard", section: "primary" },
  { key: "campaigns", href: adminPortalRoutes.campaigns, icon: Megaphone, iconKey: "campaigns", section: "primary" },
  { key: "brands", href: adminPortalRoutes.brands, icon: Building2, iconKey: "brands", section: "primary" },
  { key: "studios", href: adminPortalRoutes.studios, icon: Users, iconKey: "studios", section: "primary" },
  { key: "payments", href: adminPortalRoutes.payments, icon: CreditCard, iconKey: "payments", section: "primary" },
  { key: "settlements", href: adminPortalRoutes.settlements, icon: ArrowDownToLine, iconKey: "settlements", section: "primary" },
  { key: "wallets", href: adminPortalRoutes.wallets, icon: Wallet, iconKey: "adminWallets", section: "primary" },
  { key: "withdrawals", href: adminPortalRoutes.withdrawals, icon: ArrowUpFromLine, iconKey: "withdrawals", section: "primary" },
  { key: "ledger", href: adminPortalRoutes.ledger, icon: BookOpen, iconKey: "ledger", section: "primary" },
  { key: "notifications", href: adminPortalRoutes.notifications, icon: Bell, iconKey: "notifications", section: "primary" },
  { key: "activityLog", href: adminPortalRoutes.activityLog, icon: Activity, iconKey: "activityLog", section: "primary" },
  { key: "disputes", href: adminPortalRoutes.disputes, icon: Scale, iconKey: "disputes", section: "primary" },
  { key: "analytics", href: adminPortalRoutes.analytics, icon: LineChart, iconKey: "analytics", section: "primary" },
  { key: "featureFlags", href: adminPortalRoutes.featureFlags, icon: Flag, iconKey: "featureFlags", section: "secondary" },
  { key: "audit", href: adminPortalRoutes.audit, icon: ScrollText, iconKey: "audit", section: "secondary" },
  { key: "settings", href: adminPortalRoutes.settings, icon: Settings, iconKey: "settings", section: "secondary" },
  { key: "system", href: adminPortalRoutes.system, icon: Monitor, iconKey: "monitoring", section: "secondary" },
  { key: "finance", href: adminPortalRoutes.finance, icon: Wallet, iconKey: "finance", section: "secondary" },
  { key: "monitoring", href: adminPortalRoutes.monitoring, icon: Monitor, iconKey: "monitoring", section: "secondary" },
  { key: "certification", href: adminPortalRoutes.certification, icon: ShieldCheck, iconKey: "quality", section: "secondary" },
  { key: "partners", href: adminPortalRoutes.partners, icon: Users, iconKey: "brands", section: "secondary" },
  { key: "academy", href: adminPortalRoutes.academy, icon: GraduationCap, iconKey: "support", section: "secondary" },
  { key: "support", href: adminPortalRoutes.support, icon: Headphones, iconKey: "support", section: "secondary" }
];

function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== adminPortalRoutes.dashboard && pathname.startsWith(href));
}

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
  const primaryItems = navItems.filter((item) => item.section === "primary");
  const secondaryItems = navItems.filter((item) => item.section === "secondary");

  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-zinc-100 px-5 py-5">
            <Link href={withLocale(adminPortalRoutes.dashboard, locale)} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">StudioOS Admin</p>
                <p className="text-xs text-zinc-500">{locale === "zh" ? "管理后台" : "Control center"}</p>
              </div>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {primaryItems.map(({ key, href, icon: Icon }) => {
                const active = isNavActive(pathname, href);
                return (
                  <Link
                    key={key}
                    href={withLocale(href, locale)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {adminNavLabels[key][locale]}
                  </Link>
                );
              })}
            </div>
            <div className="my-4 border-t border-zinc-100" />
            <div className="space-y-1">
              {secondaryItems.map(({ key, href, icon: Icon }) => {
                const active = isNavActive(pathname, href);
                return (
                  <Link
                    key={key}
                    href={withLocale(href, locale)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition",
                      active ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {adminNavLabels[key][locale]}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="border-t border-zinc-100 px-5 py-4 text-xs text-zinc-400">
            {locale === "zh" ? "点击侧边栏可折叠（即将推出）" : "Sidebar collapse coming soon"}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
            <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
              <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  readOnly
                  placeholder={locale === "zh" ? "搜索活动、用户、交易…" : "Search campaigns, users, transactions…"}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-600"
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600"
                  aria-label={locale === "zh" ? "通知" : "Notifications"}
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    3
                  </span>
                </button>
                <LanguageSwitcher locale={locale} pathname={pathname} search={search} />
                <div className="hidden items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 sm:flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                    A
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">Admin</p>
                    <p className="text-[11px] text-zinc-500">{locale === "zh" ? "超级管理员" : "Super Admin"}</p>
                  </div>
                </div>
                <form action={signOutAction}>
                  <input type="hidden" name="lang" value={locale} />
                  <Button type="submit" variant="outline" size="sm" className="h-9 gap-2 px-2.5">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">{locale === "zh" ? "退出" : "Sign out"}</span>
                  </Button>
                </form>
              </div>
            </div>
            <div className="border-t border-zinc-100 px-4 py-3 lg:hidden">
              <PortalMobileNav
                locale={locale}
                pathname={pathname}
                items={navItems.map(({ href, key, iconKey }) => ({
                  id: href,
                  href,
                  label: adminNavLabels[key][locale],
                  iconKey
                }))}
              />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
