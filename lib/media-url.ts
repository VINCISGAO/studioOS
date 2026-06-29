const PLACEHOLDER_THUMBNAIL_MARKERS = ["photo-1618005182384-a83a8bd57fbe"];

const YOUTUBE_ID_PATTERN = /[a-zA-Z0-9_-]{11}/;

export function sanitizeVideoUrl(url: string) {
  return url.trim().replace(/\s+/g, "");
}

function normalizeYouTubeId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/^([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export function extractYouTubeVideoId(url: string): string | null {
  const value = sanitizeVideoUrl(url);
  if (!value) {
    return null;
  }

  const fromPattern = value.match(
    /(?:youtu\.be\/|youtube\.com\/(?:shorts|embed|live|v)\/|[?&]v=)([a-zA-Z0-9_-]{11})/
  );
  if (fromPattern?.[1]) {
    return fromPattern[1];
  }

  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes("youtu.be")) {
      return normalizeYouTubeId(parsed.pathname.split("/").filter(Boolean)[0]);
    }

    if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtube-nocookie.com")) {
      const fromQuery = normalizeYouTubeId(parsed.searchParams.get("v"));
      if (fromQuery) {
        return fromQuery;
      }

      const segments = parsed.pathname.split("/").filter(Boolean);
      for (const marker of ["shorts", "embed", "live", "v"]) {
        const index = segments.indexOf(marker);
        if (index >= 0) {
          const id = normalizeYouTubeId(segments[index + 1]);
          if (id) {
            return id;
          }
        }
      }
    }
  } catch {
    return null;
  }

  const looseMatch = value.match(YOUTUBE_ID_PATTERN);
  return looseMatch?.[0] && value.includes("youtube") ? looseMatch[0] : null;
}

export function youtubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function isPlaceholderThumbnail(url: string) {
  return PLACEHOLDER_THUMBNAIL_MARKERS.some((marker) => url.includes(marker));
}

function extractVimeoThumbnailUrl(url: string) {
  const id = extractVimeoVideoId(url);
  return id ? `https://vumbnail.com/${id}.jpg` : null;
}

export function isLikelyImageUrl(url: string) {
  if (!url.trim()) {
    return false;
  }

  const value = url.trim();
  if (value.includes("youtube.com") || value.includes("youtu.be/")) {
    return false;
  }

  return (
    /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(value) ||
    value.includes("images.unsplash.com") ||
    value.includes("img.youtube.com") ||
    value.includes("supabase.co")
  );
}

export function resolveWorkThumbnail(videoUrl: string, thumbnailUrl?: string) {
  const thumb = thumbnailUrl?.trim() ?? "";
  const video = sanitizeVideoUrl(videoUrl);

  const youtubeFromVideo = extractYouTubeVideoId(video);
  if (youtubeFromVideo) {
    return youtubeThumbnail(youtubeFromVideo);
  }

  const vimeoFromVideo = extractVimeoThumbnailUrl(video);
  if (vimeoFromVideo) {
    return vimeoFromVideo;
  }

  if (isLikelyImageUrl(thumb) && !isPlaceholderThumbnail(thumb)) {
    return thumb;
  }

  const youtubeFromThumb = extractYouTubeVideoId(thumb);
  if (youtubeFromThumb) {
    return youtubeThumbnail(youtubeFromThumb);
  }

  const vimeoFromThumb = extractVimeoThumbnailUrl(thumb);
  if (vimeoFromThumb) {
    return vimeoFromThumb;
  }

  if (isLikelyImageUrl(video)) {
    return video;
  }

  return null;
}

export function canOptimizeImageSrc(src: string) {
  try {
    const hostname = new URL(src).hostname;
    return (
      hostname === "images.unsplash.com" ||
      hostname === "img.youtube.com" ||
      hostname === "vumbnail.com" ||
      hostname.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}

export type VideoEmbed =
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string }
  | { kind: "none" };

function extractVimeoVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (!parsed.hostname.includes("vimeo.com")) {
      return null;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    const id = segments.find((segment) => /^\d+$/.test(segment));
    return id ?? null;
  } catch {
    return null;
  }
}

function extractTikTokVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (!parsed.hostname.includes("tiktok.com")) {
      return null;
    }

    const match = parsed.pathname.match(/\/video\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function isDirectVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url.trim());
}

export function resolveVideoEmbed(url: string): VideoEmbed {
  const trimmed = sanitizeVideoUrl(url);
  if (!trimmed) {
    return { kind: "none" };
  }

  const youtubeId = extractYouTubeVideoId(trimmed);
  if (youtubeId) {
    return {
      kind: "iframe",
      src: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    };
  }

  const vimeoId = extractVimeoVideoId(trimmed);
  if (vimeoId) {
    return {
      kind: "iframe",
      src: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
    };
  }

  const tikTokId = extractTikTokVideoId(trimmed);
  if (tikTokId) {
    return {
      kind: "iframe",
      src: `https://www.tiktok.com/embed/v2/${tikTokId}?autoplay=1`
    };
  }

  if (isDirectVideoUrl(trimmed)) {
    return { kind: "video", src: trimmed };
  }

  return { kind: "none" };
}

export function canEmbedVideo(url: string) {
  return resolveVideoEmbed(url).kind !== "none";
}
