import Link from "next/link";
import { notFound } from "next/navigation";
import { KnowledgeArticlePage } from "@/components/knowledge/knowledge-article-page";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { getAppUiLocale } from "@/lib/app-language";
import { toUiLocale } from "@/lib/app-language.shared";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function AdminKnowledgePreviewPage({ params, searchParams }: Props) {
  const [{ id }, query, adminLocale] = await Promise.all([params, searchParams, getAppUiLocale()]);
  const languageCode = typeof query.lang === "string" && query.lang.trim() ? query.lang.trim() : undefined;
  const article = await knowledgeCenterService.getAdminPreviewArticle(id, languageCode, adminLocale);
  if (!article) notFound();

  const uiLocale = toUiLocale(article.language_code);
  const zh = adminLocale === "zh";
  const isDraft = article.published_at == null;

  return (
    <div className="min-h-screen bg-[#fafafa] -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
        {isDraft
          ? zh
            ? "草稿预览（仅管理员可见，尚未公开发布）"
            : "Draft preview (admin only — not published yet)"
          : zh
            ? "已发布预览（管理员视图）"
            : "Published preview (admin view)"}
        <Link
          href={adminPortalRoutes.knowledgeEdit(id)}
          className="ml-3 font-medium text-violet-700 hover:text-violet-900"
        >
          {zh ? "返回编辑" : "Back to editor"}
        </Link>
      </div>
      <KnowledgeArticlePage locale={uiLocale} article={article} />
    </div>
  );
}
