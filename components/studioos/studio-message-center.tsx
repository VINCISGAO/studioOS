"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAllNotificationsAction,
  deleteNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction
} from "@/app/studio-notification-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { MessageDetailPayload, MessageListItem } from "@/components/studioos/studio-message-center.types";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  ShoppingBag,
  Upload,
  X
} from "lucide-react";

type FilterTab = "all" | "unread" | "read";

function formatMessageTime(iso: string, locale: Locale) {
  const date = new Date(iso);
  const now = Date.now();
  const diffMin = Math.floor((now - date.getTime()) / 60000);
  if (diffMin < 1) return locale === "zh" ? "刚刚" : "Just now";
  if (diffMin < 60) return locale === "zh" ? `${diffMin} 分钟前` : `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return locale === "zh" ? `${diffHours} 小时前` : `${diffHours}h ago`;
  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const copy = {
  en: {
    title: "Message center",
    subtitle: "Brand selection, payment, and project updates appear here.",
    all: "All",
    unread: "Unread",
    read: "Read",
    filter: "Filter",
    empty: "No messages yet.",
    selectHint: "Select a message to view details.",
    formTitle: "Project form (full)",
    attachment: "Attachment",
    projectStatus: "Project status",
    enterProject: "Enter project",
    openStage: "Open workflow stage",
    tapHint: "Tap to open the related workflow",
    viewPdf: "View PDF",
    downloadPdf: "Download PDF",
    pdfPreview: "PDF preview",
    deleteSelected: "Delete selected",
    deleteAll: "Delete all",
    selectAll: "Select all",
    confirmDeleteAll:
      "Delete all messages in the message center? This cannot be undone.",
    confirmDeleteSelected: "Delete selected messages? This cannot be undone."
  },
  zh: {
    title: "消息中心",
    subtitle: "品牌选中、付款完成等项目通知会出现在这里。",
    all: "全部",
    unread: "未读",
    read: "已读",
    filter: "筛选",
    empty: "暂无消息。",
    selectHint: "选择一条消息查看详情。",
    formTitle: "项目表单（完整）",
    attachment: "附件",
    projectStatus: "项目状态",
    enterProject: "进入项目",
    openStage: "进入对应环节",
    tapHint: "点击进入对应环节",
    viewPdf: "查看 PDF",
    downloadPdf: "下载 PDF",
    pdfPreview: "PDF 预览",
    deleteSelected: "删除选中",
    deleteAll: "一键删除",
    selectAll: "全选",
    confirmDeleteAll: "确定删除消息中心的全部消息吗？此操作不可恢复。",
    confirmDeleteSelected: "确定删除选中的消息吗？此操作不可恢复。"
  }
};

function messageIcon(type: MessageListItem["type"]) {
  if (type === "project_funded" || type === "delivery_approved" || type === "escrow_released") return CheckCircle2;
  if (type === "invitation_match" || type === "not_selected") return Bell;
  if (type === "review_comment_added" || type === "revision_requested") return FileText;
  return ShoppingBag;
}

export function StudioMessageCenter({
  locale,
  list,
  details,
  initialSelectedId = null
}: {
  locale: Locale;
  list: MessageListItem[];
  details: MessageDetailPayload[];
  initialSelectedId?: string | null;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<FilterTab>("all");
  const [showPdf, setShowPdf] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? list[0]?.id ?? null
  );

  const detailMap = useMemo(() => new Map(details.map((item) => [item.notificationId, item])), [details]);

  const filtered = useMemo(() => {
    if (tab === "unread") return list.filter((item) => !item.readAt);
    if (tab === "read") return list.filter((item) => item.readAt);
    return list;
  }, [list, tab]);

  const unreadCount = list.filter((item) => !item.readAt).length;
  const selected = selectedId ? detailMap.get(selectedId) ?? null : null;

  function openMessage(item: MessageListItem) {
    startTransition(async () => {
      if (!item.readAt) {
        const fd = new FormData();
        fd.set("notification_id", item.id);
        await markNotificationReadAction(fd);
      }
      router.push(item.actionHref);
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = filtered.map((item) => item.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((current) => [...new Set([...current, ...visibleIds])]);
  }

  function deleteSelected() {
    if (!selectedIds.length) return;
    if (!window.confirm(t.confirmDeleteSelected)) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("notification_ids", selectedIds.join(","));
      await deleteNotificationsAction(fd);
      setSelectedIds([]);
      setSelectedId(null);
      router.refresh();
    });
  }

  function deleteAll() {
    if (!list.length) return;
    if (!window.confirm(t.confirmDeleteAll)) return;

    startTransition(async () => {
      await deleteAllNotificationsAction();
      setSelectedIds([]);
      setSelectedId(null);
      router.refresh();
    });
  }

  const visibleSelectedCount = filtered.filter((item) => selectedIds.includes(item.id)).length;
  const allVisibleSelected = filtered.length > 0 && visibleSelectedCount === filtered.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{t.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-zinc-200"
              disabled={isPending}
              onClick={markAllRead}
            >
              {locale === "zh" ? "全部标为已读" : "Mark all read"}
            </Button>
          ) : null}
          {selectedIds.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-red-200 text-red-700 hover:bg-red-50"
              disabled={isPending}
              onClick={deleteSelected}
            >
              {t.deleteSelected} ({selectedIds.length})
            </Button>
          ) : null}
          {list.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-red-200 text-red-700 hover:bg-red-50"
              disabled={isPending}
              onClick={deleteAll}
            >
              {t.deleteAll}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
        {/* Left list */}
        <section className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-zinc-500">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300"
                  checked={allVisibleSelected}
                  disabled={!filtered.length || isPending}
                  onChange={toggleSelectAllVisible}
                />
                {t.selectAll}
              </label>
              <div className="flex gap-1">
              {(
                [
                  ["all", t.all, list.length],
                  ["unread", t.unread, unreadCount],
                  ["read", t.read, list.length - unreadCount]
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    tab === key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                >
                  {label} ({count})
                </button>
              ))}
              </div>
            </div>
            <button type="button" className="inline-flex items-center gap-1 text-xs text-zinc-500">
              {t.filter}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <ul className="max-h-[720px] divide-y divide-zinc-100 overflow-y-auto">
            {filtered.length ? (
              filtered.map((item) => {
                const Icon = messageIcon(item.type);
                const active = item.id === selectedId;
                return (
                  <li key={item.id} className="flex">
                    <label className="flex shrink-0 items-start px-3 py-4">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-zinc-300"
                        checked={selectedIds.includes(item.id)}
                        disabled={isPending}
                        onChange={() => toggleSelected(item.id)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => openMessage(item)}
                      className={cn(
                        "flex w-full flex-1 gap-3 py-4 pr-4 text-left transition",
                        active ? "bg-zinc-50" : "hover:bg-zinc-50/70"
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          {!item.readAt ? (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-900" />
                          ) : null}
                          <span className="line-clamp-2 text-sm font-medium text-zinc-900">{item.title}</span>
                        </span>
                        <span className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{item.preview}</span>
                        <span className="mt-2 block text-[11px] text-zinc-400">
                          {formatMessageTime(item.createdAt, locale)}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-zinc-700">{item.actionLabel}</span>
                        <span className="mt-0.5 block text-[11px] text-zinc-400">{t.tapHint}</span>
                      </span>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="flex flex-col items-center px-6 py-16 text-center">
                <Bell className="h-8 w-8 text-zinc-300" />
                <p className="mt-3 text-sm text-zinc-500">{t.empty}</p>
              </li>
            )}
          </ul>
        </section>

        {/* Right detail */}
        <section className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {selected ? (
            <div className="flex max-h-[calc(100vh-10rem)] flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-zinc-950">{selected.title}</h2>
                  <p className="mt-1 text-xs text-zinc-400">{formatMessageTime(selected.createdAt, locale)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {selected.actionHref ? (
                    <Button asChild size="sm" className="rounded-lg bg-zinc-900 hover:bg-zinc-800">
                      <Link href={selected.actionHref}>
                        {selected.actionLabel || t.enterProject}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
                    onClick={() => setSelectedId(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                <p className="text-sm leading-6 text-zinc-600">{selected.body}</p>

                {selected.fields.length ? (
                  <div className="overflow-hidden rounded-xl border border-zinc-200">
                    <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{t.formTitle}</p>
                        <p className="text-xs text-zinc-500">{selected.projectTitle}</p>
                      </div>
                      {selected.briefPdfUrl ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg border-zinc-200 text-xs"
                            onClick={() => setShowPdf((value) => !value)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {showPdf ? (locale === "zh" ? "隐藏 PDF" : "Hide PDF") : t.viewPdf}
                          </Button>
                          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg border-zinc-200 text-xs">
                            <a href={`${selected.briefPdfUrl}&download=1`} download>
                              <Download className="h-3.5 w-3.5" />
                              {t.downloadPdf}
                            </a>
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    {showPdf && selected.briefPdfUrl ? (
                      <div className="border-b border-zinc-100 bg-zinc-100/60 p-3">
                        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">{t.pdfPreview}</p>
                        <iframe
                          title={t.pdfPreview}
                          src={selected.briefPdfUrl}
                          className="h-[420px] w-full rounded-lg border border-zinc-200 bg-white"
                        />
                      </div>
                    ) : null}

                    <dl className="divide-y divide-zinc-100">
                      {selected.fields.map((field) => (
                        <div
                          key={`${field.section}-${field.label}`}
                          className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4"
                        >
                          <dt className="text-sm font-medium text-zinc-500">{field.label}</dt>
                          <dd className="whitespace-pre-wrap text-sm leading-6 text-zinc-900">{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}

                {selected.attachments.length ? (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-zinc-900">{t.attachment}</p>
                    <ul className="space-y-2">
                      {selected.attachments.map((file) => (
                        <li key={file.id}>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 transition hover:bg-zinc-50"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                                <FileText className="h-4 w-4 text-zinc-600" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-zinc-900">{file.name}</span>
                                <span className="text-xs text-zinc-400">{file.size}</span>
                              </span>
                            </span>
                            <Download className="h-4 w-4 shrink-0 text-zinc-400" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div>
                  <p className="mb-3 text-sm font-semibold text-zinc-900">{t.projectStatus}</p>
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
                    <div className="grid gap-4 sm:grid-cols-4">
                      {selected.progressSteps.map((step, index) => (
                        <div key={step.id} className="relative min-w-0">
                          {index < selected.progressSteps.length - 1 ? (
                            <span className="absolute left-[11px] top-6 hidden h-full w-px bg-zinc-200 sm:block" />
                          ) : null}
                          <div className="flex items-start gap-2">
                            <span
                              className={cn(
                                "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                                step.state === "done"
                                  ? "bg-emerald-500 text-white"
                                  : step.state === "current"
                                    ? "bg-zinc-900 text-white"
                                    : "bg-zinc-200 text-zinc-500"
                              )}
                            >
                              {step.state === "done" ? "✓" : index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-900">{step.title}</p>
                              <p className="mt-0.5 text-[11px] leading-4 text-zinc-500">{step.subtitle}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
              <Upload className="h-8 w-8 text-zinc-300" />
              <p className="mt-3 text-sm text-zinc-500">{t.selectHint}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
