import { readHomeHeroBgAsset } from "@/lib/studioos/home-hero-bg-asset";
import { existsSync, readFileSync } from "fs";
import path from "path";

const FILE_NAME = "2026_6_29__02_06_45-61ae13a4-0fa5-47a1-902c-92fa594e614f.png";

function assetCandidates() {
  const home = process.env.HOME ?? "";
  return [
    path.join(process.cwd(), "public/images/login-space-bg.png"),
    path.join(process.cwd(), "public/images/home-hero-bg.png"),
    path.join(
      home,
      ".cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets",
      FILE_NAME
    ),
    path.join(process.cwd(), "../../.cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets", FILE_NAME)
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

  const fallback = readHomeHeroBgAsset();
  if (fallback) {
    return new Response(new Uint8Array(fallback), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"
      }
    });
  }

  return new Response("Login background not found", { status: 404 });
}
