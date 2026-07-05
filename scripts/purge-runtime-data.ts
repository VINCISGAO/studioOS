/**
 * Purge test/runtime data while preserving users, profiles, and avatar/profile stores.
 *
 * Required confirmation:
 *   STUDIOOS_PURGE_RUNTIME_DATA=YES npm run data:purge
 *
 * Production/remote DB:
 *   Run the same command with the production DATABASE_URL available.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const CONFIRM_ENV = "STUDIOOS_PURGE_RUNTIME_DATA";
const CONFIRM_VALUE = "YES";

type JsonValue = Record<string, unknown> | unknown[];
type PrismaPurgeResult =
  | { skipped: true; reason: string }
  | { skipped: false; deleted: Record<string, number> };

const EMPTY_RUNTIME_STORES: Record<string, JsonValue> = {
  "order-store.json": {
    quotes: [],
    orders: [],
    deliverables: [],
    dismissed_demo_ids: ["ord_demo_arc_nova", "ord_demo_nova_completed", "ord_demo_nova_active", "ord_demo_nova_first"]
  },
  "project-store.json": {
    projects: [],
    applications: [],
    dismissed_demo_ids: ["proj_demo_arc_nova"],
    deleted_project_ids: []
  },
  "campaign-store.json": { assets: [], references: [], briefs: [], pack_items: [] },
  "chat-store.json": { inquiries: [], messages: [] },
  "review-store.json": {
    comments: [],
    dismissed_demo_order_ids: ["ord_demo_arc_nova", "ord_demo_nova_active"]
  },
  "creator-invitation-store.json": { invitations: [] },
  "notification-store.json": { notifications: [], dismissed_demo_ids: [] },
  "brand-notification-store.json": { notifications: [] },
  "project-events-store.json": { events: [] },
  "review-engine-store.json": { sessions: [] },
  "creative-performance-store.json": { records: [], insights: [], dna_profiles: [] },
  "work-engagement-store.json": { likes: {} },
  "order-ratings-store.json": { reviews: [] },
  "withdrawal-store.json": { payout_methods: [], withdrawals: [] },
  "deliverable-video-retention.json": { records: [] },
  "certification-form-store.json": { forms: [] }
};

async function writeJsonIfDirectoryExists(root: string) {
  const exists = await fs.stat(root).then((stat) => stat.isDirectory()).catch(() => false);
  if (!exists) return 0;

  await Promise.all(
    Object.entries(EMPTY_RUNTIME_STORES).map(async ([fileName, data]) => {
      const filePath = path.join(root, fileName);
      await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    })
  );
  await writeMvpStorePreservingProfiles(root);

  return Object.keys(EMPTY_RUNTIME_STORES).length + 1;
}

async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
  const raw = await fs.readFile(filePath, "utf8").catch(() => null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

async function writeMvpStorePreservingProfiles(root: string) {
  const filePath = path.join(root, "mvp-store.json");
  const current = await readJsonFile(filePath);
  await fs.writeFile(
    filePath,
    `${JSON.stringify(
      {
        profiles: Array.isArray(current?.profiles) ? current.profiles : [],
        projects: [],
        versions: [],
        comments: []
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

async function clearJsonStores() {
  const root = process.cwd();
  const seedCount = await writeJsonIfDirectoryExists(path.join(root, "seed"));
  await fs.mkdir(path.join(root, ".data"), { recursive: true });
  const dataCount = await writeJsonIfDirectoryExists(path.join(root, ".data"));
  return { seedCount, dataCount };
}

async function resetWalletBalances(prisma: PrismaClient) {
  await prisma.wallet.updateMany({
    data: {
      availableBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalWithdraw: 0
    }
  });
  await prisma.walletAsset.updateMany({
    data: {
      availableBalance: 0,
      pendingBalance: 0,
      frozenBalance: 0
    }
  });
  await prisma.creatorEarnings.updateMany({
    data: {
      totalSettledRevenue: 0,
      totalPendingRevenue: 0,
      totalWithdrawn: 0,
      totalCreatorPayout: 0,
      lastUpgradePromptAt: null,
      upgradeDeclinedAt: null
    }
  });
}

async function clearPrismaRuntimeData(): Promise<PrismaPurgeResult> {
  if (!process.env.DATABASE_URL) {
    return { skipped: true, reason: "DATABASE_URL is not set" };
  }

  const prisma = new PrismaClient();
  const deleted: Record<string, number> = {};
  const record = async (name: string, action: Promise<{ count: number }>) => {
    const result = await action;
    deleted[name] = result.count;
  };

  try {
    await record("reviewAnnotations", prisma.reviewAnnotation.deleteMany());
    await record("reviewComments", prisma.reviewComment.deleteMany());
    await record("campaignDeliveries", prisma.campaignDelivery.deleteMany());
    await record("videoJobs", prisma.videoJob.deleteMany());
    await record("campaignVersions", prisma.campaignVersion.deleteMany());
    await record("campaignAssets", prisma.campaignAsset.deleteMany());
    await record("performanceSources", prisma.performanceSource.deleteMany());
    await record("creatorInvitations", prisma.creatorInvitation.deleteMany());
    await record("attributions", prisma.attribution.deleteMany());
    await record("disputes", prisma.dispute.deleteMany());
    await record("notifications", prisma.notification.deleteMany());
    await record("activityLogs", prisma.activityLog.deleteMany());
    await record("memoryFacts", prisma.memoryFact.deleteMany());
    await record("relationshipDna", prisma.relationshipDna.deleteMany());
    await record("domainEvents", prisma.domainEvent.deleteMany());

    await record("communicationTranslationLogs", prisma.communicationTranslationLog.deleteMany());
    await record("communicationMessages", prisma.communicationMessage.deleteMany());
    await record("conversationMessages", prisma.conversationMessage.deleteMany());

    await record("ledgerEntries", prisma.ledgerEntry.deleteMany());
    await record("transactions", prisma.transaction.deleteMany());
    await record("withdrawalRequests", prisma.withdrawalRequest.deleteMany());
    await record("referralCommissions", prisma.referralCommission.deleteMany());
    await record("orderCommissions", prisma.orderCommission.deleteMany());
    await record("escrowPayments", prisma.escrowPayment.deleteMany());
    await record("orders", prisma.order.deleteMany());
    await record("conversations", prisma.conversation.deleteMany());

    await record("aiToolCalls", prisma.aiToolCall.deleteMany());
    await record("aiCopilotContexts", prisma.aiCopilotContext.deleteMany());
    await record("chatMessages", prisma.chatMessage.deleteMany());
    await record("chatSessions", prisma.chatSession.deleteMany());
    await record("aiJobs", prisma.aiJob.deleteMany());
    await record("aiEvents", prisma.aIEvent.deleteMany());
    await record("aiLearning", prisma.aILearning.deleteMany());
    await record("webhookEvents", prisma.webhookEvent.deleteMany());
    await record("queueJobs", prisma.queueJob.deleteMany());
    await record("workerLogs", prisma.workerLog.deleteMany());

    await record("campaignStorageFiles", prisma.storageFile.deleteMany({ where: { campaignId: { not: null } } }));
    await record("academyCampaignLinks", prisma.academyCourse.updateMany({ where: { campaignId: { not: null } }, data: { campaignId: null } }));
    await record("partnerCampaignLinks", prisma.partnerProgram.updateMany({ where: { campaignId: { not: null } }, data: { campaignId: null } }));
    await record("campaigns", prisma.campaign.deleteMany());

    await resetWalletBalances(prisma);

    return { skipped: false, deleted };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (process.env[CONFIRM_ENV] !== CONFIRM_VALUE) {
    throw new Error(`Refusing to purge data. Re-run with ${CONFIRM_ENV}=${CONFIRM_VALUE}.`);
  }

  const [jsonResult, prismaResult] = await Promise.all([clearJsonStores(), clearPrismaRuntimeData()]);

  console.log("Runtime data purge complete.");
  console.log(`  seed stores reset: ${jsonResult.seedCount}`);
  console.log(`  .data stores reset: ${jsonResult.dataCount}`);
  if (prismaResult.skipped) {
    console.log(`  Prisma skipped: ${prismaResult.reason}`);
  } else {
    console.log("  Prisma rows removed:");
    for (const [name, count] of Object.entries(prismaResult.deleted)) {
      if (count > 0) console.log(`    ${name}: ${count}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
