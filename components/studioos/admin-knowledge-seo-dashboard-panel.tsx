"use client";

import type { KnowledgeSeoDashboardDto, KnowledgeSeoSurfaceStatus } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { KnowledgeAdminNavLink } from "@/components/studioos/knowledge-editor/knowledge-admin-nav-link";
import { cn } from "@/lib/utils";

function StatusPill({ status }: { status: KnowledgeSeoSurfaceStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold uppercase",
        status === "ok" && "bg-emerald-50 text-emerald-700",
        status === "warn" && "bg-amber-50 text-amber-700",
        status === "error" && "bg-rose-50 text-rose-700"
      )}
    >
      {status}
    </span>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
      {hint ? <p className="mt-2 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function AdminKnowledgeSeoDashboardPanel({ locale }: { locale: Locale }) {
  const zh = locale === "zh";
  const [dashboard, setDashboard] = useState<KnowledgeSeoDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/knowledge/seo-dashboard", { cache: "no-store" });
    const payload = (await response.json()) as { data?: { dashboard?: KnowledgeSeoDashboardDto } };
    setDashboard(payload.data?.dashboard ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-zinc-500">{zh ? "加载 SEO 面板…" : "Loading SEO dashboard…"}</p>;
  }

  if (!dashboard) {
    return <p className="text-sm text-rose-600">{zh ? "无法加载 SEO 数据。" : "Unable to load SEO dashboard."}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B5CEB]">AI SEO Dashboard</p>
          <h2 className="mt-1 text-2xl font-semibold text-zinc-950">{zh ? "知识中心 SEO 健康度" : "Knowledge Center SEO Health"}</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">{dashboard.note}</p>
        </div>
        <div className="flex gap-2">
          <KnowledgeAdminNavLink href={adminPortalRoutes.knowledge}>{zh ? "文章列表" : "Articles"}</KnowledgeAdminNavLink>
          <KnowledgeAdminNavLink href={adminPortalRoutes.knowledgeNew} variant="primary">{zh ? "新建文章" : "New Article"}</KnowledgeAdminNavLink>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={zh ? "Google SEO 技术就绪" : "Google SEO-ready"}
          value={dashboard.indexes.google}
          hint={zh ? "已发布且 Schema + Meta + 分数达标" : "Published with schema, meta, and score thresholds"}
        />
        <MetricCard
          label={zh ? "百度 SEO 技术就绪" : "Baidu SEO-ready"}
          value={dashboard.indexes.baidu}
          hint={zh ? "已发布且 Meta + 百度分数达标" : "Published with meta and Baidu score thresholds"}
        />
        <MetricCard
          label={zh ? "Bing SEO 技术就绪" : "Bing SEO-ready"}
          value={dashboard.indexes.bing}
          hint={zh ? "已发布且 Schema + SEO 分数达标" : "Published with schema and SEO score thresholds"}
        />
        <MetricCard label={zh ? "站内搜索索引" : "Site search indexed"} value={dashboard.site_search_indexed ?? 0} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SurfaceCard title="Sitemap" url={dashboard.surfaces.sitemap.url} status={dashboard.surfaces.sitemap.status} detail={`${dashboard.surfaces.sitemap.entries} entries`} />
        <SurfaceCard title="robots.txt" url={dashboard.surfaces.robots.url} status={dashboard.surfaces.robots.status} />
        <SurfaceCard title="llms.txt" url={dashboard.surfaces.llms.url} status={dashboard.surfaces.llms.status} detail={`${dashboard.surfaces.llms.entries} articles`} />
        <SurfaceCard
          title="Schema.org"
          status={dashboard.surfaces.schema.status}
          detail={`${dashboard.surfaces.schema.covered}/${dashboard.surfaces.schema.total} published`}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-900">{zh ? "每篇文章 SEO / AI 评分" : "Per-article SEO / AI scores"}</h3>
        </div>
        <div className="grid grid-cols-[1.4fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr] gap-3 border-b border-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          <span>{zh ? "标题" : "Title"}</span>
          <span>SEO</span>
          <span>{zh ? "AI 可读" : "AI"}</span>
          <span>Google</span>
          <span>Baidu</span>
          <span>Schema</span>
          <span>hreflang</span>
          <span>Lucien</span>
        </div>
        {dashboard.articles.length ? (
          dashboard.articles.map((article) => (
            <Link
              key={`${article.id}-${article.language_code}`}
              href={adminPortalRoutes.knowledgeEdit(article.id)}
              className="grid grid-cols-[1.4fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr] gap-3 border-b border-zinc-50 px-4 py-3 text-sm transition hover:bg-zinc-50"
            >
              <span className="min-w-0 truncate font-medium text-zinc-900">{article.title}</span>
              <ScoreCell value={article.seo_score} />
              <ScoreCell value={article.ai_friendly_score} />
              <ScoreCell value={article.google_score} />
              <ScoreCell value={article.baidu_score} />
              <span className={article.schema_ready ? "text-emerald-600" : "text-zinc-400"}>{article.schema_ready ? "✓" : "—"}</span>
              <span className="text-zinc-600">{article.hreflang_languages}</span>
              <span className={article.lucien_indexed ? "text-emerald-600" : "text-zinc-400"}>{article.lucien_indexed ? "✓" : "—"}</span>
            </Link>
          ))
        ) : (
          <p className="px-4 py-8 text-sm text-zinc-500">{zh ? "暂无文章。" : "No articles yet."}</p>
        )}
      </div>
    </div>
  );
}

function SurfaceCard({
  title,
  url,
  status,
  detail
}: {
  title: string;
  url?: string;
  status: KnowledgeSeoSurfaceStatus;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <StatusPill status={status} />
      </div>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-[#5B5CEB] hover:underline">
          {url}
        </a>
      ) : null}
      {detail ? <p className="mt-2 text-xs text-zinc-500">{detail}</p> : null}
    </div>
  );
}

function ScoreCell({ value }: { value: number }) {
  return (
    <span className={cn(value >= 80 ? "text-emerald-600" : value >= 60 ? "text-amber-600" : "text-rose-600")}>
      {value}
    </span>
  );
}
