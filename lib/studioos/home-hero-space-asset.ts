const PUBLIC_HERO_PATH = "/images/home-hero-space.png";
const PUBLIC_HERO_2X_PATH = "/images/home-hero-space@2x.png";

/** Bumped when owner replaces hero PNG; avoids per-request statSync on homepage SSR. */
const HERO_ASSET_VERSION =
  process.env.NEXT_PUBLIC_HERO_ASSET_VERSION?.trim() ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
  "1";

function versionQuery() {
  return `?v=${HERO_ASSET_VERSION}`;
}

/** 1x + optional 2x for Retina hero backdrop. */
export function getHomeHeroSpaceBackgroundSources() {
  return {
    src: `${PUBLIC_HERO_PATH}${versionQuery()}`,
    src2x: `${PUBLIC_HERO_2X_PATH}${versionQuery()}`
  };
}
