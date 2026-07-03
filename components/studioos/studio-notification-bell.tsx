"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction
} from "@/app/studio-notification-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { CreatorNotification } from "@/lib/notification-types";
import { resolveCreatorNotificationAction } from "@/lib/studioos/commercial-notification-routes";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

const copy = {
  en: {
    title: "Notifications",
    empty: "No new notifications.",
    emptyHint: "Read messages stay in the message center.",
    markAll: "Mark all read",
    viewAll: "View all messages",
    viewBrief: "Open project workspace",
    clientBrief: "Confirmed client brief"
  },
  zh: {
    title: "通知",
    empty: "暂无新通知",
    emptyHint: "已读消息可在消息中心查看",
    markAll: "全部已读",
    viewAll: "查看全部消息",
    viewBrief: "进入项目工作台",
    clientBrief: "正式需求表单"
  }
};

export function StudioNotificationBell({
  locale,
  notifications,
  unreadCount,
  badgeCount = unreadCount,
  onBadgeSeen
}: {
  locale: Locale;
  notifications: CreatorNotification[];
  unreadCount: number;
  badgeCount?: number;
  onBadgeSeen?: () => void;
}) {
  const t = copy[locale];
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const unreadNotifications = notifications.filter((notification) => !notification.read_at);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }
  }, [open]);

  function handleOpenNotification(notification: CreatorNotification) {
    const action = resolveCreatorNotificationAction(
      {
        type: notification.type,
        order_id: notification.order_id,
        project_id: notification.project_id
      },
      locale
    );

    startTransition(async () => {
      if (!notification.read_at) {
        const fd = new FormData();
        fd.set("notification_id", notification.id);
        await markNotificationReadAction(fd);
      }
      setOpen(false);
      router.push(action.href);
      router.refresh();
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div ref={panelRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={t.title}
        className="relative h-9 w-9 px-0 text-zinc-600"
        onClick={() => {
          setOpen((value) => !value);
          onBadgeSeen?.();
        }}
      >
        <Bell className="h-4 w-4" />
        {badgeCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">{t.title}</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
                disabled={isPending}
                onClick={handleMarkAllRead}
              >
                {t.markAll}
              </button>
            ) : null}
          </div>

          <ul className="max-h-[28rem] overflow-y-auto">
            {unreadNotifications.length ? (
              unreadNotifications.slice(0, 12).map((notification) => {
                const action = resolveCreatorNotificationAction(
                  {
                    type: notification.type,
                    order_id: notification.order_id,
                    project_id: notification.project_id
                  },
                  locale
                );
                return (
                <li key={notification.id} className="border-b border-zinc-50 last:border-0">
                  <button
                    type="button"
                    className={cn(
                      "w-full px-4 py-3 text-left transition hover:bg-zinc-50",
                      !notification.read_at && "bg-zinc-50/80"
                    )}
                    disabled={isPending}
                    onClick={() => handleOpenNotification(notification)}
                  >
                    <div className="flex items-start gap-2">
                      {!notification.read_at ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900">{notification.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-zinc-500">{notification.body}</p>
                        {notification.requirements_text ? (
                          <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-100">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                              {t.clientBrief}
                            </p>
                            <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap text-xs leading-5 text-zinc-700">
                              {notification.requirements_text}
                            </pre>
                          </div>
                        ) : null}
                        <span className="mt-2 inline-flex text-xs font-semibold text-rose-600 underline-offset-2 hover:text-rose-700 hover:underline">
                          {action.label}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
              })
            ) : (
              <li className="px-4 py-8 text-center">
                <p className="text-sm text-zinc-400">{t.empty}</p>
                <p className="mt-1 text-xs text-zinc-400">{t.emptyHint}</p>
              </li>
            )}
          </ul>

          <div className="border-t border-zinc-100 px-4 py-2.5">
            <Link
              href={withLocale("/studio/messages", locale)}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              onClick={() => setOpen(false)}
            >
              {t.viewAll}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
