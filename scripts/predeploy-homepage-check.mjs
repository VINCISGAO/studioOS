import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const heroDir = path.join(root, "public", "videos", "home", "hero");

const HERO_FILES = [
  ["en", "VINCIS Brand Film (EN).mp4"],
  ["zh-CN", "VINCIS Brand Film (ZH-CN).mp4"],
  ["zh-TW", "VINCIS Brand Film (ZH-TW).mp4"],
  ["ja", "VINCIS Brand Film (JA).mp4"],
  ["ko", "VINCIS Brand Film (KO).mp4"],
  ["ms", "VINCIS Brand Film (MS).mp4"],
  ["km", "VINCIS Brand Film (KM).mp4"],
  ["th", "VINCIS Brand Film (TH).mp4"],
  ["vi", "VINCIS Brand Film (VI).mp4"],
  ["fr", "VINCIS Brand Film (FR).mp4"],
  ["es", "VINCIS Brand Film (ES).mp4"]
];

let failures = 0;

function fail(message) {
  console.error(`[predeploy-check] FAIL ${message}`);
  failures += 1;
}

function pass(message) {
  console.log(`[predeploy-check] OK ${message}`);
}

async function main() {
  console.log("[predeploy-check] homepage + auth smoke checks");

  for (const [locale, fileName] of HERO_FILES) {
    const localPath = path.join(heroDir, fileName);
    try {
      const stat = await fs.stat(localPath);
      if (!stat.isFile() || stat.size <= 0) {
        fail(`${locale}: local file missing or empty (${fileName})`);
        continue;
      }
      if (stat.size > 100 * 1024 * 1024) {
        fail(`${locale}: file exceeds 100MB (${fileName}, ${stat.size} bytes)`);
        continue;
      }
      pass(`${locale}: local ${fileName} (${stat.size} bytes)`);
    } catch {
      fail(`${locale}: local file missing (${localPath})`);
    }

    const encoded = encodeURIComponent(fileName);
    const siteUrl = `https://vincis.app/videos/home/hero/${encoded}`;
    const r2Key = `videos/home/hero/${fileName}`;
    console.log(`[predeploy-check]     site ${siteUrl}`);
    console.log(`[predeploy-check]     r2   ${r2Key}`);
  }

  const requiredFiles = [
    "lib/marketing/home-hero-video-sources.ts",
    "lib/marketing/marketing-video-proxy.ts",
    "app/videos/[...path]/route.ts",
    "components/marketing/home-hero-video.tsx",
    "app/api/auth/continue/route.ts",
    "middleware.ts",
    "scripts/upload-home-hero-videos-r2.mjs",
    "scripts/verify-home-hero-r2.mjs"
  ];

  for (const relative of requiredFiles) {
    try {
      await fs.access(path.join(root, relative));
      pass(`file present: ${relative}`);
    } catch {
      fail(`file missing: ${relative}`);
    }
  }

  if (failures > 0) {
    console.error(`[predeploy-check] ${failures} issue(s) — fix before deploy`);
    process.exit(1);
  }

  console.log("[predeploy-check] all static checks passed");
  console.log("[predeploy-check] next: npm run marketing:deploy-hero-videos");
  console.log("[predeploy-check] then: npm run typecheck && npm run build && npm run production:verify");
  console.log(
    '[predeploy-check] curl: curl -sI -H "Range: bytes=0-1023" "https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(ZH-CN).mp4"'
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
