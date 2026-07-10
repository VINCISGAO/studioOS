import { existsSync, readFileSync, statSync } from "fs";
import path from "path";

/** Marketing homepage hero — Earth from space (owner asset). */
const PUBLIC_HERO_PATH = "/images/home-hero-space.png";
const PUBLIC_HERO_2X_PATH = "/images/home-hero-space@2x.png";

function candidates() {
  const cwd = process.cwd();
  const home = process.env.HOME ?? "";
  const oneX = path.join(cwd, "public/images/home-hero-space.png");
  const bundled1x = path.join(cwd, "assets/marketing/home-hero-space.png");
  const twoX = path.join(cwd, "public/images/home-hero-space@2x.png");
  if (existsSync(oneX)) return [oneX, bundled1x];
  if (existsSync(twoX)) return [twoX];
  return [
    bundled1x,
    path.join(home, ".cursor/projects/Users-linkele-Projects-studioOS/assets/image-95d81c65-9e03-4130-9eb5-a5eb0a1d0ba1.png")
  ];
}

function candidates2x() {
  const cwd = process.cwd();
  return [
    path.join(cwd, "public/images/home-hero-space@2x.png"),
    path.join(cwd, "assets/marketing/home-hero-space@2x.png")
  ];
}

function versionQuery(filePath: string | undefined) {
  if (!filePath) return `?v=${Date.now()}`;
  const version = Math.floor(statSync(filePath).mtimeMs);
  return `?v=${version}`;
}

export function readHomeHeroSpaceAsset(): Buffer | null {
  const source = candidates().find((candidate) => existsSync(candidate));
  if (!source) return null;
  return readFileSync(source);
}

export function getHomeHeroSpaceBackgroundUrl(): string {
  const cwd = process.cwd();
  const oneX = path.join(cwd, "public/images/home-hero-space.png");
  const source = existsSync(oneX)
    ? oneX
    : candidates().find((candidate) => existsSync(candidate));
  return `${PUBLIC_HERO_PATH}${versionQuery(source)}`;
}

export function getHomeHeroSpaceBackgroundUrl2x(): string | undefined {
  const source = candidates2x().find((candidate) => existsSync(candidate));
  if (!source) return undefined;
  return `${PUBLIC_HERO_2X_PATH}${versionQuery(source)}`;
}

/** 1x + optional 2x for Retina hero backdrop. */
export function getHomeHeroSpaceBackgroundSources() {
  return {
    src: getHomeHeroSpaceBackgroundUrl(),
    src2x: getHomeHeroSpaceBackgroundUrl2x()
  };
}

export function homeHeroSpaceResponse() {
  const body = readHomeHeroSpaceAsset();
  if (!body) {
    return new Response("Home hero space background not found", { status: 404 });
  }
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
}
