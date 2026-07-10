import type { StoredProjectAsset } from "@/lib/campaign-types";

const FALLBACK_POOL = [
  "https://images.unsplash.com/photo-1590658268037-6bf12165a1df?auto=format&fit=crop&w=240&q=80",
  "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=240&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=240&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=240&q=80"
];

function hashIndex(value: string, size: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash + value.charCodeAt(i) * (i + 1)) % size;
  }
  return hash;
}

export function pickProjectThumbnailUrl(assets: StoredProjectAsset[]): string | null {
  return (
    assets.find((item) => item.type === "product_image")?.file_url ??
    assets.find((item) => item.type === "product_image_original")?.file_url ??
    assets.find((item) => item.type === "logo")?.file_url ??
    null
  );
}

export function fallbackProjectThumbnail(seed: string) {
  return FALLBACK_POOL[hashIndex(seed, FALLBACK_POOL.length)] ?? FALLBACK_POOL[0];
}

export function resolveProjectThumbnailUrl(
  assets: StoredProjectAsset[] | null | undefined,
  seed: string
): string {
  const picked = assets ? pickProjectThumbnailUrl(assets) : null;
  return picked ?? fallbackProjectThumbnail(seed);
}
