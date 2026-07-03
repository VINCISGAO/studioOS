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
console.log("  Legacy MVP project id: proj_mvp_demo_01");
console.log("  Unified campaign:      proj_demo_arc_nova / ord_demo_arc_nova");
console.log("");
console.log("Restart dev server so memory cache clears:");
console.log("  npm run dev:clean");
console.log("");
console.log("Open the new reviewer (not /workspace/...):");
console.log("  Brand:   http://localhost:3000/brand/projects/proj_demo_arc_nova/review?lang=zh");
console.log("  Creator: http://localhost:3000/studio/review/ord_demo_arc_nova?lang=zh");
