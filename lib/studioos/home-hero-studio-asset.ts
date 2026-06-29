import { existsSync, readFileSync } from "fs";
import path from "path";

const ASSET_ROOT =
  ".cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets";

const STUDIO_FILES = [
  "dba0e50a-14b8-4743-a9e5-eb24fd434ce2-ae1f6ab4-b47b-46c2-b30f-0804bf4b0277.png",
  "image-5de13bfe-b0d6-4f11-b324-365b7986eb78.png"
];

function candidates() {
  const home = process.env.HOME ?? "";
  const cwd = process.cwd();
  const chatAssets = STUDIO_FILES.flatMap((fileName) => [
    path.join(home, ASSET_ROOT, fileName),
    path.join(cwd, "../../", ASSET_ROOT, fileName)
  ]);

  return [
    path.join(cwd, "public/images/home-hero-studio.png"),
    path.join(cwd, "assets/marketing/home-hero-studio.png"),
    ...chatAssets
  ];
}

export function readHomeHeroStudioAsset(): Buffer | null {
  const source = candidates().find((candidate) => existsSync(candidate));
  if (!source) return null;
  return readFileSync(source);
}

export function homeHeroStudioResponse() {
  const body = readHomeHeroStudioAsset();
  if (!body) {
    return new Response("Hero studio background not found", { status: 404 });
  }
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"
    }
  });
}
