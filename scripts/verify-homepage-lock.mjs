#!/usr/bin/env node
/**
 * Verify owner-locked homepage baseline (2026-07-15) is intact.
 * Exit 0 = lock markers present; exit 1 = drift detected.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const checks = [
  {
    file: "docs/HOMEPAGE_GOLDEN.md",
    includes: ["owner-locked 2026-07-15", "auto 109.5%", "18.2px"]
  },
  {
    file: "app/globals.css",
    includes: ["auto 109.5%", "marketing-hero-brands-mobile", "home-hero-video-section"]
  },
  {
    file: "components/marketing/cinematic/cinematic-hero.tsx",
    includes: ["text-[2.65rem]", "text-[18.2px]", "LATIN_HERO_LOCALES", "REDUCED_HERO_TITLE_LOCALES", "text-[2.385rem]"]
  },
  {
    file: "components/marketing/home-hero-video.tsx",
    includes: ["home-hero-video-section", "bg-zinc-950"]
  },
  {
    file: ".cursor/rules/homepage-absolute-lock.mdc",
    includes: ["owner-locked 2026-07-15", "MUST NOT"]
  }
];

let failed = 0;

for (const { file, includes } of checks) {
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) {
    console.error(`✗ missing ${file}`);
    failed++;
    continue;
  }
  const text = fs.readFileSync(abs, "utf8");
  for (const needle of includes) {
    if (!text.includes(needle)) {
      console.error(`✗ ${file}: expected "${needle}"`);
      failed++;
    }
  }
}

if (failed) {
  console.error(`\nHomepage lock verification FAILED (${failed} issue(s)).`);
  console.error("Restore: npm run homepage:restore:golden");
  process.exit(1);
}

console.log("Homepage lock verification passed (2026-07-15 baseline markers).");
