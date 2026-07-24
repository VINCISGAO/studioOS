const PREVIEW_ASSET_ID_PATTERN =
  /\/api\/canvas\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/preview/i;

export function parseCanvasPreviewAssetId(url: string | undefined): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;

  const match = trimmed.match(PREVIEW_ASSET_ID_PATTERN);
  return match?.[1];
}

export function enrichCanvasGenerationReference<
  T extends {
    url: string;
    assetId?: string;
    fileName: string;
    mimeType?: string;
    source: "local" | "library" | "canvas";
    nodeId?: string;
  }
>(reference: T): T {
  if (reference.assetId?.trim()) return reference;

  const parsed = parseCanvasPreviewAssetId(reference.url);
  if (!parsed) return reference;

  return { ...reference, assetId: parsed };
}
