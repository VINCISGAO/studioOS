#!/usr/bin/env node
import { readdir, stat, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const V = "/Users/linkele/Projects/VINCIS";
const S = "/Users/linkele/Projects/studioOS";
const EXCLUDE = new Set(["node_modules", ".next", ".git", "work", ".npm-cache", ".DS_Store"]);

async function walk(root) {
  const files = new Map();
  async function go(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (EXCLUDE.has(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) await go(p);
      else if (e.isFile()) {
        const rel = relative(root, p);
        const st = await stat(p);
        const buf = await readFile(p);
        files.set(rel, { mtime: st.mtimeMs, hash: createHash("sha256").update(buf).digest("hex").slice(0, 16), size: st.size });
      }
    }
  }
  await go(root);
  return files;
}

const [vFiles, sFiles] = await Promise.all([walk(V), walk(S)]);
const onlyV = [];
const onlyS = [];
const differ = [];
const same = [];

for (const rel of [...new Set([...vFiles.keys(), ...sFiles.keys()])].sort()) {
  const v = vFiles.get(rel);
  const s = sFiles.get(rel);
  if (v && !s) onlyV.push(rel);
  else if (s && !v) onlyS.push(rel);
  else if (v.hash !== s.hash) {
    differ.push({ rel, newer: v.mtime > s.mtime ? "VINCIS" : s.mtime > v.mtime ? "studioOS" : "tie" });
  } else same.push(rel);
}

console.log("=== KEY PATHS ===");
for (const [d, label] of [[V, "VINCIS"], [S, "studioOS"]]) {
  for (const x of [".git", "package.json", ".env.local", "node_modules"]) {
    try {
      await stat(join(d, x));
      console.log(`${label}: ${x} YES`);
    } catch {
      console.log(`${label}: ${x} NO`);
    }
  }
}

console.log("\n=== COUNTS ===");
console.log(`only VINCIS: ${onlyV.length}`);
console.log(`only studioOS: ${onlyS.length}`);
console.log(`differ: ${differ.length}`);
console.log(`same: ${same.length}`);

console.log("\n=== ONLY IN studioOS (first 40) ===");
onlyS.slice(0, 40).forEach((f) => console.log(f));
if (onlyS.length > 40) console.log(`... +${onlyS.length - 40} more`);

console.log("\n=== ONLY IN VINCIS (first 40) ===");
onlyV.slice(0, 40).forEach((f) => console.log(f));
if (onlyV.length > 40) console.log(`... +${onlyV.length - 40} more`);

console.log("\n=== DIFFER (all) ===");
for (const d of differ) console.log(`${d.newer.padEnd(8)} | ${d.rel}`);
