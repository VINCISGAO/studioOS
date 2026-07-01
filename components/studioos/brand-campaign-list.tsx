"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBrandProjectsAction } from "@/app/brand-project-actions";
import { BrandCampaignListRow } from "@/components/studioos/brand-campaign-list-row";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  brandCampaignHref,
  brandCampaignStatusLabel
} from "@/lib/studioos/brand-campaign-display";
import {
  brandAdLifecycleFilters,
  brandAdLifecycleLabels,
  countBrandRowsByLifecycle,
  filterBrandRowsByLifecycle,
  type BrandAdLifecycleFilter
} from "@/lib/studioos/brand-lifecycle";
import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import { cn, formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Minus,
  Plus,
  Receipt,
  Search,
  Trash2,
  X
} from "lucide-react";

const PAGE_SIZE = 5;

type Filter = BrandAdLifecycleFilter;

const copy = {
  en: {
    search: "Search projects…",
    empty: "No projects yet",
    emptyBody: "Create your first ad project — AI helps you write the brief in minutes.",
    publish: "Publish ad brief",
    emptyFiltered: "No projects match this filter.",
    delete: "Delete",
    deleteTitle: (count: number) => `Delete ${count} item${count === 1 ? "" : "s"}?`,
    deleteTitleOne: "Delete this item?",
    deleteBody: "The following draft briefs will be permanently removed.",
    deleteBodyOne: "This draft brief will be permanently removed.",
    cancel: "Cancel",
    confirmDelete: "Delete permanently",
    deleting: "Deleting…",
    deleteSummary: (count: number) => `${count} selected`,
    deleteWarning: "",
    deleted: "Projects deleted",
    deletedOne: "Project deleted",
    deletedPartial: "Some items could not be deleted",
    staleList:
      "This list was out of date (often after a dev server restart). Refreshing…",
    clearSelection: "Clear selection",
    selected: "selected",
    selectAll: "Select all deletable",
    open: "Continue",
    lockedHint: "Only drafts can be deleted",
    kindProject: "Project",
    kindOrder: "Order",
    deleteListTitle: "Items to delete"
  },
  zh: {
    search: "搜索项目…",
    empty: "还没有广告项目",
    emptyBody: "发布第一个广告需求，AI 帮你在几分钟内整理好说明。",
    publish: "发布广告需求",
    emptyFiltered: "当前筛选下没有项目。",
    delete: "删除",
    deleteTitle: (count: number) => `确认删除 ${count} 项？`,
    deleteTitleOne: "确认删除？",
    deleteBody: "以下草稿将被永久删除，无法恢复。",
    deleteBodyOne: "此草稿将被永久删除，无法恢复。",
    cancel: "取消",
    confirmDelete: "确认永久删除",
    deleting: "删除中…",
    deleteSummary: (count: number) => `共 ${count} 项`,
    deleteWarning: "",
    deleted: "已删除",
    deletedOne: "已删除",
    deletedPartial: "部分项目无法删除",
    staleList: "列表已过期（常见于开发服务器重启后），正在刷新…",
    clearSelection: "取消选择",
    selected: "项已选",
    selectAll: "全选可删项",
    open: "继续",
    lockedHint: "仅草稿可删除",
    kindProject: "广告项目",
    kindOrder: "订单",
    deleteListTitle: "待删除项目"
  }
};

function friendlyName(raw: string): string {
  if (raw.endsWith(" Campaign")) return raw.replace(/ Campaign$/, "");
  return raw;
}

function rowDeleteTitle(row: BrandProjectRow): string {
  return friendlyName(row.name);
}

function DeleteRowMeta({ row, locale }: { row: BrandProjectRow; locale: Locale }) {
  const t = copy[locale];
  const kind = row.kind === "order" ? t.kindOrder : t.kindProject;
  const status = brandCampaignStatusLabel(row.status, locale);
  const chips = [kind, status, row.category, row.budgetRange, formatDate(row.updatedAt)].filter(Boolean);

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {chips.map((chip, index) => (
        <span
          key={`${chip}-${index}`}
          className="inline-flex rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] leading-4 text-zinc-600"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

function rowKey(row: BrandProjectRow) {
  return `${row.kind}-${row.id}`;
}

function isSelectable(row: BrandProjectRow) {
  return Boolean(row.canDelete);
}

function resolveHref(row: BrandProjectRow, orderProjectMap: Record<string, string | null | undefined>) {
  const normalized = normalizeCampaignStatus(row.status);
  if (row.kind === "campaign") {
    return brandCampaignHref({
      id: row.id,
      kind: "campaign",
      status: row.status,
      draftHref: normalized === "draft" ? `/brand/projects/new?project=${row.id}&step=1` : undefined
    });
  }
  return brandCampaignHref({
    id: row.id,
    kind: "order",
    status: row.status,
    projectId: orderProjectMap[row.id]
  });
}

function SelectCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange,
  className
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
        checked || indeterminate
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-300 bg-white hover:border-zinc-400",
        disabled && "cursor-not-allowed opacity-40",
        className
      )}
    >
      {checked ? (
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 6l3 3 5-5" />
        </svg>
      ) : indeterminate ? (
        <Minus className="h-2.5 w-2.5" />
      ) : null}
    </button>
  );
}

export function BrandCampaignList({
  locale,
  rows,
  orderProjectMap
}: {
  locale: Locale;
  rows: BrandProjectRow[];
  orderProjectMap: Record<string, string | null | undefined>;
}) {
  const router = useRouter();
  const t = copy[locale];
  const lifecycleLabels = brandAdLifecycleLabels[locale];

  const [items, setItems] = useState(rows);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingDeleteKeys, setPendingDeleteKeys] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(rows);
    setSelected(new Set());
  }, [rows]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const lifecycleCounts = useMemo(() => countBrandRowsByLifecycle(items), [items]);

  const filtered = useMemo(() => {
    const byLifecycle = filterBrandRowsByLifecycle(items, filter);
    const q = query.trim().toLowerCase();
    if (!q) return byLifecycle;
    return byLifecycle.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.category?.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
    );
  }, [filter, items, query]);

  useEffect(() => {
    setPage(1);
  }, [filter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selectableInView = useMemo(() => filtered.filter(isSelectable), [filtered]);

  const selectedRows = useMemo(
    () => filtered.filter((row) => selected.has(rowKey(row))),
    [filtered, selected]
  );

  const selectionActive = selected.size > 0;
  const allSelectableChecked =
    selectableInView.length > 0 && selectableInView.every((row) => selected.has(rowKey(row)));
  const someSelectableChecked = selectableInView.some((row) => selected.has(rowKey(row)));

  const pendingRows = useMemo(
    () => items.filter((row) => pendingDeleteKeys.includes(rowKey(row))),
    [items, pendingDeleteKeys]
  );

  function toggleRow(row: BrandProjectRow) {
    if (!isSelectable(row)) return;
    const key = rowKey(row);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelectableChecked) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const row of selectableInView) next.delete(rowKey(row));
        return next;
      });
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of selectableInView) next.add(rowKey(row));
      return next;
    });
  }

  function openBulkDelete() {
    if (!selectedRows.length) return;
    setPendingDeleteKeys(selectedRows.map(rowKey));
    setDeleteError(null);
    setDeleteOpen(true);
  }

  function openSingleDelete(row: BrandProjectRow) {
    setPendingDeleteKeys([rowKey(row)]);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  function handleConfirmDelete() {
    const projectIds = pendingRows.filter((row) => row.kind === "campaign").map((row) => row.id);
    const orderIds = pendingRows.filter((row) => row.kind === "order").map((row) => row.id);
    if (!projectIds.length && !orderIds.length) return;

    setDeleteError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      for (const id of projectIds) fd.append("project_ids", id);
      for (const id of orderIds) fd.append("order_ids", id);

      const result = await deleteBrandProjectsAction(fd);
      if (!result.ok) {
        if ("stale" in result && result.stale) {
          setDeleteError(t.staleList);
          setDeleteOpen(false);
          setPendingDeleteKeys([]);
          setSelected(new Set());
          router.refresh();
          return;
        }
        setDeleteError(result.error);
        return;
      }

      const deletedProjects = new Set(result.deleted);
      const deletedOrders = new Set(result.deletedOrders ?? []);
      setItems((prev) =>
        prev.filter(
          (row) =>
            !(row.kind === "campaign" && deletedProjects.has(row.id)) &&
            !(row.kind === "order" && deletedOrders.has(row.id))
        )
      );
      setSelected(new Set());
      setDeleteOpen(false);
      setPendingDeleteKeys([]);

      if (result.failures.length) {
        setSuccessMessage(t.deletedPartial);
      } else {
        setSuccessMessage(pendingRows.length === 1 ? t.deletedOne : t.deleted);
      }

      router.refresh();
    });
  }

  const filters = brandAdLifecycleFilters.map((id) => ({
    id,
    label: lifecycleLabels[id],
    count: lifecycleCounts[id]
  }));

  return (
    <div className="space-y-4">
      {successMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
        {selectionActive ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 sm:px-5">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-900">
              <SelectCheckbox
                checked={allSelectableChecked}
                indeterminate={someSelectableChecked && !allSelectableChecked}
                onChange={toggleSelectAll}
              />
              <span>
                {selected.size} {t.selected}
              </span>
            </label>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-8 rounded-lg"
              disabled={isPending}
              onClick={openBulkDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t.delete}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-lg"
              onClick={() => setSelected(new Set())}
            >
              <X className="h-3.5 w-3.5" />
              {t.clearSelection}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between sm:px-5">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:max-w-xl lg:flex-1">
              {selectableInView.length > 0 ? (
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-zinc-600">
                  <SelectCheckbox
                    checked={allSelectableChecked}
                    indeterminate={someSelectableChecked && !allSelectableChecked}
                    onChange={toggleSelectAll}
                  />
                  <span className="hidden sm:inline">{t.selectAll}</span>
                </label>
              ) : null}
              <div className="relative w-full flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.search}
                  className="h-9 rounded-lg border-zinc-200 bg-zinc-50/80 pl-9 text-sm focus-visible:bg-white"
                />
              </div>
            </div>
            <div className="flex max-w-full flex-wrap gap-2 lg:justify-end">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-medium transition",
                    filter === item.id
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900"
                  )}
                >
                  {item.label}
                  <span className={cn("ml-1.5 tabular-nums", filter === item.id ? "text-white/80" : "text-zinc-400")}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!filtered.length ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <p className="text-sm text-zinc-500">{items.length ? t.emptyFiltered : t.emptyBody}</p>
            {!items.length ? (
              <BrandStartBriefButton
                locale={locale}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                {t.publish}
              </BrandStartBriefButton>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {pageItems.map((row) => {
              const key = rowKey(row);
              const checked = selected.has(key);
              const selectable = isSelectable(row);
              const href = resolveHref(row, orderProjectMap);

              return (
                <li
                  key={key}
                  className={cn("group transition", checked ? "bg-zinc-50" : "hover:bg-zinc-50/60")}
                >
                  <div className="flex items-stretch gap-2 sm:gap-3">
                    <div className="flex w-10 shrink-0 items-center justify-center pl-3 sm:w-11 sm:pl-4">
                      {selectable ? (
                        <SelectCheckbox checked={checked} onChange={() => toggleRow(row)} />
                      ) : (
                        <span
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50"
                          title={t.lockedHint}
                          aria-hidden
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <BrandCampaignListRow
                        locale={locale}
                        row={row}
                        href={href}
                        openLabel={t.open}
                        actionSlot={
                          selectable ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 shrink-0 rounded-xl border-red-200 bg-red-50 px-3 text-red-600 hover:border-red-300 hover:bg-red-100 hover:text-red-700"
                              disabled={isPending}
                              onClick={() => openSingleDelete(row)}
                              aria-label={t.delete}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t.delete}
                            </Button>
                          ) : null
                        }
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {filtered.length > 0 ? (
          <div className="flex items-center justify-center gap-2 border-t border-zinc-100 px-4 py-4">
            <button
              type="button"
              aria-label={locale === "zh" ? "上一页" : "Previous page"}
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
              {currentPage}
            </span>
            <button
              type="button"
              aria-label={locale === "zh" ? "下一页" : "Next page"}
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setDeleteOpen(false);
            setDeleteError(null);
            setPendingDeleteKeys([]);
          }
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <div className="border-b border-red-100/80 bg-red-50/40 px-5 pb-4 pt-5 pr-12">
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-left text-base font-semibold leading-snug text-zinc-900">
                  {pendingRows.length === 1 ? t.deleteTitleOne : t.deleteTitle(pendingRows.length)}
                </DialogTitle>
                <DialogDescription className="mt-1 text-left text-sm leading-relaxed text-zinc-600">
                  {pendingRows.length === 1 ? t.deleteBodyOne : t.deleteBody}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            {pendingRows.length ? (
              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-500">{t.deleteListTitle}</p>
                  <span className="text-xs tabular-nums text-zinc-400">{t.deleteSummary(pendingRows.length)}</span>
                </div>
                <ul className="max-h-56 divide-y divide-zinc-100 overflow-y-auto">
                  {pendingRows.map((row) => (
                    <li key={rowKey(row)} className="flex gap-3 px-3 py-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
                        {row.kind === "order" ? <Receipt className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-zinc-900">{rowDeleteTitle(row)}</p>
                        <DeleteRowMeta row={row} locale={locale} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {deleteError ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {deleteError}
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 border-t border-zinc-100 px-5 py-3.5 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg border-zinc-200 bg-white"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10 min-w-[120px] rounded-lg"
              disabled={isPending || !pendingRows.length}
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
    </div>
  );
}
