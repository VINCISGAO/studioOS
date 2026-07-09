#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const commit = "9bfaa56448ce678da5da9243ffbb6a0dd7f114f4";

const paths = [
  "components/marketing/home-hero-video.tsx",
  "components/marketing/landing/home-landing-page.tsx",
  "components/marketing/landing/landing-cost-comparison.tsx",
  "components/marketing/landing/landing-sections.tsx",
  "components/marketing/cinematic/cinematic-escrow.tsx",
  "lib/marketing/landing-copy.ts",
  "app/page.tsx",
  "app/globals.css",
  "components/language-switcher.tsx",
];

const report = [];
for (const rel of paths) {
  try {
    const content = execSync(`git show ${commit}:${rel}`, { cwd: root, encoding: "utf8" });
    const dest = path.join(root, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
    report.push(`restored: ${rel} (${content.length} bytes)`);
  } catch (e) {
    report.push(`FAILED: ${rel} — ${e.message}`);
  }
}

// Remove post-golden additions
const extra = ["components/marketing/video-player.tsx"];
for (const rel of extra) {
  const dest = path.join(root, rel);
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
    report.push(`removed: ${rel}`);
  }
}

fs.writeFileSync(path.join(root, ".restore-from-golden.log"), report.join("\n") + "\n");
console.log(report.join("\n"));
