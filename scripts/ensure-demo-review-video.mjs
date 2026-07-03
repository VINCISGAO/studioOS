import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "fs";
import path from "path";

const root = process.cwd();
const dest = path.join(root, "public/demo/review-sample.mp4");
const cacheDest = path.join(root, ".data/demo-review-cache.mp4");
const minSize = 4096;
/** Bundled placeholder clips are ~770KB; real review samples are usually much larger. */
const PLACEHOLDER_MAX_BYTES = 2 * 1024 * 1024;

const localSources = [
  process.env.DEMO_REVIEW_VIDEO_SOURCE,
  path.join(root, "assets/demo/review-sample.mp4")
].filter((value) => typeof value === "string" && value.trim().length > 0);

function isLikelyPlaceholder(filePath) {
  try {
    return statSync(filePath).size <= PLACEHOLDER_MAX_BYTES;
  } catch {
    return true;
  }
}

function shouldReplaceDest(sourceStat) {
  if (!existsSync(dest)) return true;
  const destStat = statSync(dest);
  if (destStat.size !== sourceStat.size) return true;
  if (destStat.mtimeMs < sourceStat.mtimeMs) return true;
  return isLikelyPlaceholder(dest);
}

function copyLocalSource(sourcePath) {
  const sourceStat = statSync(sourcePath);
  if (sourceStat.size < minSize) return false;

  mkdirSync(path.dirname(dest), { recursive: true });
  mkdirSync(path.dirname(cacheDest), { recursive: true });

  if (!shouldReplaceDest(sourceStat)) {
    if (!existsSync(cacheDest) || statSync(cacheDest).size !== sourceStat.size) {
      copyFileSync(sourcePath, cacheDest);
    }
    console.log("[ensure-demo-review-video] ok", dest, `(${statSync(dest).size} bytes)`);
    return true;
  }

  copyFileSync(sourcePath, dest);
  copyFileSync(sourcePath, cacheDest);
  console.log(
    "[ensure-demo-review-video] copied",
    sourcePath,
    "->",
    dest,
    `(${sourceStat.size} bytes)`
  );
  return true;
}

function tryCopyLocalSources() {
  for (const sourcePath of localSources) {
    if (!existsSync(sourcePath)) continue;
    if (copyLocalSource(sourcePath)) {
      return true;
    }
  }
  return false;
}

async function downloadFallback() {
  const sources = [
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) continue;
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length < minSize) continue;
      mkdirSync(path.dirname(dest), { recursive: true });
      mkdirSync(path.dirname(cacheDest), { recursive: true });
      writeFileSync(dest, data);
      writeFileSync(cacheDest, data);
      console.log("[ensure-demo-review-video] downloaded", dest, `(${data.length} bytes)`);
      return true;
    } catch {
      // try next source
    }
  }

  return false;
}

async function ensureDemoReviewVideo() {
  if (tryCopyLocalSources()) {
    return;
  }

  if (existsSync(dest) && statSync(dest).size >= minSize && !isLikelyPlaceholder(dest)) {
    console.log("[ensure-demo-review-video] ok", dest, `(${statSync(dest).size} bytes)`);
    if (!existsSync(cacheDest) || statSync(cacheDest).size !== statSync(dest).size) {
      mkdirSync(path.dirname(cacheDest), { recursive: true });
      copyFileSync(dest, cacheDest);
    }
    return;
  }

  const downloaded = await downloadFallback();
  if (!downloaded) {
    console.warn(
      "[ensure-demo-review-video] missing demo clip — place MP4 at public/demo/review-sample.mp4 or set DEMO_REVIEW_VIDEO_SOURCE"
    );
  }
}

await ensureDemoReviewVideo();
