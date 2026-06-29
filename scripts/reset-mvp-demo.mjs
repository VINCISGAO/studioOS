#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const seedPath = path.join(root, "seed", "mvp-store.json");
const dataDir = path.join(root, ".data");
const storePath = path.join(dataDir, "mvp-store.json");

const seed = JSON.parse(readFileSync(seedPath, "utf8"));
mkdirSync(dataDir, { recursive: true });
writeFileSync(storePath, `${JSON.stringify(seed, null, 2)}\n`, "utf8");

console.log("Demo review reset complete.");
console.log("  Project: proj_mvp_demo_01");
console.log("  Status:  in_review (V3 审片中)");
console.log("");
console.log("Restart dev server so memory cache clears:");
console.log("  npm run dev:fix");
console.log("");
console.log("Then open:");
console.log("  http://localhost:3000/workspace/projects/proj_mvp_demo_01/review?lang=zh");
