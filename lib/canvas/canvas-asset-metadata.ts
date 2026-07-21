export const CANVAS_LIBRARY_ASSET_KIND = "canvas_library_asset";
export const CANVAS_REFERENCE_ASSET_KIND = "canvas_reference_asset";
export const CANVAS_GENERATED_ASSET_KIND = "canvas_generated_asset";

/** @deprecated Legacy uploads before library split. */
export const LEGACY_CANVAS_ASSET_KIND = "canvas_asset";

export type SeedanceReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SeedanceReview = {
  status: SeedanceReviewStatus;
  reasons: string[];
  reviewedAt: string;
  reviewer: "seedance_auto";
};

export type ParsedCanvasAssetMetadata = {
  kind: string | null;
  source: string | null;
  seedanceReview: SeedanceReview | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function parseCanvasAssetMetadata(metadataJson: unknown): ParsedCanvasAssetMetadata {
  const meta = asRecord(metadataJson);
  const reviewRaw = asRecord(meta.seedanceReview);
  const status = reviewRaw.status;
  return {
    kind: typeof meta.kind === "string" ? meta.kind : null,
    source: typeof meta.source === "string" ? meta.source : null,
    seedanceReview:
      status === "PENDING" || status === "APPROVED" || status === "REJECTED"
        ? {
            status,
            reasons: Array.isArray(reviewRaw.reasons)
              ? reviewRaw.reasons.filter((item): item is string => typeof item === "string")
              : [],
            reviewedAt:
              typeof reviewRaw.reviewedAt === "string"
                ? reviewRaw.reviewedAt
                : new Date().toISOString(),
            reviewer: "seedance_auto"
          }
        : null
  };
}

export function isCanvasLibraryAsset(metadataJson: unknown) {
  const meta = parseCanvasAssetMetadata(metadataJson);
  if (meta.kind === CANVAS_LIBRARY_ASSET_KIND) return true;
  if (meta.kind === LEGACY_CANVAS_ASSET_KIND && meta.source === "creator_upload") return true;
  return false;
}

export function buildLibraryUploadMetadata(review: SeedanceReview) {
  return {
    kind: CANVAS_LIBRARY_ASSET_KIND,
    source: "creator_upload",
    seedanceReview: review
  };
}

export function buildReferenceUploadMetadata(source: "creator_upload" | "canvas_chat_gpt" = "creator_upload") {
  return {
    kind: CANVAS_REFERENCE_ASSET_KIND,
    source
  };
}

export function buildGeneratedAssetMetadata(extra: Record<string, unknown> = {}) {
  return {
    kind: CANVAS_GENERATED_ASSET_KIND,
    source: "canvas_chat_gpt",
    ...extra
  };
}
