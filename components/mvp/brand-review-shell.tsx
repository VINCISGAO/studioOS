import Link from "next/link";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { StudioNotificationBell } from "@/components/studioos/studio-notification-bell";
import { StudioUserMenu } from "@/components/studioos/studio-user-menu";
import { Button } from "@/components/ui/button";
import { brandNav } from "@/lib/studioos/vocabulary";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { MvpProfile } from "@/lib/mvp/types";
import type { CreatorNotification } from "@/lib/notification-types";
import { cn } from "@/lib/utils";
import { Clapperboard, LayoutGrid, LogOut, Settings } from "lucide-react";

const brandReviewNav = [
  { href: "/brand", labelKey: "dashboard" as const, icon: LayoutGrid },
  { href: "/workspace/brand", labelKey: "reviewRoom" as const, icon: Clapperboard },
  { href: "/brand/profile", labelKey: "team" as const, icon: Settings }
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function BrandReviewShell({
  locale,
  pathname,
  search,
  profile,
  notifications = [],
  unreadCount = 0,
  reviewMode = false,
  children
}: {
  locale: Locale;
  pathname: string;
  search: string;
  profile: MvpProfile;
  notifications?: CreatorNotification[];
  unreadCount?: number;
  /** Full-height review room — no shell header or main padding */
  reviewMode?: boolean;
  children: React.ReactNode;
}) {
  const nav = brandNav[locale];

  function sidebarLinkClass(active: boolean) {
    return cn(
      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
      active
        ? "bg-gradient-to-r from-zinc-100/90 via-zinc-50 to-white text-zinc-900 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
    );
  }

  function isActive(href: string) {
    if (href === "/workspace/brand") {
      return pathname.includes("/review") || pathname.startsWith("/workspace/brand");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const userInitials = initials(profile.name);

  return (
    <div className={cn("bg-white text-zinc-900", reviewMode ? "h-screen overflow-hidden" : "min-h-screen")}>
      <div className={cn("flex", reviewMode ? "h-full" : "min-h-screen")}>
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-zinc-200/80 bg-white lg:flex">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <BrandLogoLockup
              contrastOn="light"
              markClassName="h-8 w-8 rounded-lg shadow-sm"
              wordmarkClassName="h-[17px] w-[106px]"
              priority
            />
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
              {locale === "zh" ? "品牌" : "Brand"}
            </span>
          </div>

          <nav className="flex-1 space-y-0.5 px-3">
            {brandReviewNav.map(({ href, labelKey, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={withLocale(href, locale)} className={sidebarLinkClass(active)}>
                  {active ? (
                    <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-zinc-900" />
                  ) : null}
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{nav[labelKey]}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 border-t border-zinc-100 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                {userInitials.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">{profile.company_name ?? profile.name}</p>
                <p className="truncate text-xs text-zinc-500">{locale === "zh" ? "品牌方" : "Brand"}</p>
              </div>
            </div>
            <form action="/auth/sign-out" method="post">
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
            <div className="flex h-14 items-center justify-end gap-2 px-4 sm:px-6 lg:px-8">
              {notifications.length ? (
                <StudioNotificationBell locale={locale} notifications={notifications} unreadCount={unreadCount} />
              ) : null}
              <StudioUserMenu
                locale={locale}
                initials={userInitials}
                name={profile.name}
                profileHref={reviewMode ? "/brand/profile" : undefined}
                roleLabel={reviewMode ? (locale === "zh" ? "品牌方" : "Brand") : undefined}
                profileMenuLabel={reviewMode ? (locale === "zh" ? "我的主页" : "My page") : undefined}
                imageFit="photo"
              />
            </div>
          </header>
          <main
            className={cn(
              "min-h-0 min-w-0 flex-1",
              reviewMode ? "flex flex-col overflow-hidden p-0" : "px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
