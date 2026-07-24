import { existsSync } from "fs";
import path from "path";

const PUBLIC_HERO_PATH = "/images/background.png";
const PUBLIC_HERO_2X_PATH = "/images/background@2x.png";

/** Bumped when owner replaces hero PNG; avoids per-request statSync on homepage SSR. */
const HERO_ASSET_VERSION =
  process.env.NEXT_PUBLIC_HERO_ASSET_VERSION?.trim() ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
  "9";

let hero2xAvailable: boolean | null = null;

function versionQuery() {
  return `?v=${HERO_ASSET_VERSION}`;
}

function isHero2xAvailable() {
  if (hero2xAvailable === null) {
    hero2xAvailable = existsSync(path.join(process.cwd(), "public/images/background@2x.png"));
  }
  return hero2xAvailable;
}

/** 1x + optional 2x for Retina hero backdrop. */
export function getHomeHeroSpaceBackgroundSources() {
  const versioned = versionQuery();

  return {
    src: `${PUBLIC_HERO_PATH}${versioned}`,
    src2x: isHero2xAvailable() ? `${PUBLIC_HERO_2X_PATH}${versioned}` : undefined
  };
}
