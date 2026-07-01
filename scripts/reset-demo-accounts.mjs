#!/usr/bin/env node
/**
 * Reset all demo / test account runtime stores to bundled seed baseline.
 *
 * Clears campaigns, orders, invitations, messages, and review data for:
 * - client.arc@studioos.test, client.bright@studioos.test, client.north@studioos.test
 * - creator.nova@studioos.test, creator.signal@studioos.test, creator.atlas@studioos.test
 *
 * Demo auto-seed rows are suppressed via dismissed_demo_ids in seed JSON.
 *
 * Restart dev server after running so in-memory store cache clears.
 */
import { cpSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const seedDir = path.join(root, "seed");
const dataDir = path.join(root, ".data");

const DEMO_CREATORS = [
  { id: "creator_01", email: "creator.nova@studioos.test", label: "Nova Motion Studio" },
  { id: "creator_02", email: "creator.signal@studioos.test", label: "Signal Frame Lab" },
  { id: "creator_03", email: "creator.atlas@studioos.test", label: "Atlas UGC Systems" }
];

const DEMO_BRANDS = [
  { email: "client.arc@studioos.test", label: "Arc & Alloy (brand)" },
  { email: "client.bright@studioos.test", label: "BrightSip (brand)" },
  { email: "client.north@studioos.test", label: "Northline Skincare (brand)" }
];

function copySeedStores() {
  mkdirSync(dataDir, { recursive: true });
  const seedFiles = readdirSync(seedDir).filter((name) => name.endsWith(".json"));

  for (const fileName of seedFiles) {
    const from = path.join(seedDir, fileName);
    const to = path.join(dataDir, fileName);
    cpSync(from, to);
  }

  return seedFiles;
}

function writeJson(fileName, data) {
  const target = path.join(dataDir, fileName);
  writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const copied = copySeedStores();

writeJson("creator-invitation-store.json", { invitations: [] });
writeJson("brand-notification-store.json", { notifications: [] });

console.log("Demo account reset complete.");
console.log("");
console.log("Creators (password: TempStudioOS2026!):");
for (const creator of DEMO_CREATORS) {
  console.log(`  ${creator.email} → ${creator.label}`);
  console.log(`    projects · invitations · messages: cleared`);
}
console.log("");
console.log("Brands:");
for (const brand of DEMO_BRANDS) {
  console.log(`  ${brand.email} → ${brand.label}`);
  console.log(`    campaigns · orders · messages: cleared`);
}
console.log("");
console.log(`Copied ${copied.length} seed store(s) to .data/`);
console.log("  invitations + brand notifications: cleared");
console.log("");
console.log("Restart dev server so memory cache clears:");
console.log("  npm run dev:clean");
console.log("");
console.log("Optional — restore MVP review demo:");
console.log("  npm run reset:demo-review");
