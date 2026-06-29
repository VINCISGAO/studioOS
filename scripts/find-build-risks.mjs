#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const patterns = [
  { re: /payment_status\s*===\s*["']paid["']/g, hint: "Use escrowed/released instead of paid" },
  { re: /searchParams\?\:\s*Promise/g, hint: "Layouts cannot declare searchParams" },
  { re: /new NextResponse\((?!new Uint8Array)(pdf|data|buffer)/gi, hint: "Wrap Buffer in Uint8Array" },
  { re: /\.map\(\(\[Icon,/g, hint: "Tuple Icon destructuring loses LucideIcon type" }
];

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const files = await walk(root);
let hits = 0;

for (const file of files) {
  const text = await readFile(file, "utf8");
  for (const { re, hint } of patterns) {
    re.lastIndex = 0;
    if (re.test(text)) {
      console.log(`${path.relative(root, file)} — ${hint}`);
      hits += 1;
    }
  }
}

if (!hits) console.log("No known risky patterns found.");
process.exit(hits ? 1 : 0);
