import Link from "next/link";
import { Suspense } from "react";
import { PortalMobileNav } from "@/components/studioos/portal-mobile-nav";
import { StudioNotificationBell } from "@/components/studioos/studio-notification-bell";
import { StudioUserMenu } from "@/components/studioos/studio-user-menu";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { signOutAction } from "@/app/actions";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { studioNav, studioOS } from "@/lib/studioos/vocabulary";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { CreatorNotification } from "@/lib/notification-types";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Clapperboard,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  Receipt,
  Settings,
  Shield,
  Sparkles,
  Upload
} from "lucide-react";

type NavItem = {
  href: string;
  labelKey: keyof typeof studioNav.en;
  icon: typeof Home;
  requiresCertification: boolean;
  showUnreadDot?: boolean;
};

const navItems: NavItem[] = [
  { href: "/studio/profile", labelKey: "home", icon: Home, requiresCertification: false },
  { href: "/studio/deposit", labelKey: "deposit", icon: Shield, requiresCertification: false },
  { href: "/studio", labelKey: "dashboard", icon: LayoutDashboard, requiresCertification: true },
  { href: "/workspace/studio", labelKey: "reviewRoom", icon: Clapperboard, requiresCertification: true },
  { href: "/studio/delivery", labelKey: "upload", icon: Upload, requiresCertification: true },
  { href: "/studio/income", labelKey: "income", icon: Receipt, requiresCertification: true },
  {
    href: "/studio/messages",
    labelKey: "messages",
    icon: MessageSquare,
    requiresCertification: true,
    showUnreadDot: true
  },
  { href: "/studio/settings", labelKey: "settings", icon: Settings, requiresCertification: false }
];

function studioInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function StudioPortalShell({
  locale,
  pathname,
  search,
  creator,
  certificationPaid = true,
  profileComplete = true,
  notifications = [],
  unreadCount = 0,
  children
}: {
  locale: Locale;
  pathname: string;
  search: string;
  creator?: Creator | null;
  certificationPaid?: boolean;
  profileComplete?: boolean;
  notifications?: CreatorNotification[];
  unreadCount?: number;
  children: React.ReactNode;
}) {
  const nav = studioNav[locale];
  const studioUnlocked = certificationPaid && profileComplete;
  const initials = creator ? studioInitials(creator.name) : "ST";

  function navHref(item: NavItem) {
    if (!certificationPaid && item.requiresCertification) {
      return withLocale("/studio/deposit", locale);
    }
    if (certificationPaid && !profileComplete && item.requiresCertification) {
      return withLocale("/studio/profile?onboarding=1", locale);
    }
    return withLocale(item.href, locale);
  }

  function isNavLocked(item: NavItem) {
    return item.requiresCertification && !studioUnlocked;
  }

  function isActive(item: NavItem) {
    const href = item.href;
    if (item.labelKey === "home") {
      return pathname === "/studio/profile" || pathname.startsWith("/studio/profile/");
    }
    if (item.labelKey === "settings") {
      return pathname === "/studio/settings" || pathname.startsWith("/studio/settings/");
    }
    if (item.labelKey === "upload") {
      return (
        pathname === "/studio/delivery" ||
        pathname.startsWith("/studio/delivery/") ||
        pathname === "/studio/upload" ||
        pathname.startsWith("/studio/review/")
      );
    }
    return (
      pathname === href ||
      (href === "/studio" && (pathname === "/studio" || pathname.startsWith("/studio/projects"))) ||
      (href !== "/studio" &&
        href !== "/workspace/studio" &&
        (pathname === href || pathname.startsWith(`${href}/`))) ||
      (href === "/workspace/studio" &&
        (pathname.startsWith("/workspace/studio") ||
          /\/workspace\/projects\/[^/]+\/review$/.test(pathname)))
    );
  }

  function sidebarLinkClass(active: boolean, locked: boolean) {
    return cn(
      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
      locked
        ? "text-zinc-400"
        : active
          ? "bg-gradient-to-r from-zinc-100/90 via-zinc-50 to-white text-zinc-900 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
    );
  }

  const isReviewPage = /\/workspace\/projects\/[^/]+\/review$/.test(pathname);

  return (
    <div className={cn(isReviewPage ? "h-screen overflow-hidden bg-white" : "min-h-screen bg-[#f4f7fb]")}>
      <div className={cn("flex", isReviewPage ? "h-full" : "min-h-screen")}>
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-zinc-200/80 bg-white lg:flex">
          <MarketingHomeLink
            locale={locale}
            className="flex items-center gap-2.5 px-5 py-5 transition hover:opacity-80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950">{studioOS.productName}</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">Studio</span>
          </MarketingHomeLink>

          <nav className="flex-1 space-y-0.5 px-3">
            {navItems.map((item) => {
              const { labelKey, icon: Icon, showUnreadDot } = item;
              const active = isActive(item);
              const locked = isNavLocked(item);
              const ItemIcon = locked ? Lock : Icon;

              return (
                <Link
                  key={item.href + labelKey}
                  href={navHref(item)}
                  className={sidebarLinkClass(active && !locked, locked)}
                  title={
                    locked
                      ? !certificationPaid
                        ? locale === "zh"
                          ? "请先完成认证服务商"
                          : "Complete certification first"
                        : locale === "zh"
                          ? "请先完善 Studio 主页"
                          : "Complete your studio profile first"
                      : undefined
                  }
                >
                  {active && !locked ? (
                    <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-zinc-900" />
                  ) : null}
                  <ItemIcon className={cn("h-[18px] w-[18px] shrink-0", active && !locked && "text-zinc-900")} />
                  <span className="flex-1">{nav[labelKey]}</span>
                  {showUnreadDot && unreadCount > 0 && !locked ? (
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 border-t border-zinc-100 p-4">
            {creator ? (
              <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                  {initials.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{creator.name}</p>
                  <p className="truncate text-xs text-zinc-500">{nav.studioOwner}</p>
                </div>
              </div>
            ) : null}
            <form action={signOutAction}>
              <input type="hidden" name="lang" value={locale} />
              <Button
                type="submit"
                variant="ghost"
                className="h-10 w-full justify-start gap-2 rounded-xl px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              >
                <LogOut className="h-4 w-4" />
                {locale === "zh" ? "退出登录" : "Sign out"}
              </Button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 shrink-0 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
            <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
              {!isReviewPage ? (
                <div className="flex items-center gap-2 lg:hidden">
                  <MarketingHomeLink locale={locale} className="flex items-center gap-2 font-semibold text-zinc-950">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    {studioOS.productName}
                  </MarketingHomeLink>
                </div>
              ) : (
                <div className="hidden lg:block" />
              )}
              {!isReviewPage ? <div className="hidden lg:block" /> : null}

              <div className={cn("flex items-center gap-2 sm:gap-3", isReviewPage && "ml-auto")}>
                <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
                  <LanguageSwitcher locale={locale} pathname={pathname} search={search} />
                </Suspense>
                {studioUnlocked ? (
                  <StudioNotificationBell
                    locale={locale}
                    notifications={notifications}
                    unreadCount={unreadCount}
                  />
                ) : null}
                <StudioUserMenu locale={locale} initials={initials} name={creator?.name} />
              </div>
            </div>

            {!isReviewPage ? (
              <div className="border-t border-zinc-100 px-4 py-3 lg:hidden">
                <PortalMobileNav
                  locale={locale}
                  pathname={pathname}
                  items={navItems.map(({ href, labelKey, icon, requiresCertification }) => ({
                    id: labelKey,
                    href:
                      !certificationPaid && requiresCertification
                        ? "/studio/deposit"
                        : certificationPaid && !profileComplete && requiresCertification
                          ? "/studio/profile?onboarding=1"
                          : href,
                    label: nav[labelKey],
                    icon: requiresCertification && !studioUnlocked ? Lock : icon
                  }))}
                />
              </div>
            ) : null}
          </header>

          <main
            className={cn(
              "min-h-0 min-w-0 flex-1",
              isReviewPage ? "flex flex-col overflow-hidden p-0" : "px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
