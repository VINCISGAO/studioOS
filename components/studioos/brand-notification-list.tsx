"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAllBrandNotificationsAction,
  deleteBrandNotificationsAction,
  markBrandNotificationReadAction
} from "@/app/brand-notification-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle
} from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import type { BrandNotification } from "@/lib/studioos/brand-notification-types";
import { resolveBrandNotificationAction } from "@/lib/studioos/commercial-notification-routes";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from "lucide-react";

const copy = {
  en: {
    unread: "New",
    tapHint: "Tap to open",
    selectAll: "Select all",
    deleteSelected: "Delete selected",
    deleteAll: "Delete all",
    deleteOne: "Delete",
    confirmDeleteAll: "Delete all messages? This cannot be undone.",
    confirmDeleteSelected: "Delete selected messages? This cannot be undone.",
    confirmDeleteOne: "Delete this message? This cannot be undone.",
    cancel: "Cancel",
    confirmDelete: "Delete permanently",
    deleting: "Deleting…",
    deleted: "Messages deleted",
    deletedOne: "Message deleted"
  },
  zh: {
    unread: "新",
    tapHint: "点击进入对应环节",
    selectAll: "全选",
    deleteSelected: "删除选中",
    deleteAll: "一键删除",
    deleteOne: "删除",
    confirmDeleteAll: "确定删除全部消息吗？此操作不可恢复。",
    confirmDeleteSelected: "确定删除选中的消息吗？此操作不可恢复。",
    confirmDeleteOne: "确定删除这条消息吗？此操作不可恢复。",
    cancel: "取消",
    confirmDelete: "确认永久删除",
    deleting: "删除中…",
    deleted: "已删除",
    deletedOne: "已删除"
  }
};

export function BrandNotificationList({
  locale,
  notifications: initialNotifications,
  compact = false
}: {
  locale: Locale;
  notifications: BrandNotification[];
  compact?: boolean;
}) {
  const router = useRouter();
  const t = copy[locale];
  const [items, setItems] = useState(initialNotifications);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(initialNotifications);
    setSelectedIds([]);
  }, [initialNotifications]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const pendingItems = useMemo(
    () => items.filter((item) => pendingDeleteIds.includes(item.id)),
    [items, pendingDeleteIds]
  );

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  if (!items.length) return null;

  function openNotification(item: BrandNotification) {
    const action = resolveBrandNotificationAction(item, locale);
    startTransition(async () => {
      if (!item.read_at) {
        const fd = new FormData();
        fd.set("notification_id", item.id);
        await markBrandNotificationReadAction(fd);
      }
      router.push(action.href);
    });
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(items.map((item) => item.id));
  }

  function openDeleteDialog(ids: string[]) {
    setPendingDeleteIds(ids);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  function handleConfirmDelete() {
    if (!pendingDeleteIds.length) return;
    setDeleteError(null);
    startTransition(async () => {
      const deletingAll = pendingDeleteIds.length === items.length;
      const fd = new FormData();
      fd.set("lang", locale);

      if (deletingAll) {
        const result = await deleteAllBrandNotificationsAction(fd);
        if (!result.ok) {
          setDeleteError("error" in result ? result.error : t.confirmDelete);
          return;
        }
        setItems([]);
        setSelectedIds([]);
        setDeleteOpen(false);
        setPendingDeleteIds([]);
        setSuccessMessage(t.deleted);
        router.refresh();
        return;
      }

      fd.set("notification_ids", pendingDeleteIds.join(","));
      const result = await deleteBrandNotificationsAction(fd);

      if (!result.ok) {
        setDeleteError("error" in result ? result.error : t.confirmDelete);
        return;
      }

      const removed = new Set(pendingDeleteIds);
      setItems((prev) => prev.filter((item) => !removed.has(item.id)));
      setSelectedIds([]);
      setDeleteOpen(false);
      setPendingDeleteIds([]);
      setSuccessMessage(pendingDeleteIds.length === 1 ? t.deletedOne : t.deleted);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {successMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      ) : null}

      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300"
              checked={allSelected}
              disabled={!items.length || isPending}
              onChange={toggleSelectAll}
            />
            {t.selectAll}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg border-red-200 text-red-700 hover:bg-red-50"
                disabled={isPending}
                onClick={() => openDeleteDialog(selectedIds)}
              >
                {t.deleteSelected} ({selectedIds.length})
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-red-200 text-red-700 hover:bg-red-50"
              disabled={isPending}
              onClick={() => openDeleteDialog(items.map((item) => item.id))}
            >
              {t.deleteAll}
            </Button>
          </div>
        </div>
      ) : null}

      <ul className={cn("space-y-3", compact && "space-y-2")}>
        {items.map((item) => {
          const action = resolveBrandNotificationAction(item, locale);
          const checked = selectedIds.includes(item.id);
          return (
            <li key={item.id} className="flex gap-3">
              {!compact ? (
                <label className="flex shrink-0 items-start pt-5">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-zinc-300"
                    checked={checked}
                    disabled={isPending}
                    onChange={() => toggleSelected(item.id)}
                  />
                </label>
              ) : null}
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => openNotification(item)}
                  className={cn(
                    portalChrome.card,
                    "w-full text-left transition hover:border-zinc-300 hover:shadow-md",
                    compact ? "rounded-xl border-zinc-200/80 p-4" : "p-5",
                    !item.read_at && "ring-1 ring-amber-200/80"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cn("font-semibold text-zinc-950", compact && "text-sm")}>{item.title}</p>
                      <p className={cn("mt-1.5", portalChrome.body, compact && "text-sm")}>{item.body}</p>
                    </div>
                    {!item.read_at ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {t.unread}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-medium text-zinc-900">{action.label}</p>
                  <p className="mt-1 text-xs text-zinc-400">{t.tapHint}</p>
                </button>
                {!compact ? (
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={isPending}
                      onClick={() => openDeleteDialog([item.id])}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t.deleteOne}
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {!compact ? (
        <Dialog
          open={deleteOpen}
          onOpenChange={(open) => {
            if (!open && !isPending) {
              setDeleteOpen(false);
              setPendingDeleteIds([]);
              setDeleteError(null);
            }
          }}
        >
          <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
            <div className="border-b border-red-100/80 bg-red-50/40 px-5 pb-4 pt-5 pr-12">
              <DialogTitle className="text-base font-semibold text-zinc-900">
                {pendingDeleteIds.length === 1
                  ? t.confirmDeleteOne
                  : pendingDeleteIds.length === items.length
                    ? t.confirmDeleteAll
                    : t.confirmDeleteSelected}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-zinc-600">
                {pendingDeleteIds.length === 1
                  ? pendingItems[0]?.title
                  : `${pendingDeleteIds.length} ${locale === "zh" ? "条消息" : "messages"}`}
              </DialogDescription>
            </div>
            {deleteError ? (
              <div className="flex items-start gap-2 px-5 py-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {deleteError}
              </div>
            ) : null}
            <DialogFooter className="gap-2 border-t border-zinc-100 px-5 py-3.5 sm:justify-end">
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setDeleteOpen(false)}>
                {t.cancel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending || !pendingDeleteIds.length}
                onClick={handleConfirmDelete}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.deleting}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {t.confirmDelete}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
