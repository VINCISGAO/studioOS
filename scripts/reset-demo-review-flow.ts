/**
 * Reset Arc & Alloy review demo to a clean v1 / brand-review baseline.
 *
 * Run: npm run reset:demo-review-flow
 * Then restart dev: npm run dev:clean
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { hasDatabaseUrl } from "../lib/core/database/prisma";
import { DEMO_REVIEW_VIDEO_URL } from "../lib/studioos/review-video-url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, ".data");

const DEMO_PROJECT_ID = "proj_demo_arc_nova";
const DEMO_ORDER_ID = "ord_demo_arc_nova";

function writeJson(fileName: string, data: unknown) {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(path.join(dataDir, fileName), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function resetJsonStores() {
  const orderStorePath = path.join(dataDir, "order-store.json");
  const orderStore = JSON.parse(readFileSync(orderStorePath, "utf8")) as {
    quotes: unknown[];
    orders: Array<Record<string, unknown>>;
    deliverables: Array<Record<string, unknown>>;
    dismissed_demo_ids?: string[];
  };

  const arcOrder = orderStore.orders.find((item) => item.id === DEMO_ORDER_ID);
  if (arcOrder) {
    arcOrder.status = "review";
    arcOrder.project_id = DEMO_PROJECT_ID;
    arcOrder.completed_at = null;
  }

  orderStore.deliverables = orderStore.deliverables.filter(
    (item) =>
      item.order_id !== DEMO_ORDER_ID || Number(item.version) === 1
  );

  const v1 = orderStore.deliverables.find(
    (item) => item.order_id === DEMO_ORDER_ID && Number(item.version) === 1
  );
  if (v1) {
    v1.file_url = DEMO_REVIEW_VIDEO_URL;
    v1.thumbnail_url = "";
  } else {
    orderStore.deliverables.push({
      id: "del_demo_arc_v1",
      order_id: DEMO_ORDER_ID,
      file_url: DEMO_REVIEW_VIDEO_URL,
      thumbnail_url: "",
      notes: "Version 1 — summer launch hero cut for brand review.",
      notes_for_client: "Version 1 — summer launch hero cut for brand review.",
      notes_client_locale: "en",
      version: 1,
      created_at: "2026-06-28T12:00:00.000Z"
    });
  }

  orderStore.dismissed_demo_ids = (orderStore.dismissed_demo_ids ?? []).filter(
    (id) => id !== DEMO_ORDER_ID
  );
  writeJson("order-store.json", orderStore);

  const projectStorePath = path.join(dataDir, "project-store.json");
  const projectStore = JSON.parse(readFileSync(projectStorePath, "utf8")) as {
    projects: Array<Record<string, unknown>>;
    applications: unknown[];
    dismissed_demo_ids?: string[];
    deleted_project_ids?: string[];
  };

  const arcProject = projectStore.projects.find((item) => item.id === DEMO_PROJECT_ID);
  if (arcProject) {
    arcProject.status = "in_review";
  }

  projectStore.dismissed_demo_ids = (projectStore.dismissed_demo_ids ?? []).filter(
    (id) => id !== DEMO_PROJECT_ID
  );
  projectStore.deleted_project_ids = (projectStore.deleted_project_ids ?? []).filter(
    (id) => id !== DEMO_PROJECT_ID
  );
  writeJson("project-store.json", projectStore);

  const reviewStorePath = path.join(dataDir, "review-store.json");
  const reviewStore = JSON.parse(readFileSync(reviewStorePath, "utf8")) as {
    comments: Array<Record<string, unknown>>;
    dismissed_demo_order_ids?: string[];
  };

  reviewStore.comments = reviewStore.comments.filter(
    (item) => item.order_id !== DEMO_ORDER_ID
  );
  reviewStore.dismissed_demo_order_ids = (reviewStore.dismissed_demo_order_ids ?? []).filter(
    (id) => id !== DEMO_ORDER_ID
  );
  writeJson("review-store.json", reviewStore);

  try {
    rmSync(path.join(dataDir, "uploads", "review", DEMO_ORDER_ID), {
      recursive: true,
      force: true
    });
  } catch {
    // ignore missing upload dir
  }
}

async function resetPrismaCampaign() {
  if (!hasDatabaseUrl()) {
    console.log("DATABASE_URL not set — JSON stores reset only.");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        productionBrief: {
          path: ["legacy_project_id"],
          equals: DEMO_PROJECT_ID
        }
      },
      select: { id: true }
    });

    if (campaigns.length === 0) {
      console.log("No Prisma campaign linked to proj_demo_arc_nova — skipped DB reset.");
      return;
    }

    for (const campaign of campaigns) {
      await prisma.reviewAnnotation.deleteMany({ where: { campaignId: campaign.id } });
      await prisma.reviewComment.deleteMany({ where: { campaignId: campaign.id } });

      const extraVersions = await prisma.campaignVersion.findMany({
        where: { campaignId: campaign.id, versionNumber: { gt: 1 } },
        select: { id: true }
      });
      if (extraVersions.length > 0) {
        await prisma.campaignVersion.deleteMany({
          where: { id: { in: extraVersions.map((item) => item.id) } }
        });
      }

      const v1 = await prisma.campaignVersion.findFirst({
        where: { campaignId: campaign.id, versionNumber: 1 }
      });

      if (!v1) {
        const brand = await prisma.user.findUniqueOrThrow({
          where: { email: "client.arc@studioos.test" }
        });
        const creator = await prisma.user.findUniqueOrThrow({
          where: { email: "creator.nova@studioos.test" }
        });
        await prisma.campaignVersion.create({
          data: {
            campaignId: campaign.id,
            versionNumber: 1,
            uploadedBy: creator.id,
            videoKey: `campaigns/${campaign.id}/v1.mp4`,
            videoUrl: DEMO_REVIEW_VIDEO_URL,
            duration: 28,
            status: "READY",
            reviewStatus: "REVIEWING"
          }
        });
      } else {
        await prisma.campaignVersion.update({
          where: { id: v1.id },
          data: {
            reviewStatus: "REVIEWING",
            videoUrl: DEMO_REVIEW_VIDEO_URL
          }
        });
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: "UNDER_REVIEW",
          reviewRound: 1,
          currentVersion: 1
        }
      });

      await prisma.dispute.deleteMany({ where: { campaignId: campaign.id } });
    }

    console.log(`Prisma review reset for ${campaigns.length} campaign(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

function resetMvpStore() {
  execSync("npm run reset:demo-review", { cwd: root, stdio: "inherit" });
}

async function main() {
  resetJsonStores();
  await resetPrismaCampaign();
  resetMvpStore();

  console.log("");
  console.log("Arc Nova review flow reset complete.");
  console.log("  Order:   ord_demo_arc_nova → review, v1 only, no comments");
  console.log("  Project: proj_demo_arc_nova → in_review");
  console.log("");
  console.log("Restart dev server so memory cache clears:");
  console.log("  npm run dev:clean");
  console.log("");
  console.log("Brand review:");
  console.log("  http://localhost:3000/brand/projects/proj_demo_arc_nova/review?lang=zh");
  console.log("Creator review:");
  console.log("  http://localhost:3000/studio/review/ord_demo_arc_nova?lang=zh");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
