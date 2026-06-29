import { copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const root = process.cwd();
const home = process.env.HOME ?? "";
const assetRoot = path.join(
  home,
  ".cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets"
);

function copyFirstAvailable({ dest, sources, label }) {
  mkdirSync(path.dirname(dest), { recursive: true });
  const source = sources.find((candidate) => existsSync(candidate));
  if (!source) {
    if (existsSync(dest)) {
      console.log(`[copy-marketing-assets] keep existing ${label} -> ${dest}`);
      return;
    }
    console.warn(`[copy-marketing-assets] missing ${label}`);
    return;
  }
  copyFileSync(source, dest);
  console.log(`[copy-marketing-assets] ${label} -> ${dest}`);
}

copyFirstAvailable({
  label: "login space bg",
  dest: path.join(root, "public/images/login-space-bg.png"),
  sources: [
    path.join(assetRoot, "2026_6_29__02_06_45-61ae13a4-0fa5-47a1-902c-92fa594e614f.png"),
    path.join(root, "public/images/login-space-bg.png")
  ]
});

const loginDir = path.join(root, "public/images/login");
mkdirSync(loginDir, { recursive: true });

for (const [destName, sourceName] of Object.entries({
  "brand-bg.png": "image-c1395470-3afd-4adc-a049-d1be5e20c8bd.png",
  "creator-bg.png": "image-95d1f4ff-868c-43e4-9af4-3d8942e03c7a.png"
})) {
  copyFirstAvailable({
    label: destName,
    dest: path.join(loginDir, destName),
    sources: [path.join(assetRoot, sourceName), path.join(loginDir, destName)]
  });
}
