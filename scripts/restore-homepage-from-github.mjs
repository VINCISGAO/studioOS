#!/usr/bin/env node
/**
 * Restore homepage stack from GitHub ref (default: main) without git checkout.
 * Only writes homepage-stack paths; leaves all other local changes untouched.
 *
 * Usage: node scripts/restore-homepage-from-github.mjs [ref]
 * Example: node scripts/restore-homepage-from-github.mjs main
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ref = process.argv[2] ?? "main";
const owner = "VINCISGAO";
const repo = "studioOS";

const stackPaths = new Set([
  "app/page.tsx",
  "app/globals.css",
  "app/layout.tsx",
  "components/language-switcher.tsx",
  "lib/studioos/home-hero-space-asset.ts",
  "lib/studioos/marketing-headline-font.ts",
]);

const stackPrefixes = ["components/marketing/", "lib/marketing/"];

function inStack(filePath) {
  if (stackPaths.has(filePath)) return true;
  return stackPrefixes.some((prefix) => filePath.startsWith(prefix));
}

async function gh(pathname) {
  const res = await fetch(`https://api.github.com${pathname}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "vincis-homepage-restore" },
  });
  if (!res.ok) {
    throw new Error(`GitHub ${pathname} → ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function resolveCommit(targetRef) {
  try {
    const data = await gh(`/repos/${owner}/${repo}/git/ref/heads/${targetRef}`);
    return data.object.sha;
  } catch {
    const data = await gh(`/repos/${owner}/${repo}/git/ref/tags/${targetRef}`);
    if (data.object.type === "tag") {
      const tag = await gh(`/repos/${owner}/${repo}/git/tags/${data.object.sha}`);
      return tag.object.sha;
    }
    return data.object.sha;
  }
}

async function downloadBlob(sha) {
  const data = await gh(`/repos/${owner}/${repo}/git/blobs/${sha}`);
  if (data.encoding !== "base64") {
    throw new Error(`Unexpected blob encoding: ${data.encoding}`);
  }
  return Buffer.from(data.content.replace(/\n/g, ""), "base64");
}

async function main() {
  const commit = await resolveCommit(ref);
  console.log(`Fetching tree for ${ref} (${commit.slice(0, 7)})…`);
  const tree = await gh(`/repos/${owner}/${repo}/git/trees/${commit}?recursive=1`);
  const files = tree.tree.filter((entry) => entry.type === "blob" && inStack(entry.path));

  console.log(`Restoring ${files.length} homepage files…`);
  const restored = [];
  for (const entry of files) {
    const dest = path.join(root, entry.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const content = await downloadBlob(entry.sha);
    fs.writeFileSync(dest, content);
    restored.push(entry.path);
    console.log(`  ✓ ${entry.path}`);
  }

  const log = [
    `RESTORED_FROM=${ref}`,
    `COMMIT=${commit}`,
    `FILE_COUNT=${restored.length}`,
    "",
    ...restored,
    "",
    "DONE",
  ].join("\n");
  fs.writeFileSync(path.join(root, "scripts/.homepage-restore.log"), `${log}\n`);
  console.log(`\nDone. Log: scripts/.homepage-restore.log`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
