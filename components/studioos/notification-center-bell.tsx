"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Bell, CheckCheck, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { normalizeInternalActionHref } from "@/lib/studioos/internal-action-href";
import { cn } from "@/lib/utils";

type NotificationCategory =
  | "AI"
  | "PAYMENT"
  | "MATCHING"
  | "INVITATION"
  | "COLLABORATION"
  | "DELIVERY"
  | "REVIEW"
  | "REVISION"
  | "SETTLEMENT"
  | "ARBITRATION"
  | "MEMBERSHIP"
  | "ATTRIBUTION"
  | "SYSTEM";

export type NotificationCenterItem = {
  id: string;
  userId: string;
  campaignId: string | null;
  type: string;
  category: NotificationCategory;
  eventName: string | null;
  title: string;
  content: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
};

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
};

const copy = {
  en: {
    title: "Notification Center",
    empty: "No notifications yet.",
    markAll: "Read all",
    open: "Open",
    unread: "unread",
    newToast: "New notification"
  },
  zh: {
    title: "消息中心",
    empty: "暂无通知",
    markAll: "全部已读",
    open: "查看",
    unread: "未读",
    newToast: "新通知"
  }
};

const categoryCopy: Record<NotificationCategory, { en: string; zh: string }> = {
  AI: { en: "AI", zh: "AI" },
  PAYMENT: { en: "Payment", zh: "付款" },
  MATCHING: { en: "Matching", zh: "匹配" },
  INVITATION: { en: "Invitation", zh: "邀约" },
  COLLABORATION: { en: "Collaboration", zh: "合作" },
  DELIVERY: { en: "Delivery", zh: "交付" },
  REVIEW: { en: "Review", zh: "审核" },
  REVISION: { en: "Revision", zh: "修稿" },
  SETTLEMENT: { en: "Settlement", zh: "结算" },
  ARBITRATION: { en: "Arbitration", zh: "仲裁" },
  MEMBERSHIP: { en: "Membership", zh: "会员" },
  ATTRIBUTION: { en: "Attribution", zh: "归因" },
  SYSTEM: { en: "System", zh: "系统" }
};

function relativeTime(value: string, locale: Locale) {
  const diffSeconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (diffSeconds < 60) return locale === "zh" ? "刚刚" : "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return locale === "zh" ? `${diffMinutes} 分钟前` : `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return locale === "zh" ? `${diffHours} 小时前` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return locale === "zh" ? `${diffDays} 天前` : `${diffDays}d ago`;
}

export function NotificationCenterBell({
  locale,
  className,
  panelClassName,
  initialItems = [],
  initialUnreadCount = 0
}: {
  locale: Locale;
  className?: string;
  panelClassName?: string;
  initialItems?: NotificationCenterItem[];
  initialUnreadCount?: number;
}) {
  const t = copy[locale];
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<NotificationCenterItem | null>(null);
  const [streamEnabled, setStreamEnabled] = useState(initialItems.length > 0);
  const [isPending, startTransition] = useTransition();
  const itemsRef = useRef(initialItems);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items]
  );

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/v1/notifications?limit=30", { credentials: "same-origin" });
        if (!response.ok) return;
        const payload = (await response.json()) as ApiEnvelope<{
          items: NotificationCenterItem[];
          unreadCount: number;
        }>;
        if (!cancelled && payload.success && payload.data) {
          setItems(payload.data.items);
          setUnreadCount(payload.data.unreadCount);
          setStreamEnabled(true);
        }
      } catch {
        // Demo sessions may not have a database-backed notification identity yet.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }
  }, [open]);

  useEffect(() => {
    if (!streamEnabled) return;

    async function poll() {
      if (document.hidden) {
        return;
      }
      try {
        const response = await fetch("/api/v1/notifications?limit=30", { credentials: "same-origin" });
        if (!response.ok) return;
        const payload = (await response.json()) as ApiEnvelope<{
          items: NotificationCenterItem[];
          unreadCount: number;
        }>;
        if (!payload.success || !payload.data) return;

        const nextItems = payload.data.items;
        const seen = new Set(itemsRef.current.map((item) => item.id));
        const fresh = nextItems.filter((item) => !seen.has(item.id));
        if (fresh.length) {
          setToast(fresh[fresh.length - 1] ?? null);
          setItems(nextItems);
        }
        setUnreadCount(payload.data.unreadCount);
      } catch {
        // Notification refresh is best-effort and must never break navigation.
      }
    }

    const interval = window.setInterval(() => void poll(), 5000);
    const onVisibilityChange = () => {
      if (!document.hidden) {
        void poll();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [streamEnabled]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function markLocalRead(notificationId: string) {
    setItems((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, isRead: true, readAt: new Date().toISOString() } : item))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  }

  function openNotification(item: NotificationCenterItem) {
    startTransition(async () => {
      if (!item.isRead) {
        try {
          await fetch(`/api/v1/notifications/${item.id}/read`, { method: "PATCH", credentials: "same-origin" });
          markLocalRead(item.id);
        } catch {
          // Keep navigation working even if read state sync fails.
        }
      }

      setOpen(false);
      if (item.actionUrl) {
        const href = normalizeInternalActionHref(item.actionUrl, locale);
        if (href.startsWith("http")) {
          window.location.assign(href);
          return;
        }
        router.push(href);
        router.refresh();
      }
    });
  }

  function markAllRead() {
    startTransition(async () => {
      try {
        await fetch("/api/v1/notifications/read-all", { method: "POST", credentials: "same-origin" });
      } catch {
        // Local read state still updates so the UI does not feel broken.
      }
      const readAt = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, isRead: true, readAt })));
      setUnreadCount(0);
      router.refresh();
    });
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={t.title}
        className="relative h-9 w-9 rounded-xl border border-zinc-200 bg-white px-0 text-zinc-600 hover:bg-zinc-50"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          className={cn(
            "fixed left-3 right-3 top-16 z-50 mt-0 max-h-[calc(100vh-5rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[min(25rem,calc(100vw-2rem))]",
            panelClassName
          )}
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">{t.title}</p>
              <p className="text-xs text-zinc-400">
                {unreadCount} {t.unread}
              </p>
            </div>
            {unreadCount > 0 ? (
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" disabled={isPending} onClick={markAllRead}>
                <CheckCheck className="h-3.5 w-3.5" />
                {t.markAll}
              </Button>
            ) : null}
          </div>

          <ul className="max-h-[calc(100vh-10rem)] overflow-y-auto sm:max-h-[28rem]">
            {sortedItems.length ? (
              sortedItems.slice(0, 15).map((item) => (
                <li key={item.id} className="border-b border-zinc-50 last:border-0">
                  <button
                    type="button"
                    disabled={isPending}
                    className={cn(
                      "w-full px-4 py-3 text-left transition hover:bg-zinc-50",
                      !item.isRead && "bg-violet-50/40"
                    )}
                    onClick={() => openNotification(item)}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.isRead ? "bg-zinc-200" : "bg-rose-500")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
                            {categoryCopy[item.category]?.[locale] ?? categoryCopy.SYSTEM[locale]}
                          </span>
                          <span className="text-[11px] text-zinc-400">{relativeTime(item.createdAt, locale)}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-zinc-950">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{item.content}</p>
                        {item.actionUrl ? (
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-700">
                            {t.open}
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-center text-sm text-zinc-400">{t.empty}</li>
            )}
          </ul>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed right-4 top-4 z-[80] w-[min(23rem,calc(100vw-2rem))] rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="mt-1 rounded-full bg-violet-100 p-2 text-violet-700">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">{t.newToast}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-950">{toast.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{toast.content}</p>
            </div>
            <button type="button" className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100" onClick={() => setToast(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
