/**
 * Permanently remove all @studioos.test accounts and their runtime data.
 *
 * Run: npm run purge:test-accounts
 */
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasDatabaseUrl } from "../lib/core/database/prisma";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, ".data");
const seedDir = path.join(root, "seed");

const TEST_EMAIL_SUFFIX = "@studioos.test";

async function deleteCampaignGraph(prisma: PrismaClient, campaignIds: string[]) {
  if (campaignIds.length === 0) return 0;

  await prisma.videoJob.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.reviewAnnotation.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.reviewComment.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.campaignDelivery.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.campaignVersion.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.campaignAsset.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.creatorInvitation.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.dispute.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.communicationMessage.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.memoryFact.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.activityLog.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.notification.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.orderCommission.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.ledgerEntry.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.escrowPayment.deleteMany({ where: { campaignId: { in: campaignIds } } });

  const deleted = await prisma.campaign.deleteMany({ where: { id: { in: campaignIds } } });
  return deleted.count;
}

async function purgePrismaTestUsers() {
  if (!hasDatabaseUrl()) {
    console.log("[purge-test-accounts] DATABASE_URL not set — skipped Prisma purge.");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      where: { email: { endsWith: TEST_EMAIL_SUFFIX } },
      select: { id: true, email: true, role: true, creatorProfile: { select: { id: true } } }
    });

    if (users.length === 0) {
      console.log("[purge-test-accounts] No @studioos.test users in database.");
      return;
    }

    const userIds = users.map((user) => user.id);
    const brandIds = users.filter((user) => user.role === "BRAND").map((user) => user.id);
    const creatorIds = users.filter((user) => user.role === "CREATOR").map((user) => user.id);
    const creatorProfileIds = users
      .map((user) => user.creatorProfile?.id)
      .filter((id): id is string => Boolean(id));

    const campaigns = await prisma.campaign.findMany({
      where: { OR: [{ brandId: { in: brandIds } }, { creatorId: { in: creatorIds } }] },
      select: { id: true }
    });
    const deletedCampaigns = await deleteCampaignGraph(
      prisma,
      campaigns.map((item) => item.id)
    );

    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.communicationMessage.deleteMany({
      where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] }
    });
    if (creatorProfileIds.length > 0) {
      await prisma.creatorInvitation.deleteMany({ where: { creatorId: { in: creatorProfileIds } } });
    }
    await prisma.creatorMembershipHistory.deleteMany({ where: { creatorId: { in: creatorIds } } });
    await prisma.creatorMembership.deleteMany({ where: { creatorId: { in: creatorIds } } });
    await prisma.creatorEarnings.deleteMany({ where: { creatorId: { in: creatorIds } } });
    const wallets = await prisma.wallet.findMany({
      where: { userId: { in: userIds } },
      select: { id: true }
    });
    const walletIds = wallets.map((wallet) => wallet.id);
    if (walletIds.length > 0) {
      await prisma.transaction.deleteMany({ where: { walletId: { in: walletIds } } });
    }
    await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.emailVerificationCode.deleteMany({ where: { email: { endsWith: TEST_EMAIL_SUFFIX } } });
    await prisma.authAttempt.deleteMany({ where: { emailHash: { not: "" } } });
    await prisma.brandProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.creatorProfile.deleteMany({ where: { userId: { in: userIds } } });

    const deletedUsers = await prisma.user.deleteMany({
      where: { email: { endsWith: TEST_EMAIL_SUFFIX } }
    });

    console.log(
      `[purge-test-accounts] Removed ${deletedUsers.count} user(s), ${deletedCampaigns} campaign(s):`
    );
    for (const user of users) {
      console.log(`  - ${user.email}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

function resetLocalStores() {
  mkdirSync(dataDir, { recursive: true });
  const seedFiles = readdirSync(seedDir).filter((name) => name.endsWith(".json"));
  for (const fileName of seedFiles) {
    cpSync(path.join(seedDir, fileName), path.join(dataDir, fileName));
  }

  const emptyStores = {
    "creator-invitation-store.json": { invitations: [] },
    "brand-notification-store.json": { notifications: [] },
    "notification-store.json": { notifications: [], dismissed_demo_ids: [] },
    "certification-form-store.json": { forms: [] },
    "withdrawal-store.json": { payout_methods: [], withdrawals: [] },
    "deposit-store.json": { creator_overlays: {}, payments: [] },
    "creative-performance-store.json": { records: [], insights: [], dna_profiles: [] },
    "chat-store.json": { inquiries: [], messages: [] },
    "review-store.json": { comments: [] },
    "order-ratings-store.json": { reviews: [] },
    "order-store.json": { quotes: [], orders: [], deliverables: [], dismissed_demo_ids: [], deleted_order_ids: [] },
    "project-store.json": { projects: [], applications: [], dismissed_demo_ids: [], deleted_project_ids: [] },
    "project-events-store.json": { events: [] },
    "creator-settings-store.json": { settings: {}, email_aliases: {} },
    "creator-profile-store.json": { profiles: {} },
    "brand-profile-store.json": { profiles: {} },
    "works-store.json": { works: [], deletedIds: [] },
    "mvp-store.json": { profiles: [], projects: [], versions: [], comments: [] },
    "deliverable-video-retention.json": { records: [] }
  };

  for (const [fileName, data] of Object.entries(emptyStores)) {
    writeFileSync(path.join(dataDir, fileName), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }

  const uploadRoot = path.join(dataDir, "uploads");
  if (existsSync(uploadRoot)) {
    rmSync(uploadRoot, { recursive: true, force: true });
  }
  mkdirSync(uploadRoot, { recursive: true });

  console.log("[purge-test-accounts] Cleared local .data runtime stores.");
}

async function main() {
  console.log("[purge-test-accounts] Removing all @studioos.test accounts and demo runtime data...");
  resetLocalStores();
  await purgePrismaTestUsers();
  try {
    execSync("npm run reset:demo-prisma", { cwd: root, stdio: "inherit" });
  } catch {
    console.log("[purge-test-accounts] reset:demo-prisma skipped (no remaining demo users).");
  }
  console.log("[purge-test-accounts] Done. Restart dev server if running locally.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
