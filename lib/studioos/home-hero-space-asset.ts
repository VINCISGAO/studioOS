import { existsSync, readFileSync } from "fs";
import path from "path";

const ASSET_ROOT =
  ".cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets";

const CHAT_ASSETS = [
  "f0820f8a-e12b-4141-929a-d24cf32004c5-22c92bbe-cbe7-4d8f-a163-a0e1c155f0be.png",
  "d2c4032c-36cb-4431-8587-17fc9309a920-8e852c55-f1ee-4346-a3fb-976c80e1536b.png",
  "image-69b788da-eb7b-4171-929e-71a681c747b5.png"
];

function candidates() {
  const home = process.env.HOME ?? "";
  const cwd = process.cwd();
  const chatAssets = CHAT_ASSETS.flatMap((fileName) => [
    path.join(home, ASSET_ROOT, fileName),
    path.join(home, ".cursor/projects/Users-linkele-Projects-studioOS/assets", fileName),
    path.join(cwd, "../../", ASSET_ROOT, fileName)
  ]);

  return [
    path.join(cwd, "public/images/home-hero-space.png"),
    path.join(cwd, "assets/marketing/home-hero-space.png"),
    ...chatAssets
  ];
}

export function readHomeHeroSpaceAsset(): Buffer | null {
  const source = candidates().find((candidate) => existsSync(candidate));
  if (!source) return null;
  return readFileSync(source);
}

export function homeHeroSpaceResponse() {
  const body = readHomeHeroSpaceAsset();
  if (!body) {
    return new Response("Hero space background not found", { status: 404 });
  }
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"
    }
  });
}
