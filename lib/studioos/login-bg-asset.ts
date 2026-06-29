import { existsSync, readFileSync } from "fs";
import path from "path";

const ASSET_ROOT = ".cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets";

export const LOGIN_BG_FILES = {
  brand: "image-c1395470-3afd-4adc-a049-d1be5e20c8bd.png",
  creator: "image-95d1f4ff-868c-43e4-9af4-3d8942e03c7a.png"
} as const;

export type LoginBgKey = keyof typeof LOGIN_BG_FILES;

function assetCandidates(fileName: string, publicName: string) {
  const home = process.env.HOME ?? "";
  const cwd = process.cwd();
  return [
    path.join(cwd, "public/images/login", publicName),
    path.join(home, ASSET_ROOT, fileName),
    path.join(cwd, "../../", ASSET_ROOT, fileName),
    path.join(
      home,
      "Documents/Codex/2026-06-28/build-a-production-ready-mvp-web/.cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets",
      fileName
    )
  ];
}

export function readLoginBgAsset(key: LoginBgKey) {
  const fileName = LOGIN_BG_FILES[key];
  const publicName = key === "brand" ? "brand-bg.png" : "creator-bg.png";
  const source = assetCandidates(fileName, publicName).find((candidate) => existsSync(candidate));
  if (!source) {
    return null;
  }
  return readFileSync(source);
}

export function loginBgResponse(key: LoginBgKey) {
  const body = readLoginBgAsset(key);
  if (!body) {
    return new Response("Login background not found", { status: 404 });
  }
  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
