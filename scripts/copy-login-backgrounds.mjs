import { copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const root = process.cwd();
const home = process.env.HOME ?? "";
const assetRoot = path.join(
  home,
  ".cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets"
);
const destDir = path.join(root, "public/images/login");

const files = {
  "brand-bg.png": "image-c1395470-3afd-4adc-a049-d1be5e20c8bd.png",
  "creator-bg.png": "image-95d1f4ff-868c-43e4-9af4-3d8942e03c7a.png"
};

mkdirSync(destDir, { recursive: true });

for (const [destName, sourceName] of Object.entries(files)) {
  const dest = path.join(destDir, destName);
  const candidates = [
    path.join(assetRoot, sourceName),
    path.join(root, "public/images/login", destName)
  ];
  const source = candidates.find((candidate) => existsSync(candidate));
  if (source && source !== dest) {
    copyFileSync(source, dest);
    console.log(`Copied login bg -> ${dest}`);
  } else if (existsSync(dest)) {
    console.log(`Login bg already present -> ${dest}`);
  } else {
    console.warn(`Missing login bg asset: ${sourceName}`);
  }
}
