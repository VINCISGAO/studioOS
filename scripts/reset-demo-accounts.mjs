#!/usr/bin/env node
/**
 * Reset all demo / test account runtime stores to bundled seed baseline.
 *
 * Clears campaigns, orders, invitations, messages, certification, earnings, and
 * review data for:
 * - client.arc@studioos.test, client.bright@studioos.test, client.north@studioos.test
 * - creator.nova@studioos.test, creator.signal@studioos.test, creator.atlas@studioos.test
 *
 * Demo auto-seed rows are suppressed via dismissed_demo_ids in seed JSON.
 *
 * Restart dev server after running so in-memory store cache clears.
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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

const FRESH_ACCOUNT_STORES = {
  "creator-invitation-store.json": { invitations: [] },
  "brand-notification-store.json": { notifications: [] },
  "notification-store.json": {
    notifications: [],
    dismissed_demo_ids: [
      "ntf_demo_arc_selected",
      "ntf_demo_arc_funded",
      "ntf_demo_nike_work_selected",
      "ntf_demo_samsung_feedback",
      "ntf_demo_apple_revision",
      "ntf_demo_payment_received",
      "ntf_demo_project_completed",
      "ntf_demo_system_cert"
    ]
  },
  "certification-form-store.json": { forms: [] },
  "withdrawal-store.json": { payout_methods: [], withdrawals: [] },
  "deposit-store.json": {
    creator_overlays: {
      creator_01: { deposit_status: "unpaid", deposit_amount: 99, paid_at: null },
      creator_02: { deposit_status: "unpaid", deposit_amount: 99, paid_at: null },
      creator_03: { deposit_status: "unpaid", deposit_amount: 99, paid_at: null }
    },
    payments: []
  },
  "creative-performance-store.json": { records: [], insights: [], dna_profiles: [] },
  "chat-store.json": { inquiries: [], messages: [] },
  "review-store.json": { comments: [] },
  "order-ratings-store.json": { reviews: [] },
  "order-store.json": {
    quotes: [],
    orders: [],
    deliverables: [],
    dismissed_demo_ids: [
      "ord_demo_arc_nova",
      "ord_demo_nova_completed",
      "ord_demo_nova_active",
      "ord_demo_nova_first"
    ]
  },
  "project-store.json": {
    projects: [],
    applications: [],
    dismissed_demo_ids: ["proj_demo_arc_nova"],
    deleted_project_ids: []
  },
  "project-events-store.json": { events: [] },
  "creator-settings-store.json": { settings: {}, email_aliases: {} },
  "creator-profile-store.json": { profiles: {} },
  "brand-profile-store.json": { profiles: {} },
  "works-store.json": { works: [], deletedIds: [] },
  "mvp-store.json": {
    profiles: [
      {
        id: "prof_demo_brand_arc",
        email: "client.arc@studioos.test",
        role: "brand",
        name: "Arc & Alloy",
        company_name: "Arc & Alloy",
        created_at: "2026-06-28T10:00:00.000Z"
      },
      {
        id: "prof_demo_studio_nova",
        email: "creator.nova@studioos.test",
        role: "studio",
        name: "Nova Motion Studio",
        company_name: "Nova Motion Studio",
        created_at: "2026-06-28T10:00:00.000Z"
      },
      {
        id: "prof_demo_admin",
        email: "admin@studioos.test",
        role: "admin",
        name: "Platform Admin",
        company_name: "VINCIS",
        created_at: "2026-06-28T10:00:00.000Z"
      },
      {
        id: "prof_demo_brand_bright",
        email: "client.bright@studioos.test",
        role: "brand",
        name: "BrightSip",
        company_name: "BrightSip",
        created_at: "2026-06-28T10:00:00.000Z"
      }
    ],
    projects: [],
    versions: [],
    comments: []
  },
  "deliverable-video-retention.json": { records: [] }
};

const UPLOAD_ROOT = path.join(root, ".data", "uploads");
const UPLOAD_SUBDIRS = ["review", "campaigns", "projects", "creators", "brands", "payout-qr", "chunks"];
const DEMO_VIDEO_PATHS = [
  path.join(root, ".data", "demo-review-cache.mp4"),
  path.join(root, "public", "demo", "review-sample.mp4"),
  path.join(root, "public", "uploads", "mvp")
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

function applyFreshAccountStores() {
  for (const [fileName, data] of Object.entries(FRESH_ACCOUNT_STORES)) {
    writeJson(fileName, data);
  }
}

function clearUploadArtifacts() {
  mkdirSync(UPLOAD_ROOT, { recursive: true });

  for (const subdir of UPLOAD_SUBDIRS) {
    const target = path.join(UPLOAD_ROOT, subdir);
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
    }
    mkdirSync(target, { recursive: true });
  }

  let removedVideos = 0;
  for (const target of DEMO_VIDEO_PATHS) {
    if (!existsSync(target)) continue;
    rmSync(target, { recursive: true, force: true });
    removedVideos += 1;
  }

  return removedVideos;
}

function runPrismaReset() {
  try {
    execSync("npm run reset:demo-prisma", { cwd: root, stdio: "inherit" });
  } catch {
    console.warn("Prisma demo reset skipped or failed — JSON stores were still reset.");
  }
}

const copied = copySeedStores();
applyFreshAccountStores();
const removedVideoArtifacts = clearUploadArtifacts();
runPrismaReset();

console.log("Demo account reset complete.");
console.log("");
console.log("Creators (password: TempVINCIS2026!):");
for (const creator of DEMO_CREATORS) {
  console.log(`  ${creator.email} → ${creator.label}`);
  console.log(`    certification · projects · invitations · messages · earnings: cleared`);
}
console.log("");
console.log("Brands:");
for (const brand of DEMO_BRANDS) {
  console.log(`  ${brand.email} → ${brand.label}`);
  console.log(`    campaigns · orders · messages: cleared`);
}
console.log("");
console.log(`Copied ${copied.length} seed store(s) to .data/`);
console.log(`Applied fresh-account overrides for ${Object.keys(FRESH_ACCOUNT_STORES).length} runtime store(s)`);
console.log(`Cleared upload dirs under .data/uploads/ and ${removedVideoArtifacts} demo video artifact(s)`);
console.log("");
console.log("Restart dev server so memory cache clears:");
console.log("  npm run dev:clean");
console.log("");
console.log("Optional — restore MVP review demo:");
console.log("  npm run reset:demo-review");
