import { existsSync, readFileSync } from "fs";
import path from "path";

const SPACE_ASSET_FILES = [
  "2026_6_29__02_06_45-61ae13a4-0fa5-47a1-902c-92fa594e614f.png",
  "image-469c9ec8-95b8-4a05-bb65-175e39b28542.png"
];

function assetCandidates() {
  const home = process.env.HOME ?? "";
  const assetRoot = path.join(
    home,
    ".cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets"
  );

  return [
    path.join(process.cwd(), "public/images/login-space-bg.png"),
    path.join(process.cwd(), "assets/marketing/login-space-bg.png"),
    ...SPACE_ASSET_FILES.flatMap((fileName) => [
      path.join(assetRoot, fileName),
      path.join(process.cwd(), "../../.cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets", fileName)
    ])
  ];
}

export async function GET() {
  const source = assetCandidates().find((candidate) => existsSync(candidate));
  if (source) {
    const body = readFileSync(source);
    return new Response(body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"
      }
    });
  }

  return new Response("Login space background not found", { status: 404 });
}
