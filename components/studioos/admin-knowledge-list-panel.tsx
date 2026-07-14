"use client";

import type { KnowledgeDashboardStatsDto, KnowledgeArticleListItemDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label={zh ? "文章总数" : "Articles"} value={stats.articles} />
      <StatCard label={zh ? "已发布" : "Published"} value={stats.published} />
      <StatCard label={zh ? "草稿" : "Draft"} value={stats.draft} />
      <StatCard label={zh ? "Lucien 索引" : "Lucien indexed"} value={stats.lucien_indexed} />
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
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={adminPortalRoutes.knowledgeCitations}>{zh ? "AI 引用监控" : "AI Citation Monitor"}</Link>
          </Button>
          <Button asChild>
            <Link href={adminPortalRoutes.knowledgeNew}>{zh ? "新建文章" : "New Article"}</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.6fr_0.8fr_0.7fr_0.6fr_0.5fr_0.5fr] gap-3 border-b border-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
          <span>{zh ? "标题" : "Title"}</span>
          <span>{zh ? "分类" : "Category"}</span>
          <span>{zh ? "状态" : "Status"}</span>
          <span>{zh ? "语言" : "Language"}</span>
          <span>SEO</span>
          <span>Lucien</span>
        </div>
        {loading ? (
          <p className="px-4 py-8 text-sm text-zinc-500">{zh ? "加载中…" : "Loading…"}</p>
        ) : articles.length ? (
          articles.map((article) => (
            <Link
              key={article.id}
              href={adminPortalRoutes.knowledgeEdit(article.id)}
              className="grid grid-cols-[1.6fr_0.8fr_0.7fr_0.6fr_0.5fr_0.5fr] gap-3 border-b border-zinc-50 px-4 py-4 text-sm transition hover:bg-zinc-50"
            >
              <span className="font-medium text-zinc-900">{article.title}</span>
              <span className="text-zinc-500">{article.category || "—"}</span>
              <span className="text-zinc-600">{article.status}</span>
              <span className="text-zinc-600">{article.language_code}</span>
              <span className={cn(article.seo_score >= 80 ? "text-emerald-600" : article.seo_score >= 60 ? "text-amber-600" : "text-rose-600")}>
                {article.seo_score}
              </span>
              <span className={article.lucien_indexed ? "text-emerald-600" : "text-zinc-400"}>
                {article.lucien_indexed ? (zh ? "已同步" : "Synced") : (zh ? "未同步" : "Pending")}
              </span>
            </Link>
          ))
        ) : (
          <p className="px-4 py-8 text-sm text-zinc-500">{zh ? "还没有文章。" : "No articles yet."}</p>
        )}
      </div>
    </div>
  );
}
