"use client";

import type { MessageListItem } from "@/components/studioos/studio-message-center.types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Filter, MessageSquare, Shield, Trash2 } from "lucide-react";

type FilterTab = "all" | "unread" | "read";

const checkboxClass =
  "h-4 w-4 shrink-0 rounded border-zinc-300 text-violet-600 focus:ring-violet-500/20";

const copy = {
  zh: {
    selectAll: "全选",
    markRead: "标记已读",
    deleteSelected: "删除",
    all: "全部",
    unread: "未读",
    read: "已读",
    filter: "筛选",
    empty: "暂无消息。",
    emptyTitle: "暂无消息",
    emptyBody: "当有新消息时，你将在这里看到。",
    totalPages: (n: number) => `共 ${n} 页`
  },
  en: {
    selectAll: "Select all",
    markRead: "Mark read",
    deleteSelected: "Delete selected",
    all: "All",
    unread: "Unread",
    read: "Read",
    filter: "Filter",
    empty: "No messages yet.",
    emptyTitle: "No messages yet",
    emptyBody: "When you receive new messages, they will appear here.",
    totalPages: (n: number) => `${n} pages`
  }
} as const;

export function StudioMessageListPanel({
  locale,
  items,
  selectedId,
  selectedIds,
  tab,
  unreadCount,
  readCount,
  page,
  totalPages,
  isPending,
  variant = "default",
  onTabChange,
  onSelect,
  onToggleSelect,
  onToggleSelectAll,
  onMarkRead,
  onDeleteSelected,
  onPageChange
}: {
  locale: Locale;
  items: MessageListItem[];
  selectedId: string | null;
  selectedIds: string[];
  tab: FilterTab;
  unreadCount: number;
  readCount: number;
  page: number;
  totalPages: number;
  isPending: boolean;
  variant?: "default" | "brand";
  onTabChange: (tab: FilterTab) => void;
  onSelect: (item: MessageListItem) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onMarkRead: () => void;
  onDeleteSelected: () => void;
  onPageChange: (page: number) => void;
}) {
  const t = copy[locale];
  const allVisibleSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  return (
    <section
      className={cn(
        "flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm",
        variant === "brand" && "lg:min-h-[560px]"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={allVisibleSelected}
            disabled={!items.length || isPending}
            onChange={onToggleSelectAll}
          />
          {t.selectAll}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPending || !selectedIds.length}
            onClick={onMarkRead}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.markRead}
          </button>
          <button
            type="button"
            disabled={isPending || !selectedIds.length}
            onClick={onDeleteSelected}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            {t.deleteSelected}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", t.all, items.length + (tab === "all" ? 0 : 0)],
              ["unread", t.unread, unreadCount],
              ["read", t.read, readCount]
            ] as const
          ).map(([key, label]) => {
            const displayCount =
              key === "all"
                ? unreadCount + readCount
                : key === "unread"
                  ? unreadCount
                  : readCount;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  tab === key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                {label} ({displayCount})
              </button>
            );
          })}
        </div>
        <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500">
          <Filter className="h-3.5 w-3.5" />
          {t.filter}
        </button>
      </div>

      <ul className="max-h-[560px] flex-1 divide-y divide-zinc-100 overflow-y-auto lg:max-h-none">
        {items.length ? (
          items.map((item) => {
            const active = item.id === selectedId;
            const checked = selectedIds.includes(item.id);
            return (
              <li
                key={item.id}
                className={cn(
                  "flex gap-3 px-4 py-4 transition",
                  active || checked ? "bg-zinc-50" : "hover:bg-zinc-50/70"
                )}
              >
                <label
                  className="flex shrink-0 items-start pt-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={checked}
                    disabled={isPending}
                    onChange={() => onToggleSelect(item.id)}
                    onClick={(event) => event.stopPropagation()}
                  />
                </label>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onSelect(item)}
                  className="flex min-w-0 flex-1 gap-3 text-left"
                >
                  {!item.readAt ? (
                    <span className="mt-4 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                  ) : (
                    <span className="mt-4 h-2 w-2 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      item.senderAvatarTone
                    )}
                  >
                    {item.senderName.includes("系统") ? <Shield className="h-4 w-4" /> : item.senderInitials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="truncate text-sm font-medium text-zinc-700">{item.senderName}</span>
                      <span className="shrink-0 text-xs text-zinc-400">{item.timeLabel}</span>
                    </span>
                    <span className="mt-1 block line-clamp-1 text-sm font-semibold text-zinc-950">{item.title}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-zinc-500">{item.preview}</span>
                  </span>
                </button>
              </li>
            );
          })
        ) : (
          <li className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
            {variant === "brand" ? (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                  <MessageSquare className="h-6 w-6" />
                </span>
                <p className="mt-4 text-sm font-medium text-zinc-700">{t.emptyTitle}</p>
                <p className="mt-1.5 text-sm text-zinc-500">{t.emptyBody}</p>
              </>
            ) : (
              <span className="text-sm text-zinc-500">{t.empty}</span>
            )}
          </li>
        )}
      </ul>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-1 border-t border-zinc-100 px-4 py-3">
          <button
            type="button"
            disabled={page <= 1 || isPending}
            onClick={() => onPageChange(page - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              disabled={isPending}
              onClick={() => onPageChange(pageNumber)}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium",
                pageNumber === page
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= totalPages || isPending}
            onClick={() => onPageChange(page + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 text-xs text-zinc-400">{t.totalPages(totalPages)}</span>
        </div>
      ) : null}
    </section>
  );
}
