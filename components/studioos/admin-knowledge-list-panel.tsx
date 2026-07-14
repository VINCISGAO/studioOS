"use client";

import type { KnowledgeDashboardStatsDto, KnowledgeArticleListItemDto } from "@/features/knowledge-center/knowledge-center.types";
import { KnowledgeListDataTable } from "@/components/studioos/knowledge-list/knowledge-list-data-table";
import {
  KnowledgeListFiltersBar,
  type KnowledgeListFilters
} from "@/components/studioos/knowledge-list/knowledge-list-filters-bar";
import { KnowledgeListPageHeader } from "@/components/studioos/knowledge-list/knowledge-list-page-header";
import { KnowledgeListPagination } from "@/components/studioos/knowledge-list/knowledge-list-pagination";
import { adminMutationHeaders } from "@/lib/studioos/admin-csrf-client";
import type { Locale } from "@/lib/i18n";
import { Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const DEFAULT_FILTERS: KnowledgeListFilters = {
  query: "",
  category: "ALL",
  status: "ALL",
  language: "ALL"
};

const SEARCH_DEBOUNCE_MS = 350;

export function AdminKnowledgeListPanel({ locale }: { locale: Locale }) {
  const zh = locale === "zh";
  const [articles, setArticles] = useState<KnowledgeArticleListItemDto[]>([]);
  const [stats, setStats] = useState<KnowledgeDashboardStatsDto | null>(null);
  const [filters, setFilters] = useState<KnowledgeListFilters>(DEFAULT_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(filters.query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [filters.query]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (filters.status !== "ALL") params.set("status", filters.status);
    if (filters.category !== "ALL") params.set("category", filters.category);
    if (filters.language !== "ALL") params.set("language", filters.language);
    try {
      const response = await fetch(`/api/admin/knowledge?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as {
        data?: { articles?: KnowledgeArticleListItemDto[]; stats?: KnowledgeDashboardStatsDto };
      };
      const rows = payload.data?.articles ?? [];
      setArticles(rows);
      setStats(payload.data?.stats ?? null);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters.category, filters.language, filters.status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const pagedArticles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return articles.slice(start, start + pageSize);
  }, [articles, page, pageSize]);

  async function removeArticle(article: KnowledgeArticleListItemDto) {
    const confirmed = window.confirm(
      zh ? `确定删除「${article.title || article.slug}」？` : `Delete "${article.title || article.slug}"?`
    );
    if (!confirmed) return;
    setDeletingId(article.id);
    try {
      const response = await fetch(`/api/admin/knowledge/${article.id}`, {
        method: "DELETE",
        headers: adminMutationHeaders()
      });
      if (!response.ok) throw new Error(zh ? "删除失败" : "Delete failed");
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : zh ? "删除失败" : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function removeSelected() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    if (!window.confirm(zh ? `确定删除选中的 ${ids.length} 篇文章？` : `Delete ${ids.length} selected articles?`)) return;
    setBulkDeleting(true);
    try {
      const response = await fetch("/api/admin/knowledge/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminMutationHeaders() },
        body: JSON.stringify({ ids })
      });
      if (!response.ok) throw new Error(zh ? "批量删除失败" : "Bulk delete failed");
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : zh ? "批量删除失败" : "Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <KnowledgeListPageHeader locale={locale} stats={stats} />

      <KnowledgeListFiltersBar
        locale={locale}
        filters={filters}
        onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {selectedIds.size > 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm">
          <span className="text-zinc-600">{zh ? `已选 ${selectedIds.size} 篇` : `${selectedIds.size} selected`}</span>
          <button
            type="button"
            disabled={bulkDeleting}
            onClick={() => void removeSelected()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            {zh ? "批量删除" : "Delete selected"}
          </button>
        </div>
      ) : null}

      <KnowledgeListDataTable
        locale={locale}
        articles={pagedArticles}
        loading={loading}
        selectedIds={selectedIds}
        deletingId={deletingId}
        bulkDeleting={bulkDeleting}
        onToggleSelect={(id) =>
          setSelectedIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
        onToggleSelectAll={() => {
          if (pagedArticles.every((article) => selectedIds.has(article.id))) {
            setSelectedIds(new Set());
            return;
          }
          setSelectedIds(new Set(pagedArticles.map((article) => article.id)));
        }}
        onRemove={removeArticle}
      />

      <KnowledgeListPagination
        locale={locale}
        total={articles.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
