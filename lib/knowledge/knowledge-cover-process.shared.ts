export function knowledgeCoverObjectKey(fileName: string) {
  return `knowledge/covers/${fileName}`;
}

export function knowledgeCoverAssetUrl(fileName: string) {
  return `/api/admin/knowledge/assets/${fileName}`;
}

export function resolveKnowledgeCoverSources(coverUrl: string | null | undefined) {
  if (!coverUrl) return null;
  const match = coverUrl.match(/\/api\/admin\/knowledge\/assets\/([a-f0-9-]+)\.webp$/i);
  if (!match) {
    return { fallback: coverUrl, sources: [] as Array<{ type: string; url: string }> };
  }
  const baseId = match[1];
  const originalCandidates = ["jpg", "jpeg", "png", "webp"].map(
    (ext) => knowledgeCoverAssetUrl(`${baseId}-original.${ext}`)
  );
  return {
    fallback: originalCandidates[0],
    sources: [
      { type: "image/avif", url: knowledgeCoverAssetUrl(`${baseId}.avif`) },
      { type: "image/webp", url: knowledgeCoverAssetUrl(`${baseId}.webp`) }
    ]
  };
}
