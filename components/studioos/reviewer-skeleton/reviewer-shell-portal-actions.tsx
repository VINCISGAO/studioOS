"use client";

import Link from "next/link";
import { Suspense } from "react";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/language-switcher";
import { usePortalShellChrome } from "@/components/studioos/portal-shell-chrome-context";
import { StudioNotificationBell } from "@/components/studioos/studio-notification-bell";
import { StudioUserMenu } from "@/components/studioos/studio-user-menu";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

export function ReviewerShellPortalActions({ locale }: { locale: Locale }) {
  const chrome = usePortalShellChrome();

  if (!chrome) {
    return (
      <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
        <LanguageSwitcher locale={locale} />
      </Suspense>
    );
  }

  const unread = chrome.unreadMessageCount;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
        <LanguageSwitcher locale={locale} />
      </Suspense>

      {chrome.showNotificationBell && chrome.notifications ? (
        <StudioNotificationBell
          locale={locale}
          notifications={chrome.notifications}
          unreadCount={unread}
          badgeCount={unread}
        />
      ) : chrome.messagesHref ? (
        <Link
          href={withLocale(chrome.messagesHref, locale)}
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
          )}
          aria-label={locale === "zh" ? "通知" : "Notifications"}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          ) : null}
        </Link>
      ) : null}

      <StudioUserMenu
        locale={locale}
        initials={chrome.initials}
        name={chrome.userName}
        profileHref={chrome.profileHref}
        roleLabel={chrome.roleLabel}
      />
    </div>
  );
}
