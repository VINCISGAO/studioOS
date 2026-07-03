import "server-only";

import { promises as fs } from "fs";
import path from "path";

const PUBLIC_DEMO_PATH = path.join(process.cwd(), "public", "demo", "review-sample.mp4");
const CACHE_PATH = path.join(process.cwd(), ".data", "demo-review-cache.mp4");
const PLACEHOLDER_MAX_BYTES = 2 * 1024 * 1024;

const LOCAL_SOURCES = [
  process.env.DEMO_REVIEW_VIDEO_SOURCE,
  path.join(process.cwd(), "assets", "demo", "review-sample.mp4")
].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

async function readIfLargeEnough(filePath: string, allowPlaceholder = false) {
  try {
    const data = await fs.readFile(filePath);
    if (data.length < 4096) {
      return null;
    }
    if (!allowPlaceholder && data.length <= PLACEHOLDER_MAX_BYTES) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

async function readLocalSourceBytes() {
  for (const sourcePath of LOCAL_SOURCES) {
    try {
      const data = await fs.readFile(sourcePath);
      if (data.length < 4096) continue;
      await fs.mkdir(path.dirname(PUBLIC_DEMO_PATH), { recursive: true });
      await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
      await fs.writeFile(PUBLIC_DEMO_PATH, data);
      await fs.writeFile(CACHE_PATH, data);
      return data;
    } catch {
      // try next source
    }
  }
  return null;
}

export async function readDemoReviewVideoBytes(): Promise<Buffer | null> {
  const localSource = await readLocalSourceBytes();
  if (localSource) {
    return localSource;
  }

  const publicFile = await readIfLargeEnough(PUBLIC_DEMO_PATH);
  if (publicFile) {
    return publicFile;
  }

  const cached = await readIfLargeEnough(CACHE_PATH);
  if (cached) {
    return cached;
  }

  return null;
}
