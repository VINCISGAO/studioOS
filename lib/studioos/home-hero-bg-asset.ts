import { existsSync, readFileSync } from "fs";
import path from "path";

const ASSET_ROOT =
  ".cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets";

/** Source files uploaded in Cursor chat (newest first). */
const CHAT_ASSET_FILES = [
  "d2c4032c-36cb-4431-8587-17fc9309a920-8e852c55-f1ee-4346-a3fb-976c80e1536b.png",
  "image-69b788da-eb7b-4171-929e-71a681c747b5.png",
  "home-hero-bg.png"
];

function assetCandidates() {
  const home = process.env.HOME ?? "";
  const cwd = process.cwd();
  const chatAssets = CHAT_ASSET_FILES.flatMap((fileName) => [
    path.join(home, ASSET_ROOT, fileName),
    path.join(cwd, "../../", ASSET_ROOT, fileName)
  ]);

  return [
    path.join(cwd, "public/images/home-hero-bg.png"),
    path.join(cwd, "assets/marketing/home-hero-bg.png"),
    ...chatAssets
  ];
}

export function readHomeHeroBgAsset(): Buffer | null {
  const source = assetCandidates().find((candidate) => existsSync(candidate));
  if (!source) {
    return null;
  }
  return readFileSync(source);
}

export function homeHeroBgResponse() {
  const body = readHomeHeroBgAsset();
  if (!body) {
    return new Response("Home hero background not found", { status: 404 });
  }
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"
    }
  });
}
