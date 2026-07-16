"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBrandProjectsAction } from "@/app/brand-project-actions";
import { BrandCampaignListEmpty } from "@/components/studioos/brand-campaign-list-empty";
import {
  BrandCampaignTableRow,
  brandCampaignTableHeaders
} from "@/components/studioos/brand-campaign-table-row";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle
} from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import type { BrandNewCampaignGate } from "@/lib/studioos/brand-active-campaign-limit";
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
import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard-types";
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
  Receipt,
  Trash2,
  X
} from "lucide-react";

const PAGE_SIZE = 5;

type Filter = BrandAdLifecycleFilter;

const copy = {
  en: {
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
    lockedHint: "Draft, unpaid, and completed items can be deleted",
    kindProject: "Project",
    kindOrder: "Order",
    deleteListTitle: "Items to delete"
  },
  zh: {
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
    lockedHint: "草稿、待付款（未托管）和已完成项目可删除",
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
  if (row.paymentExpired) {
    return "/brand/projects/new";
  }

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
  onRowsChange,
  orderProjectMap,
  resumeWizardProjectId,
  activeCampaignCount = 0,
  creationGate,
  rateLimitCode = null,
  sectionTitle,
  sectionHint
}: {
  locale: Locale;
  rows: BrandProjectRow[];
  onRowsChange?: (rows: BrandProjectRow[]) => void;
  orderProjectMap: Record<string, string | null | undefined>;
  resumeWizardProjectId?: string;
  activeCampaignCount?: number;
  creationGate?: BrandNewCampaignGate;
  rateLimitCode?: "rate_limit_10m" | "rate_limit_24h" | null;
  sectionTitle?: string;
  sectionHint?: string;
}) {
  const router = useRouter();
  const t = copy[locale];
  const lifecycleLabels = brandAdLifecycleLabels[locale];

  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingDeleteKeys, setPendingDeleteKeys] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelected(new Set());
  }, [rows]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const lifecycleCounts = useMemo(() => countBrandRowsByLifecycle(rows), [rows]);

  const filtered = useMemo(() => filterBrandRowsByLifecycle(rows, filter), [filter, rows]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

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
    () => rows.filter((row) => pendingDeleteKeys.includes(rowKey(row))),
    [rows, pendingDeleteKeys]
  );

  function applyRows(next: BrandProjectRow[]) {
    onRowsChange?.(next);
  }

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

    const beforeDelete = rows;
    const keysToDelete = new Set(pendingDeleteKeys);
    const deleteKeysSnapshot = [...pendingDeleteKeys];
    const optimistic = beforeDelete.filter((row) => !keysToDelete.has(rowKey(row)));

    setDeleteError(null);
    applyRows(optimistic);
    setSelected(new Set());
    setDeleteOpen(false);
    setPendingDeleteKeys([]);

    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      for (const id of projectIds) fd.append("project_ids", id);
      for (const id of orderIds) fd.append("order_ids", id);

      const result = await deleteBrandProjectsAction(fd);
      if (!result.ok) {
        applyRows(beforeDelete);
        if ("stale" in result && result.stale) {
          setDeleteError(t.staleList);
          router.refresh();
          return;
        }
        setDeleteError(result.error);
        setDeleteOpen(true);
        setPendingDeleteKeys(deleteKeysSnapshot);
        return;
      }

      const deletedProjects = new Set(result.deleted);
      const deletedOrders = new Set(result.deletedOrders ?? []);
      applyRows(
        beforeDelete.filter(
          (row) =>
            !(row.kind === "campaign" && deletedProjects.has(row.id)) &&
            !(row.kind === "order" && deletedOrders.has(row.id))
        )
      );

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
  const tableHeaders = brandCampaignTableHeaders[locale];

  return (
    <div className="space-y-4">
      {successMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
        {sectionTitle ? (
          <div className="border-b border-zinc-100 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl">{sectionTitle}</h2>
                {sectionHint ? <p className="mt-1 text-sm text-zinc-500">{sectionHint}</p> : null}
              </div>
              {!selectionActive ? (
                <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1 lg:max-w-[62%] lg:justify-end lg:overflow-visible lg:pb-0">
                  {filters.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilter(item.id)}
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-medium transition",
                        filter === item.id
                          ? "bg-zinc-900 text-white shadow-sm"
                          : "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200/80 hover:bg-white hover:text-zinc-900"
                      )}
                    >
                      {item.label}
                      <span className={cn("ml-1.5 tabular-nums", filter === item.id ? "text-white/85" : "text-zinc-400")}>
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

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
        ) : selectableInView.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5">
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-zinc-600">
              <SelectCheckbox
                checked={allSelectableChecked}
                indeterminate={someSelectableChecked && !allSelectableChecked}
                onChange={toggleSelectAll}
              />
              <span className="hidden sm:inline">{t.selectAll}</span>
            </label>
          </div>
        ) : null}

        {!filtered.length ? (
          <BrandCampaignListEmpty
            locale={locale}
            hasRows={rows.length > 0}
            resumeWizardProjectId={resumeWizardProjectId}
            activeCampaignCount={activeCampaignCount}
            creationGate={creationGate}
            rateLimitCode={rateLimitCode}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium text-zinc-500">
                  <th className="w-10 px-3 py-3 sm:px-4" scope="col">
                    <span className="sr-only">{t.selectAll}</span>
                  </th>
                  <th className="px-3 py-3 sm:px-4" scope="col">
                    {tableHeaders.name}
                  </th>
                  <th className="hidden px-3 py-3 sm:table-cell sm:px-4" scope="col">
                    {tableHeaders.status}
                  </th>
                  <th className="hidden px-3 py-3 md:table-cell md:px-4" scope="col">
                    {tableHeaders.budget}
                  </th>
                  <th className="hidden px-3 py-3 lg:table-cell lg:px-4" scope="col">
                    {tableHeaders.team}
                  </th>
                  <th className="hidden px-3 py-3 sm:table-cell sm:px-4" scope="col">
                    {tableHeaders.updated}
                  </th>
                  <th className="px-3 py-3 text-right sm:px-4" scope="col">
                    {tableHeaders.action}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((row) => {
                  const key = rowKey(row);
                  const checked = selected.has(key);
                  const selectable = isSelectable(row);
                  const href = resolveHref(row, orderProjectMap);

                  return (
                    <BrandCampaignTableRow
                      key={key}
                      locale={locale}
                      row={row}
                      href={href}
                      checked={checked}
                      selectable={selectable}
                      onToggle={() => toggleRow(row)}
                      onDelete={() => openSingleDelete(row)}
                      isPending={isPending}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
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
