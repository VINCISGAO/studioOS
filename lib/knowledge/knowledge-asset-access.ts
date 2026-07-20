import "server-only";

import path from "path";
import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import { knowledgePublicArticleWhere } from "@/features/knowledge-center/knowledge-public.filters";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

const SAFE_FILENAME = /^[a-f0-9-]+(?:-original)?\.(?:webp|avif|jpe?g|png|gif)$/i;

const publishedArticleScope = knowledgePublicArticleWhere({ deletedAt: null });

export function isSafeKnowledgeAssetFileName(fileName: string): boolean {
  return SAFE_FILENAME.test(path.basename(fileName));
}

async function isReferencedByPublishedContent(fileName: string): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;

  const [coverHit, bodyHit, seoHit, assetHit] = await Promise.all([
    prisma.knowledgeArticle.findFirst({
      where: { ...publishedArticleScope, coverImageUrl: { contains: fileName } },
      select: { id: true }
    }),
    prisma.knowledgeTranslation.findFirst({
      where: {
        status: "PUBLISHED",
        bodyHtml: { contains: fileName },
        article: publishedArticleScope
      },
      select: { id: true }
    }),
    prisma.knowledgeSeo.findFirst({
      where: {
        ogImageUrl: { contains: fileName },
        translation: { status: "PUBLISHED", article: publishedArticleScope }
      },
      select: { id: true }
    }),
    prisma.knowledgeAsset.findFirst({
      where: {
        OR: [{ url: { contains: fileName } }, { storageKey: { contains: fileName } }],
        translation: { status: "PUBLISHED", article: publishedArticleScope }
      },
      select: { id: true }
    })
  ]);

  return Boolean(coverHit ?? bodyHit ?? seoHit ?? assetHit);
}

/** Draft assets stay admin-only; published article media is world-readable. */
export async function canServePublicKnowledgeAsset(
  fileName: string,
  request?: Request
): Promise<boolean> {
  const safeName = path.basename(fileName);
  if (!isSafeKnowledgeAssetFileName(safeName)) return false;

  const admin = await validateAdminSession(request);
  if (admin) return true;

  return isReferencedByPublishedContent(safeName);
}
