/** Static hero background — API route resolves file from public/ or bundled assets. */
export const HERO_BACKGROUND_SRC = "/api/home-hero-bg";

/** @deprecated Renamed to HERO_BACKGROUND_SRC when video was replaced with a static image. */
export const HERO_VIDEO_SRC = HERO_BACKGROUND_SRC;

/** @deprecated Poster no longer used — background is a single static image. */
export const HERO_VIDEO_POSTER = HERO_BACKGROUND_SRC;
