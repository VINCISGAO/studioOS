"use client";

import type { KnowledgeDashboardStatsDto, KnowledgeArticleListItemDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { adminMutationHeaders } from "@/lib/studioos/admin-csrf-client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { KnowledgeAdminNavLink } from "@/components/studioos/knowledge-editor/knowledge-admin-nav-link";
import { cn } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";

const LIST_GRID =
  "grid grid-cols-[minmax(0,1.5fr)_0.75fr_0.65fr_0.55fr_0.45fr_0.45fr_2.5rem] gap-3";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

export function AdminKnowledgeStats({ locale, stats }: { locale: Locale; stats: KnowledgeDashboardStatsDto }) {
  const zh = locale === "zh";
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard label={zh ? "文章总数" : "Articles"} value={stats.articles} />
      <StatCard label={zh ? "已发布" : "Published"} value={stats.published} />
      <StatCard label={zh ? "Google 就绪" : "Google ready"} value={stats.google_indexed} />
      <StatCard label={zh ? "百度就绪" : "Baidu ready"} value={stats.baidu_indexed} />
      <StatCard label={zh ? "Bing 就绪" : "Bing ready"} value={stats.bing_indexed} />
      <StatCard label={zh ? "平均 SEO" : "Avg SEO"} value={stats.avg_seo} />
    </div>
  );
}

export function AdminKnowledgeListPanel({ locale }: { locale: Locale }) {
  const zh = locale === "zh";
  const [articles, setArticles] = useState<KnowledgeArticleListItemDto[]>([]);
  const [stats, setStats] = useState<KnowledgeDashboardStatsDto | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const response = await fetch(`/api/admin/knowledge?${params.toString()}`, { cache: "no-store" });
    const payload = (await response.json()) as {
      data?: { articles?: KnowledgeArticleListItemDto[]; stats?: KnowledgeDashboardStatsDto };
    };
    setArticles(payload.data?.articles ?? []);
    setStats(payload.data?.stats ?? null);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeArticle(article: KnowledgeArticleListItemDto) {
    const confirmed = window.confirm(
      zh
        ? `确定删除「${article.title}」？文章将从知识中心移除。`
        : `Delete "${article.title}"? It will be removed from the knowledge center.`
    );
    if (!confirmed) return;

    setDeletingId(article.id);
    try {
      const response = await fetch(`/api/admin/knowledge/${article.id}`, {
        method: "DELETE",
        headers: adminMutationHeaders()
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string | { message?: string };
      } | null;
      if (!response.ok) {
        const apiError =
          typeof payload?.error === "string" ? payload.error : payload?.error?.message;
        throw new Error(apiError ?? (zh ? "删除失败" : "Delete failed"));
      }
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : zh ? "删除失败" : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {stats ? <AdminKnowledgeStats locale={locale} stats={stats} /> : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={zh ? "搜索标题、Slug…" : "Search title, slug…"}
          className="max-w-md"
        />
        <div className="relative z-10 flex flex-wrap gap-2">
          <KnowledgeAdminNavLink href={adminPortalRoutes.knowledgeSeo}>
            {zh ? "AI SEO Dashboard" : "AI SEO Dashboard"}
          </KnowledgeAdminNavLink>
          <KnowledgeAdminNavLink href={adminPortalRoutes.knowledgeCitations}>
            {zh ? "AI 引用监控" : "AI Citation Monitor"}
          </KnowledgeAdminNavLink>
          <KnowledgeAdminNavLink href={adminPortalRoutes.knowledgeNew} variant="primary">
            {zh ? "新建文章" : "New Article"}
          </KnowledgeAdminNavLink>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className={cn(LIST_GRID, "border-b border-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400")}>
          <span>{zh ? "标题" : "Title"}</span>
          <span>{zh ? "分类" : "Category"}</span>
          <span>{zh ? "状态" : "Status"}</span>
          <span>{zh ? "语言" : "Language"}</span>
          <span>SEO</span>
          <span>Lucien</span>
          <span className="sr-only">{zh ? "操作" : "Actions"}</span>
        </div>
        {loading ? (
          <p className="px-4 py-8 text-sm text-zinc-500">{zh ? "加载中…" : "Loading…"}</p>
        ) : articles.length ? (
          articles.map((article) => (
            <div
              key={article.id}
              className={cn(LIST_GRID, "border-b border-zinc-50 px-4 py-4 text-sm last:border-b-0")}
            >
              <Link
                href={adminPortalRoutes.knowledgeEdit(article.id)}
                className="min-w-0 font-medium text-zinc-900 transition hover:text-violet-700"
              >
                {article.title}
              </Link>
              <span className="text-zinc-500">{article.category || "—"}</span>
              <span className="text-zinc-600">{article.status}</span>
              <span className="text-zinc-600">{article.language_code}</span>
              <span
                className={cn(
                  article.seo_score >= 80
                    ? "text-emerald-600"
                    : article.seo_score >= 60
                      ? "text-amber-600"
                      : "text-rose-600"
                )}
              >
                {article.seo_score}
              </span>
              <span className={article.lucien_indexed ? "text-emerald-600" : "text-zinc-400"}>
                {article.lucien_indexed ? (zh ? "已同步" : "Synced") : (zh ? "未同步" : "Pending")}
              </span>
              <button
                type="button"
                aria-label={zh ? `删除 ${article.title}` : `Delete ${article.title}`}
                disabled={deletingId === article.id}
                onClick={() => void removeArticle(article)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                {deletingId === article.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          ))
        ) : (
          <p className="px-4 py-8 text-sm text-zinc-500">{zh ? "还没有文章。" : "No articles yet."}</p>
        )}
      </div>
    </div>
  );
}
