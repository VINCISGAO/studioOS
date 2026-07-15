#!/usr/bin/env node
/**
 * Restore homepage stack from git ref (default homepage-v1) without touching other files.
 * Usage: node scripts/restore-homepage-from-git.mjs [ref]
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ref = process.argv[2] ?? "homepage-v1";

const paths = [
  "app/page.tsx",
  "app/globals.css",
  "app/layout.tsx",
  "components/marketing",
  "components/language-switcher.tsx",
  "lib/marketing",
  "lib/studioos/home-hero-space-asset.ts",
  "lib/studioos/marketing-headline-font.ts",
];

function run(cmd) {
  return execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}

function resolveRef(target) {
  try {
    return run(`git rev-parse --verify ${target}`).trim();
  } catch {
    if (target !== "origin/main") {
      console.warn(`Ref ${target} not found, falling back to origin/main`);
      run("git fetch origin main 2>&1 || true");
      return run("git rev-parse --verify origin/main").trim();
    }
    throw new Error(`Cannot resolve git ref: ${target}`);
  }
}

function main() {
  run("git fetch origin main homepage-v1 homepage-golden 2>&1 || true");
  const resolved = resolveRef(ref);
  console.log(`Restoring homepage stack from ${ref} (${resolved.slice(0, 7)})…`);

  for (const p of paths) {
    run(`git checkout ${ref} -- ${p}`);
    console.log(`  ✓ ${p}`);
  }

  const stat = run(`git diff --stat HEAD -- ${paths.join(" ")}`);
  fs.writeFileSync(
    path.join(root, "scripts/.homepage-restore.log"),
    `RESTORED_FROM=${ref}\nRESOLVED=${resolved}\n\n${stat}\n`
  );

  console.log("\nDone. Only homepage stack restored; other changes untouched.");
  if (stat.trim()) {
    console.log("\nDiff vs HEAD:\n" + stat);
  } else {
    console.log("\nHomepage stack already matched ref (no diff vs HEAD).");
  }
}

main();
