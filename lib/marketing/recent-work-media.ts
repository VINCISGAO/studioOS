const DEFAULT_MARKETING_CDN = "https://pub-f68761fae15346faa85da45b7929e5bb.r2.dev";

export const RECENT_WORK_PATH_PREFIX = "/videos/home/recent-work/";

const VIDEO_FILE_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/iu;
const IMAGE_FILE_PATTERN = /\.(jpe?g|webp|png|gif|avif)(\?|#|$)/iu;

function encodeObjectKey(objectKey: string): string {
  return objectKey
    .split("/")
    .map((segment) => (segment ? encodeURIComponent(segment) : ""))
    .join("/");
}

function decodePathnameKey(pathname: string): string {
  return pathname
    .replace(/^\/+/u, "")
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

/** Public R2 CDN base — safe on server and client (falls back to known bucket URL). */
export function marketingCdnBase(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_MARKETING_CDN_URL?.trim() ||
    process.env.MARKETING_CDN_UPSTREAM?.trim();
  return (fromEnv ?? DEFAULT_MARKETING_CDN).replace(/\/+$/u, "");
}

export function isRecentWorkVideoPath(path: string): boolean {
  const value = path.trim();
  if (!value.startsWith(RECENT_WORK_PATH_PREFIX)) return false;
  const decoded = decodeURIComponent(value);
  return VIDEO_FILE_PATTERN.test(value) || VIDEO_FILE_PATTERN.test(decoded);
}

export function isRecentWorkImagePath(path: string): boolean {
  const value = path.trim();
  if (!value.startsWith(RECENT_WORK_PATH_PREFIX)) return false;
  const decoded = decodeURIComponent(value);
  return IMAGE_FILE_PATTERN.test(value) || IMAGE_FILE_PATTERN.test(decoded);
}

export function isRecentWorkAssetPath(path: string): boolean {
  return isRecentWorkVideoPath(path) || isRecentWorkImagePath(path);
}

/** Same-origin poster path — served via `/videos/*` proxy (local public → CDN). */
export function recentWorkPosterPath(videoPath: string): string {
  return videoPath.replace(/\.(mp4|webm|mov|m4v)(\?.*)?$/iu, ".jpg");
}

export function recentWorkAssetPath(fileName: string): string {
  return `/videos/home/recent-work/${encodeURI(fileName)}`;
}

/** Direct CDN object URL — decodes first to avoid `%20` → `%2520` double encoding. */
export function recentWorkCdnUrl(pathname: string): string {
  const decodedKey = decodePathnameKey(pathname);
  return `${marketingCdnBase()}/${encodeObjectKey(decodedKey)}`;
}

/** @deprecated Prefer same-origin `recentWorkPosterPath` for homepage cards. */
export function recentWorkPosterUrl(videoPath: string): string {
  return recentWorkCdnUrl(recentWorkPosterPath(videoPath));
}

/** Alternate on-disk names for the same recent-work asset. */
export function recentWorkBasenameAliases(fileName: string): string[] {
  const aliases = new Set<string>([fileName]);
  const lower = fileName.toLowerCase();

  if (lower === "video demo2.jpg" || lower === "video  demo2.jpg" || lower === "video demo 2.jpg") {
    aliases.add("Video demo2.jpg");
    aliases.add("Video  demo2.jpg");
    aliases.add("Video demo 2.jpg");
    aliases.add("video-demo-2.jpg");
  }
  if (lower === "video demo2.mp4" || lower === "video demo 2.mp4") {
    aliases.add("Video demo2.mp4");
    aliases.add("Video demo 2.mp4");
  }
  if (lower === "video-demo-2.jpg") {
    aliases.add("Video demo2.jpg");
    aliases.add("video-demo-2.jpg");
  }

  return [...aliases];
}

export function recentWorkPosterFallbackPaths(posterPath: string): string[] {
  const paths = new Set<string>([posterPath]);
  const fileName = decodePathnameKey(posterPath).split("/").pop() ?? "";

  for (const alias of recentWorkBasenameAliases(fileName)) {
    paths.add(recentWorkAssetPath(alias));
  }

  return [...paths];
}

/** R2 object keys to try when filenames differ on disk. */
export function recentWorkObjectKeyCandidates(pathname: string): string[] {
  const keys = new Set<string>();
  const objectKey = decodePathnameKey(pathname);
  keys.add(objectKey);

  const fileName = objectKey.split("/").pop() ?? "";
  const lower = fileName.toLowerCase();

  for (const alias of recentWorkBasenameAliases(fileName)) {
    keys.add(`videos/home/recent-work/${alias}`);
  }

  if (lower === "consumer-tech-reveal.mp4" || lower === "consumer-tech-reveal.jpg") {
    keys.add("videos/home/recent-work/consumer-tech-reveal.MP4");
    keys.add("videos/home/recent-work/consumer-tech-reveal.mp4");
    keys.add("videos/home/recent-work/consumer-tech-reveal.jpg");
  }

  return [...keys];
}
