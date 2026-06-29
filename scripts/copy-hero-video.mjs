import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2] ?? "/Users/linkele/Desktop/视频背景.mp4";
const dest = path.join(root, "public/videos/home-hero.mp4");
const poster = path.join(root, "public/videos/home-hero-poster.jpg");

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(source, dest);
console.log(`Copied ${source} -> ${dest} (${fs.statSync(dest).size} bytes)`);

const ffmpeg = spawnSync(
  "ffmpeg",
  ["-y", "-i", dest, "-vf", "scale=1920:-2", "-frames:v", "1", "-q:v", "4", poster],
  { stdio: "inherit" }
);

if (ffmpeg.status === 0) {
  console.log(`Poster ${poster} (${fs.statSync(poster).size} bytes)`);
} else {
  console.warn("ffmpeg unavailable — skip poster (hero still uses dark fallback bg)");
}
