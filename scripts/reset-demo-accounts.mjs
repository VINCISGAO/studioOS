#!/usr/bin/env node
/**
 * Reset all demo / test account runtime stores to bundled seed baseline.
 *
 * Initial creator state after reset:
 * - completedOrders === 0 (no completed demo orders)
 * - isVerified === false (all deposits unpaid)
 * - empty profile overlays (creator-profile-store)
 *
 * Restart dev server after running so in-memory store cache clears.
 */
import { cpSync, mkdirSync, readdirSync, unlinkSync } from "fs";
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

/** Invitation store is code-seeded (dynamic dates); drop stale runtime copy. */
function resetRuntimeOnlyStores() {
  for (const fileName of ["creator-invitation-store.json", "brand-notification-store.json"]) {
    const runtimePath = path.join(dataDir, fileName);
    try {
      unlinkSync(runtimePath);
    } catch {
      // missing is fine
    }
  }
}

const copied = copySeedStores();
resetRuntimeOnlyStores();

console.log("Demo account reset complete.");
console.log("");
console.log("Creators (password: TempStudioOS2026!):");
for (const creator of DEMO_CREATORS) {
  console.log(`  ${creator.email} → ${creator.label}`);
  console.log(`    completedOrders: 0 · deposit: unpaid · sidebar: all open`);
}
console.log("");
console.log("Brands:");
for (const brand of DEMO_BRANDS) {
  console.log(`  ${brand.email} → ${brand.label}`);
}
console.log("");
console.log(`Copied ${copied.length} seed store(s) to .data/`);
console.log("  invitations + brand notifications: cleared (re-seeded on next request)");
console.log("");
console.log("Restart dev server so memory cache clears:");
console.log("  npm run dev:clean");
console.log("");
console.log("Optional — reset MVP review demo separately:");
console.log("  npm run reset:demo-review");
