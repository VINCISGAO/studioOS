import { copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { spawnSync } from "node:child_process";

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

const HERO_SPACE_ASSETS = [
  "image-95d81c65-9e03-4130-9eb5-a5eb0a1d0ba1.png",
  "f0820f8a-e12b-4141-929a-d24cf32004c5-22c92bbe-cbe7-4d8f-a163-a0e1c155f0be.png",
  "d2c4032c-36cb-4431-8587-17fc9309a920-8e852c55-f1ee-4346-a3fb-976c80e1536b.png",
  "image-69b788da-eb7b-4171-929e-71a681c747b5.png"
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

const spacePublic = path.join(root, "public/images/home-hero-space.png");
const spaceBundled = path.join(root, "assets/marketing/home-hero-space.png");
const spacePublic2x = path.join(root, "public/images/home-hero-space@2x.png");
const spaceBundled2x = path.join(root, "assets/marketing/home-hero-space@2x.png");

function probeImageWidth(filePath) {
  const widthProbe = spawnSync("sips", ["-g", "pixelWidth", filePath], { encoding: "utf8" });
  const widthMatch = widthProbe.stdout?.match(/pixelWidth:\s*(\d+)/);
  return widthMatch ? Number(widthMatch[1]) : 0;
}

function syncHeroSpaceFrom2x() {
  copyFileSync(spacePublic2x, spaceBundled2x);
  const nativeWidth = probeImageWidth(spacePublic2x);
  const target1xWidth = nativeWidth > 0 ? Math.max(1600, Math.round(nativeWidth / 2)) : 0;

  if (target1xWidth > 0 && nativeWidth > target1xWidth) {
    const downscale = spawnSync(
      "sips",
      ["--resampleWidth", String(target1xWidth), spacePublic2x, "--out", spacePublic],
      { encoding: "utf8" }
    );
    if (downscale.status !== 0) {
      console.warn("[copy-marketing-assets] failed to derive 1x from @2x — using @2x for both");
      copyFileSync(spacePublic2x, spacePublic);
    }
  } else {
    copyFileSync(spacePublic2x, spacePublic);
  }

  copyFileSync(spacePublic, spaceBundled);
  console.log(
    `[copy-marketing-assets] home hero space from @2x (${nativeWidth}px) -> 1x + bundled copies`
  );
}

if (existsSync(spacePublic2x)) {
  syncHeroSpaceFrom2x();
} else {
  const spaceSources = [
    path.join(root, "assets/marketing/home-hero-space.png"),
    ...HERO_SPACE_ASSETS.flatMap((fileName) => [
      path.join(assetRoot, fileName),
      path.join(home, ".cursor/projects/Users-linkele-Projects-studioOS/assets", fileName)
    ]),
    path.join(root, "public/images/home-hero-space.png")
  ];

  copyFirstAvailable({
    label: "home hero space (public)",
    dest: spacePublic,
    sources: spaceSources
  });

  copyFirstAvailable({
    label: "home hero space (bundled)",
    dest: spaceBundled,
    sources: [spacePublic, ...spaceSources]
  });

  if (existsSync(spacePublic) && !existsSync(spacePublic2x)) {
    copyFileSync(spacePublic, spacePublic2x);
    copyFileSync(spacePublic, spaceBundled2x);
    console.log(`[copy-marketing-assets] home hero space @2x mirror from 1x -> ${spacePublic2x}`);
  }
}

const LOGIN_SPACE_ASSETS = [
  "2026_6_29__02_06_45-61ae13a4-0fa5-47a1-902c-92fa594e614f.png",
  "image-469c9ec8-95b8-4a05-bb65-175e39b28542.png"
];

copyFirstAvailable({
  label: "login space bg",
  dest: path.join(root, "public/images/login-space-bg.png"),
  sources: [
    path.join(root, "assets/marketing/login-space-bg.png"),
    ...LOGIN_SPACE_ASSETS.map((fileName) => path.join(assetRoot, fileName)),
    path.join(root, "public/images/login-space-bg.png")
  ]
});

copyFirstAvailable({
  label: "login space bg (bundled)",
  dest: path.join(root, "assets/marketing/login-space-bg.png"),
  sources: [
    path.join(root, "public/images/login-space-bg.png"),
    ...LOGIN_SPACE_ASSETS.map((fileName) => path.join(assetRoot, fileName))
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

spawnSync(process.execPath, [path.join(root, "scripts/ensure-demo-review-video.mjs")], {
  stdio: "inherit",
  cwd: root
});
