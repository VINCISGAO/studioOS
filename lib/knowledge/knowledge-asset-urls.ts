/** Object storage key for a knowledge image file name. */
export function knowledgeAssetObjectKey(fileName: string) {
  return `knowledge/covers/${fileName}`;
}

/** Permanent public read URL — no admin session required. */
export function knowledgePublicAssetUrl(fileName: string) {
  return `/api/knowledge/assets/${fileName}`;
}

/** Admin-only preview URL (legacy). Do not persist in published content. */
export function knowledgeAdminAssetUrl(fileName: string) {
  return `/api/admin/knowledge/assets/${fileName}`;
}

/** @deprecated Use knowledgePublicAssetUrl — kept for grep/migration only. */
export function knowledgeCoverAssetUrl(fileName: string) {
  return knowledgePublicAssetUrl(fileName);
}

const ADMIN_ASSET_PATH = /\/api\/admin\/knowledge\/assets\//i;
const PUBLIC_ASSET_PATH = "/api/knowledge/assets/";

export function rewriteKnowledgeAssetUrl(url: string | null | undefined): string {
  if (!url?.trim()) return "";
  const trimmed = url.trim();
  if (ADMIN_ASSET_PATH.test(trimmed)) {
    return trimmed.replace(ADMIN_ASSET_PATH, PUBLIC_ASSET_PATH);
  }
  return trimmed;
}

export function isForbiddenKnowledgeAssetUrl(url: string) {
  const value = url.trim().toLowerCase();
  return (
    value.startsWith("blob:") ||
    value.startsWith("javascript:") ||
    value.startsWith("data:text/html") ||
    value.includes("localhost") ||
    value.startsWith("/users/") ||
    value.startsWith("/tmp/")
  );
}

export function rewriteKnowledgeHtmlAssetUrls(html: string) {
  if (!html) return html;
  return html.replace(/<img\b[^>]*\bsrc=["']([^"']*)["'][^>]*>/gi, (full, src: string) => {
    if (isForbiddenKnowledgeAssetUrl(src)) return "";
    const nextSrc = rewriteKnowledgeAssetUrl(src);
    return nextSrc === src ? full : full.replace(src, nextSrc);
  });
}

export function resolveKnowledgeCoverSources(coverUrl: string | null | undefined) {
  const normalized = rewriteKnowledgeAssetUrl(coverUrl);
  if (!normalized) return null;
  const match = normalized.match(/\/api\/knowledge\/assets\/([a-f0-9-]+)\.webp$/i);
  if (!match) {
    return { fallback: normalized, sources: [] as Array<{ type: string; url: string }> };
  }
  const baseId = match[1];
  const originalCandidates = ["jpg", "jpeg", "png", "webp"].map(
    (ext) => knowledgePublicAssetUrl(`${baseId}-original.${ext}`)
  );
  return {
    fallback: originalCandidates[0],
    sources: [
      { type: "image/avif", url: knowledgePublicAssetUrl(`${baseId}.avif`) },
      { type: "image/webp", url: knowledgePublicAssetUrl(`${baseId}.webp`) }
    ]
  };
}
