"use client";

import type { KnowledgeArticleListItemDto } from "@/features/knowledge-center/knowledge-center.types";
import {
  formatKnowledgeListUpdatedAt,
  KnowledgeListCategoryBadge,
  knowledgeListLanguageLabel,
  KnowledgeListStatusBadge
} from "@/components/studioos/knowledge-list/knowledge-list-article-badges";
import { buildKnowledgeEditorAdminPreviewPath } from "@/lib/knowledge/knowledge-editor-preview";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import type { Locale } from "@/lib/i18n";
import { Eye, Loader2, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";

export function KnowledgeListMobileCards({
  locale,
  articles,
  loading,
  selectedIds,
  deletingId,
  bulkDeleting,
  onToggleSelect,
  onRemove
}: {
  locale: Locale;
  articles: KnowledgeArticleListItemDto[];
  loading: boolean;
  selectedIds: Set<string>;
  deletingId: string | null;
  bulkDeleting: boolean;
  onToggleSelect: (id: string) => void;
  onRemove: (article: KnowledgeArticleListItemDto) => void;
}) {
  const zh = locale === "zh";

  if (loading) {
    return <p className="px-4 py-10 text-center text-sm text-zinc-500">{zh ? "加载中…" : "Loading…"}</p>;
  }

  if (!articles.length) {
    return (
      <p className="px-4 py-10 text-center text-sm text-zinc-500">
        {zh ? "还没有文章。点击「新建文章」开始创作。" : "No articles yet. Create your first article."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {articles.map((article) => (
        <li key={article.id} className="p-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={selectedIds.has(article.id)}
              onChange={() => onToggleSelect(article.id)}
              className="mt-1"
              aria-label={article.title}
            />
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
              {article.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.cover_image_url} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={adminPortalRoutes.knowledgeEdit(article.id)}
                className="line-clamp-2 text-base font-medium leading-snug text-zinc-900 hover:text-violet-700"
              >
                {article.title || article.slug}
              </Link>
              <p className="mt-1 truncate text-xs text-zinc-400">/resources/{article.slug}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <KnowledgeListCategoryBadge
                  categorySlug={article.category_slug}
                  categoryName={article.category}
                  zh={zh}
                />
                <KnowledgeListStatusBadge status={article.status} zh={zh} />
                <span className="text-xs text-zinc-500">{knowledgeListLanguageLabel(article.language_code, zh)}</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                {zh ? "更新" : "Updated"} {formatKnowledgeListUpdatedAt(article.updated_at)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-1 pl-7">
            <Link
              href={buildKnowledgeEditorAdminPreviewPath(article.id, article.language_code)}
              target="_blank"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              aria-label={zh ? "预览" : "Preview"}
            >
              <Eye className="h-4 w-4" />
            </Link>
            <Link
              href={adminPortalRoutes.knowledgeEdit(article.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-violet-50 hover:text-violet-700"
              aria-label={zh ? "编辑" : "Edit"}
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              disabled={deletingId === article.id || bulkDeleting}
              onClick={() => void onRemove(article)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              aria-label={zh ? "删除" : "Delete"}
            >
              {deletingId === article.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
