import Link from "next/link";
import { Suspense } from "react";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/language-switcher";
import { StudioNotificationBell } from "@/components/studioos/studio-notification-bell";
import { withLocale, type Locale } from "@/lib/i18n";
import type { MvpRole } from "@/lib/mvp/types";
import type { CreatorNotification } from "@/lib/notification-types";
import { StudioUserMenu } from "@/components/studioos/studio-user-menu";
import { Sparkles } from "lucide-react";

export function ReviewFocusShell({
  locale,
  pathname,
  search,
  role,
  projectTitle,
  breadcrumbs,
  notifications = [],
  unreadCount = 0,
  showDecisionCta = false,
  children
}: {
  locale: Locale;
  pathname: string;
  search: string;
  role: MvpRole;
  projectTitle?: string;
  breadcrumbs?: string;
  notifications?: CreatorNotification[];
  unreadCount?: number;
  showDecisionCta?: boolean;
  children: React.ReactNode;
}) {
  const backHref =
    role === "studio"
      ? withLocale("/workspace/studio", locale)
      : role === "brand"
        ? withLocale("/workspace/brand", locale)
        : withLocale("/workspace/admin", locale);

  const reviewLabel = locale === "zh" ? "审片中心" : "Review center";

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={withLocale("/workspace", locale)} className="hidden items-center gap-2 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-semibold text-zinc-950">StudioOS</span>
            </Link>
            <nav className="flex min-w-0 items-center gap-1.5 text-sm text-zinc-500">
              <Link href={backHref} className="shrink-0 hover:text-zinc-900">
                {reviewLabel}
              </Link>
              <span className="text-zinc-300">›</span>
              <span className="truncate font-medium text-zinc-900">
                {breadcrumbs ?? projectTitle ?? (locale === "zh" ? "审片" : "Review")}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {showDecisionCta ? (
              <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/80 sm:inline">
                {locale === "zh" ? "进行中" : "In progress"}
              </span>
            ) : null}
            <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
              <LanguageSwitcher locale={locale} pathname={pathname} search={search} />
            </Suspense>
            {notifications.length ? (
              <StudioNotificationBell locale={locale} notifications={notifications} unreadCount={unreadCount} />
            ) : null}
            <StudioUserMenu locale={locale} initials="NM" name={locale === "zh" ? "Nova Motion Studio" : "Nova Motion Studio"} />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}
