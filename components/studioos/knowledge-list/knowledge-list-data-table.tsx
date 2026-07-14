"use client";

import type { KnowledgeArticleListItemDto } from "@/features/knowledge-center/knowledge-center.types";
import {
  formatKnowledgeListUpdatedAt,
  KnowledgeListCategoryBadge,
  knowledgeListLanguageLabel,
  KnowledgeListStatusBadge
} from "@/components/studioos/knowledge-list/knowledge-list-article-badges";
import { KnowledgeListMobileCards } from "@/components/studioos/knowledge-list/knowledge-list-mobile-cards";
import { buildKnowledgeEditorAdminPreviewPath } from "@/lib/knowledge/knowledge-editor-preview";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Eye, Loader2, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";

function SeoScoreRing({ score }: { score: number }) {
  if (!score) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-xs text-zinc-300">
        —
      </div>
    );
  }
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const tone = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-rose-500";
  return (
    <div className={cn("relative h-9 w-9", tone)}>
      <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-zinc-700">{score}</span>
    </div>
  );
}

export function KnowledgeListDataTable({
  locale,
  articles,
  loading,
  selectedIds,
  deletingId,
  bulkDeleting,
  onToggleSelect,
  onToggleSelectAll,
  onRemove
}: {
  locale: Locale;
  articles: KnowledgeArticleListItemDto[];
  loading: boolean;
  selectedIds: Set<string>;
  deletingId: string | null;
  bulkDeleting: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRemove: (article: KnowledgeArticleListItemDto) => void;
}) {
  const zh = locale === "zh";
  const allSelected = articles.length > 0 && articles.every((article) => selectedIds.has(article.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="md:hidden">
        <KnowledgeListMobileCards
          locale={locale}
          articles={articles}
          loading={loading}
          selectedIds={selectedIds}
          deletingId={deletingId}
          bulkDeleting={bulkDeleting}
          onToggleSelect={onToggleSelect}
          onRemove={onRemove}
        />
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-12" />
            <col className="w-[min(42%,520px)]" />
            <col className="w-[120px]" />
            <col className="w-[108px]" />
            <col className="w-[108px]" />
            <col className="w-[88px]" />
            <col className="w-[108px]" />
            <col className="w-[148px]" />
            <col className="w-[120px]" />
          </colgroup>
          <thead className="border-b border-zinc-100 bg-zinc-50/60 text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} aria-label={zh ? "全选" : "Select all"} />
              </th>
              <th className="px-4 py-3 font-medium">{zh ? "标题" : "Title"}</th>
              <th className="px-4 py-3 font-medium">{zh ? "分类" : "Category"}</th>
              <th className="px-4 py-3 font-medium">{zh ? "状态" : "Status"}</th>
              <th className="px-4 py-3 font-medium">{zh ? "语言" : "Language"}</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">{zh ? "SEO" : "SEO"}</th>
              <th className="hidden px-4 py-3 font-medium xl:table-cell">Lucien</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">{zh ? "更新时间" : "Updated"}</th>
              <th className="px-4 py-3 font-medium">{zh ? "操作" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-zinc-500">
                  {zh ? "加载中…" : "Loading…"}
                </td>
              </tr>
            ) : articles.length ? (
              articles.map((article) => (
                <tr key={article.id} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                  <td className="px-4 py-4 align-middle">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(article.id)}
                      onChange={() => onToggleSelect(article.id)}
                      aria-label={article.title}
                    />
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                        {article.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={article.cover_image_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={adminPortalRoutes.knowledgeEdit(article.id)}
                          className="block truncate font-medium text-zinc-900 hover:text-violet-700"
                        >
                          {article.title || article.slug}
                        </Link>
                        <p className="truncate text-xs text-zinc-400">/knowledge-center/{article.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <KnowledgeListCategoryBadge
                      categorySlug={article.category_slug}
                      categoryName={article.category}
                      zh={zh}
                    />
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <KnowledgeListStatusBadge status={article.status} zh={zh} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 align-middle text-zinc-600">
                    {knowledgeListLanguageLabel(article.language_code, zh)}
                  </td>
                  <td className="hidden px-4 py-4 align-middle lg:table-cell">
                    <SeoScoreRing score={article.seo_score} />
                  </td>
                  <td className="hidden px-4 py-4 align-middle xl:table-cell">
                    {article.lucien_indexed ? (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        {zh ? "已同步" : "Synced"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-zinc-400">
                        <Circle className="h-4 w-4" />
                        {zh ? "未同步" : "Pending"}
                      </span>
                    )}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-4 align-middle text-zinc-500 lg:table-cell">
                    {formatKnowledgeListUpdatedAt(article.updated_at)}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center gap-1">
                      <Link
                        href={buildKnowledgeEditorAdminPreviewPath(article.id, article.language_code)}
                        target="_blank"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                        aria-label={zh ? "预览" : "Preview"}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={adminPortalRoutes.knowledgeEdit(article.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-violet-50 hover:text-violet-700"
                        aria-label={zh ? "编辑" : "Edit"}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === article.id || bulkDeleting}
                        onClick={() => void onRemove(article)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        aria-label={zh ? "删除" : "Delete"}
                      >
                        {deletingId === article.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-zinc-500">
                  {zh ? "还没有文章。点击「新建文章」开始创作。" : "No articles yet. Create your first article."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
