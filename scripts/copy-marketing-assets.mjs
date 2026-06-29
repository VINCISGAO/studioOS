import { copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const root = process.cwd();
const home = process.env.HOME ?? "";
const assetRoot = path.join(
  home,
  ".cursor/projects/Users-linkele-Documents-Codex-2026-06-28-build-a-production-ready-mvp-web/assets"
);

const HERO_CHAT_ASSETS = [
  "d2c4032c-36cb-4431-8587-17fc9309a920-8e852c55-f1ee-4346-a3fb-976c80e1536b.png",
  "image-69b788da-eb7b-4171-929e-71a681c747b5.png",
  "home-hero-bg.png"
];

const HERO_STUDIO_ASSETS = [
  "dba0e50a-14b8-4743-a9e5-eb24fd434ce2-ae1f6ab4-b47b-46c2-b30f-0804bf4b0277.png",
  "image-5de13bfe-b0d6-4f11-b324-365b7986eb78.png"
];

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

const heroSources = [
  path.join(root, "assets/marketing/home-hero-bg.png"),
  ...HERO_CHAT_ASSETS.map((fileName) => path.join(assetRoot, fileName)),
  path.join(root, "public/images/home-hero-bg.png")
];

const heroPublic = path.join(root, "public/images/home-hero-bg.png");
const heroBundled = path.join(root, "assets/marketing/home-hero-bg.png");

copyFirstAvailable({
  label: "home hero bg (public)",
  dest: heroPublic,
  sources: heroSources
});

copyFirstAvailable({
  label: "home hero bg (bundled)",
  dest: heroBundled,
  sources: [heroPublic, ...heroSources]
});

const studioPublic = path.join(root, "public/images/home-hero-studio.png");
const studioBundled = path.join(root, "assets/marketing/home-hero-studio.png");
const studioSources = [
  path.join(root, "assets/marketing/home-hero-studio.png"),
  ...HERO_STUDIO_ASSETS.map((fileName) => path.join(assetRoot, fileName)),
  path.join(root, "public/images/home-hero-studio.png")
];

copyFirstAvailable({
  label: "home hero studio (public)",
  dest: studioPublic,
  sources: studioSources
});

copyFirstAvailable({
  label: "home hero studio (bundled)",
  dest: studioBundled,
  sources: [studioPublic, ...studioSources]
});

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
