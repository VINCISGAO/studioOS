"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBrandProjectsAction } from "@/app/brand-project-actions";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard";
import { cn, formatDate } from "@/lib/utils";
import {
  ArrowUpRight,
  CheckCircle2,
  FolderKanban,
  Minus,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";

type Filter = "all" | "draft" | "active" | "done";

type Props = {
  locale: Locale;
  rows: BrandProjectRow[];
};

const copy = {
  en: {
    title: "Projects",
    subtitle: "Manage campaigns, briefs, and production in one workspace.",
    new: "Create ad project",
    search: "Search projects…",
    empty: "No projects yet",
    emptyBody: "Create your first campaign brief to start matching with studios.",
    emptyFiltered: "No projects match this filter.",
    all: "All",
    draft: "Drafts",
    active: "Active",
    done: "Completed",
    open: "Open",
    delete: "Delete",
    deleteTitle: "Delete selected projects?",
    deleteTitleOne: "Delete project?",
    deleteBody: "This permanently removes the selected projects and their draft assets.",
    deleteBodyOne: "This permanently removes the project and its draft assets.",
    cancel: "Cancel",
    confirmDelete: "Delete",
    deleted: "Projects deleted",
    deletedOne: "Project deleted",
    deletedPartial: "Some projects could not be deleted",
    clearSelection: "Clear",
    selected: "selected",
    selectAll: "Select all deletable",
    setup: "Setup",
    kindCampaign: "Project",
    kindOrder: "Order",
    colProject: "Project",
    colStatus: "Status",
    colUpdated: "Updated"
  },
  zh: {
    title: "项目",
    subtitle: "在一个地方管理广告需求、制作进度和审片。",
    new: "发布广告需求",
    search: "搜索项目…",
    empty: "还没有项目",
    emptyBody: "发布第一个广告需求，开始匹配制作团队。",
    emptyFiltered: "当前筛选下没有项目。",
    all: "全部",
    draft: "草稿",
    active: "进行中",
    done: "已完成",
    open: "打开",
    delete: "删除",
    deleteTitle: "删除所选项目？",
    deleteTitleOne: "删除项目？",
    deleteBody: "将永久删除所选项目及其草稿素材，此操作不可撤销。",
    deleteBodyOne: "将永久删除该项目及其草稿素材，此操作不可撤销。",
    cancel: "取消",
    confirmDelete: "确认删除",
    deleted: "项目已删除",
    deletedOne: "项目已删除",
    deletedPartial: "部分项目无法删除",
    clearSelection: "取消选择",
    selected: "项已选",
    selectAll: "全选可删项",
    setup: "设置",
    kindCampaign: "广告项目",
    kindOrder: "订单",
    colProject: "项目",
    colStatus: "状态",
    colUpdated: "更新"
  }
};

const statusTone: Record<string, string> = {
  draft: "text-zinc-500",
  matching: "text-amber-700",
  studio_selected: "text-blue-700",
  proposal: "text-violet-700",
  contract_pending: "text-violet-700",
  payment_pending: "text-amber-700",
  production: "text-orange-700",
  in_review: "text-orange-700",
  delivered: "text-emerald-700",
  completed: "text-emerald-700",
  cancelled: "text-zinc-400",
  disputed: "text-red-700"
};

const statusLabel: Record<Locale, Record<string, string>> = {
  en: {
    draft: "Draft",
    matching: "Matching",
    studio_selected: "Studio selected",
    proposal: "Proposal",
    contract_pending: "Contract",
    payment_pending: "Awaiting payment",
    production: "In production",
    in_review: "In review",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    disputed: "Disputed"
  },
  zh: {
    draft: "草稿",
    matching: "匹配中",
    studio_selected: "已选 Studio",
    proposal: "Proposal",
    contract_pending: "待签约",
    payment_pending: "待付款",
    production: "制作中",
    in_review: "审片中",
    delivered: "已交付",
    completed: "已完成",
    cancelled: "已取消",
    disputed: "争议中"
  }
};

function rowKey(row: BrandProjectRow) {
  return `${row.kind}-${row.id}`;
}

function isSelectable(row: BrandProjectRow) {
  return Boolean(row.canDelete);
}

export function BrandProjectsBoard({ locale, rows }: Props) {
  const router = useRouter();
  const t = copy[locale];
  const [items, setItems] = useState(rows);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  const stats = useMemo(
    () => ({
      total: items.length,
      drafts: items.filter((row) => row.phase === "draft").length,
      active: items.filter((row) => row.phase === "active").length
    }),
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((row) => {
      if (filter !== "all" && row.phase !== filter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.category?.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    });
  }, [filter, items, query]);

  const selectableInView = useMemo(
    () => filtered.filter(isSelectable),
    [filtered]
  );

  const selectedRows = useMemo(
    () => filtered.filter((row) => selected.has(rowKey(row))),
    [filtered, selected]
  );

  const selectionActive = selected.size > 0;
  const allSelectableChecked =
    selectableInView.length > 0 && selectableInView.every((row) => selected.has(rowKey(row)));
  const someSelectableChecked = selectableInView.some((row) => selected.has(rowKey(row)));

  function toggleRow(row: BrandProjectRow) {
    if (!isSelectable(row)) return;
    const key = rowKey(row);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelectableChecked) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const row of selectableInView) {
          next.delete(rowKey(row));
        }
        return next;
      });
      return;
    }

    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of selectableInView) {
        next.add(rowKey(row));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function openBulkDelete() {
    if (!selectedRows.length) return;
    setDeleteError(null);
    setDeleteOpen(true);
  }

  function handleBulkDelete() {
    const projectIds = selectedRows.filter((row) => row.kind === "campaign").map((row) => row.id);
    const orderIds = selectedRows.filter((row) => row.kind === "order").map((row) => row.id);
    if (!projectIds.length && !orderIds.length) return;

    setDeleteError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      for (const id of projectIds) {
        fd.append("project_ids", id);
      }
      for (const id of orderIds) {
        fd.append("order_ids", id);
      }

      const result = await deleteBrandProjectsAction(fd);

      if (!result.ok) {
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

      if (result.failures.length) {
        setDeleteError(null);
        setSuccessMessage(t.deletedPartial);
      } else {
        setSuccessMessage(selectedRows.length === 1 ? t.deletedOne : t.deleted);
      }

      router.refresh();
    });
  }

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: t.all, count: stats.total },
    { id: "draft", label: t.draft, count: stats.drafts },
    { id: "active", label: t.active, count: stats.active },
    {
      id: "done",
      label: t.done,
      count: items.filter((row) => row.phase === "done").length
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{t.title}</h1>
          <p className="mt-1.5 text-sm text-zinc-500">{t.subtitle}</p>
        </div>
        <BrandStartBriefButton locale={locale} className="h-10 shrink-0 rounded-lg px-4 shadow-sm">
          <Plus className="h-4 w-4" />
          {t.new}
        </BrandStartBriefButton>
      </div>

      {successMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {selectionActive ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-blue-100 bg-blue-50/80 px-4 py-3 sm:px-5">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-900">
              <SelectCheckbox
                checked={allSelectableChecked}
                indeterminate={someSelectableChecked && !allSelectableChecked}
                onChange={toggleSelectAll}
              />
              <span>
                {selected.size} {t.selected}
              </span>
            </label>
            <div className="flex flex-1 flex-wrap items-center gap-2">
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
                className="h-8 rounded-lg text-blue-800 hover:bg-blue-100/80 hover:text-blue-900"
                onClick={clearSelection}
              >
                <X className="h-3.5 w-3.5" />
                {t.clearSelection}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                className="h-9 rounded-lg border-zinc-200 bg-zinc-50/80 pl-9 text-sm focus-visible:bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-1 rounded-lg bg-zinc-100/80 p-1">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                    filter === item.id
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  )}
                >
                  {item.label}
                  <span className="tabular-nums text-zinc-400">{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {filtered.length ? (
          <>
            <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-b border-zinc-100 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400 sm:grid-cols-[36px_minmax(0,1fr)_120px_100px] sm:px-5">
              <label className="flex justify-center" title={t.selectAll}>
                <SelectCheckbox
                  checked={allSelectableChecked}
                  indeterminate={someSelectableChecked && !allSelectableChecked}
                  onChange={toggleSelectAll}
                  disabled={!selectableInView.length}
                />
              </label>
              <span>{t.colProject}</span>
              <span className="hidden sm:block">{t.colStatus}</span>
              <span className="hidden text-right sm:block">{t.colUpdated}</span>
            </div>

            <ul>
              {filtered.map((row) => {
                const key = rowKey(row);
                const checked = selected.has(key);
                const selectable = isSelectable(row);

                return (
                  <li
                    key={key}
                    className={cn(
                      "group border-b border-zinc-100 last:border-b-0 transition",
                      checked ? "bg-blue-50/50" : "hover:bg-zinc-50/70"
                    )}
                  >
                    <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[36px_minmax(0,1fr)_120px_100px] sm:px-5">
                      <div className="flex justify-center">
                        {selectable ? (
                          <SelectCheckbox
                            checked={checked}
                            onChange={() => toggleRow(row)}
                            className={cn(
                              !selectionActive && "opacity-0 group-hover:opacity-100",
                              checked && "opacity-100"
                            )}
                          />
                        ) : (
                          <span className="h-4 w-4" aria-hidden />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={withLocale(row.href, locale)}
                            className={cn(
                              "truncate text-sm font-medium text-zinc-900 hover:underline",
                              checked && "text-blue-950"
                            )}
                          >
                            {row.name}
                          </Link>
                          <span className="hidden shrink-0 rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400 sm:inline">
                            {row.kind === "order" ? t.kindOrder : t.kindCampaign}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
                          {row.category ? <span>{row.category}</span> : null}
                          {row.budgetRange ? <span>{row.budgetRange}</span> : null}
                          {row.status === "draft" && typeof row.progress === "number" ? (
                            <span>
                              {t.setup} {row.progress}%
                            </span>
                          ) : null}
                          <span className="sm:hidden">
                            · {statusLabel[locale][row.status] ?? row.status}
                          </span>
                        </div>
                      </div>

                      <StatusText status={row.status} locale={locale} className="hidden sm:block" />

                      <div className="flex items-center justify-end gap-2">
                        <time
                          dateTime={row.updatedAt}
                          className="hidden text-xs tabular-nums text-zinc-400 sm:block"
                        >
                          {formatDate(row.updatedAt)}
                        </time>
                        <Link
                          href={withLocale(row.href, locale)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100"
                          aria-label={t.open}
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="px-6 py-20 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
              <FolderKanban className="h-5 w-5" />
            </span>
            <p className="mt-4 text-base font-medium text-zinc-900">
              {items.length ? t.emptyFiltered : t.empty}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
              {items.length ? null : t.emptyBody}
            </p>
            {!items.length ? (
              <BrandStartBriefButton locale={locale} className="mt-6 rounded-lg">
                <Plus className="h-4 w-4" />
                {t.new}
              </BrandStartBriefButton>
            ) : null}
          </div>
        )}
      </section>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteOpen(false);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRows.length === 1 ? t.deleteTitleOne : t.deleteTitle}
            </DialogTitle>
            <DialogDescription>
              {selectedRows.length === 1 ? t.deleteBodyOne : t.deleteBody}
            </DialogDescription>
          </DialogHeader>

          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {selectedRows.map((row) => (
              <li key={rowKey(row)} className="truncate">
                {row.name}
              </li>
            ))}
          </ul>

          {deleteError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {deleteError}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleBulkDelete}
            >
              {isPending ? "…" : t.confirmDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SelectCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
  className
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) onChange();
      }}
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
        checked || indeterminate
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-zinc-300 bg-white hover:border-zinc-400",
        disabled && "cursor-not-allowed opacity-40",
        className
      )}
    >
      {indeterminate ? (
        <Minus className="h-3 w-3" />
      ) : checked ? (
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  );
}

function StatusText({
  status,
  locale,
  className
}: {
  status: string;
  locale: Locale;
  className?: string;
}) {
  const label = statusLabel[locale][status] ?? status;
  const tone = statusTone[status] ?? "text-zinc-500";

  return <span className={cn("text-xs font-medium", tone, className)}>{label}</span>;
}
