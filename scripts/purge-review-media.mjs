#!/usr/bin/env node
/**
 * Remove ALL review video artifacts: upload files, demo clips, JSON deliverables,
 * and Prisma campaign versions / review data for demo accounts.
 *
 * Run: npm run purge:review-media
 * Then: npm run dev:clean
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, ".data");
const uploadRoot = path.join(dataDir, "uploads");

const DEMO_VIDEO_PATHS = [
  path.join(dataDir, "demo-review-cache.mp4"),
  path.join(root, "public", "demo", "review-sample.mp4"),
  path.join(root, "public", "uploads", "mvp")
];

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function removePath(target) {
  if (!existsSync(target)) return false;
  rmSync(target, { recursive: true, force: true });
  return true;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function clearJsonDeliverables() {
  const orderStorePath = path.join(dataDir, "order-store.json");
  if (!existsSync(orderStorePath)) return;
  const raw = readJson(orderStorePath);
  raw.orders = [];
  raw.deliverables = [];
  raw.quotes = raw.quotes ?? [];
  writeFileSync(orderStorePath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
}

function purgeUploads() {
  const removed = [];
  if (existsSync(uploadRoot)) {
    for (const file of walkFiles(uploadRoot)) {
      if (/\.(mp4|mov|webm|m4v)$/i.test(file)) {
        removed.push(file);
      }
    }
    rmSync(uploadRoot, { recursive: true, force: true });
  }
  mkdirSync(path.join(uploadRoot, "review"), { recursive: true });
  mkdirSync(path.join(uploadRoot, "campaigns"), { recursive: true });
  return removed;
}

function purgeDemoVideos() {
  const removed = [];
  for (const target of DEMO_VIDEO_PATHS) {
    if (removePath(target)) removed.push(target);
  }
  return removed;
}

function purgeReviewJson() {
  const targets = [
    "review-store.json",
    "deliverable-video-retention.json",
    "mvp-store.json"
  ];
  for (const fileName of targets) {
    const filePath = path.join(dataDir, fileName);
    if (!existsSync(filePath)) continue;
    const data = readJson(filePath);
    if (fileName === "review-store.json") {
      data.comments = [];
    } else if (fileName === "deliverable-video-retention.json") {
      data.records = [];
    } else if (fileName === "mvp-store.json") {
      data.projects = [];
      data.versions = [];
      data.comments = [];
    }
    writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}

const uploadRemoved = purgeUploads();
const demoRemoved = purgeDemoVideos();
clearJsonDeliverables();
purgeReviewJson();

console.log("Review media purge — local files");
console.log(`  upload videos removed: ${uploadRemoved.length}`);
for (const file of uploadRemoved) {
  console.log(`    - ${path.relative(root, file)}`);
}
console.log(`  demo artifacts removed: ${demoRemoved.length}`);
for (const file of demoRemoved) {
  console.log(`    - ${path.relative(root, file)}`);
}

try {
  execSync("npm run reset:demo-accounts", { cwd: root, stdio: "inherit" });
} catch {
  console.warn("reset:demo-accounts failed — local files were still purged.");
}

console.log("");
console.log("Restart dev server to clear in-memory JSON cache:");
console.log("  npm run dev:clean");
