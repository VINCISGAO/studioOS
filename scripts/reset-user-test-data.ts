/**
 * Reset ordinary user test data while preserving:
 * - master-admin login (admin_users + sessions/passkeys)
 * - the owner portal user (ADMIN_LOGIN_EMAIL) and that user's canvas rows, if any
 * - Knowledge Center articles (knowledge_*)
 * - verification codes + platform AI learning row counts
 *
 * Clears every other user account and their canvas / campaign / order test data.
 * Never uses TRUNCATE users CASCADE.
 *
 * Run:
 *   VINCIS_RESET_USER_DATA=DELETE_ALL_NON_ADMIN_USERS npm run reset:user-test-data
 *
 * Production:
 *   VINCIS_RESET_USER_DATA=DELETE_ALL_NON_ADMIN_USERS VINCIS_RESET_USER_DATA_TARGET=production npm run reset:user-test-data
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";

const CONFIRM_ENV = "VINCIS_RESET_USER_DATA";
const CONFIRM_VALUE = "DELETE_ALL_NON_ADMIN_USERS";
const PRODUCTION_FLAG = "VINCIS_RESET_USER_DATA_TARGET";
const OWNER_EMAIL = (process.env.ADMIN_LOGIN_EMAIL ?? "gwxaxxw@gmail.com").trim().toLowerCase();
const LOCAL_DATA_ROOT = path.join(process.cwd(), ".data");

type Tx = Prisma.TransactionClient;

const EMPTY_RUNTIME_STORES: Record<string, Record<string, unknown>> = {
  "order-store.json": { quotes: [], orders: [], deliverables: [], dismissed_demo_ids: [], deleted_order_ids: [] },
  "project-store.json": { projects: [], applications: [], dismissed_demo_ids: [], deleted_project_ids: [] },
  "campaign-store.json": { assets: [], references: [], briefs: [], pack_items: [] },
  "chat-store.json": { inquiries: [], messages: [] },
  "review-store.json": { comments: [], dismissed_demo_order_ids: [] },
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
  "certification-form-store.json": { forms: [] },
  "deposit-store.json": { creator_overlays: {}, payments: [] },
  "creator-settings-store.json": { settings: {}, email_aliases: {} },
  "creator-profile-store.json": { profiles: {} },
  "brand-profile-store.json": { profiles: {} },
  "works-store.json": { works: [], deletedIds: [] },
  "mvp-store.json": { profiles: [], projects: [], versions: [], comments: [] }
};

function databaseHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

function isProductionDatabase(url: string) {
  const host = databaseHost(url).toLowerCase();
  return !host.includes("localhost") && !host.includes("127.0.0.1");
}

function fingerprint(value: unknown) {
  return createHash("sha256")
    .update(
      JSON.stringify(value, (_key, item: unknown) => {
        if (typeof item === "bigint") return item.toString();
        if (Buffer.isBuffer(item)) return item.toString("base64");
        return item;
      })
    )
    .digest("hex");
}

async function readProtectedAdminSnapshot(prisma: PrismaClient) {
  const admin = await prisma.adminUser.findUnique({
    where: { email: OWNER_EMAIL },
    select: {
      id: true,
      email: true,
      fullName: true,
      isMaster: true,
      status: true,
      totpSecretEnc: true,
      totpEnabled: true,
      totpBoundAt: true,
      permissions: true,
      deletedAt: true,
      sessions: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          tokenHash: true,
          ipHash: true,
          userAgentHash: true,
          expiresAt: true,
          revokedAt: true,
          createdAt: true
        }
      },
      webAuthnCredentials: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          credentialId: true,
          publicKey: true,
          counter: true,
          createdAt: true
        }
      },
      _count: { select: { auditLogs: true, totpConsumptions: true } }
    }
  });

  if (
    !admin ||
    !admin.isMaster ||
    admin.status !== "ACTIVE" ||
    admin.deletedAt ||
    !admin.totpEnabled ||
    !admin.totpSecretEnc
  ) {
    throw new Error(
      `Protected master admin ${OWNER_EMAIL} is missing or login integrity is not healthy. Reset aborted.`
    );
  }

  return {
    id: admin.id,
    email: admin.email,
    sessionCount: admin.sessions.length,
    passkeyCount: admin.webAuthnCredentials.length,
    fingerprint: fingerprint(admin)
  };
}

async function readOwnerCanvasSnapshot(prisma: PrismaClient, ownerUserId: string | null) {
  if (!ownerUserId) {
    return { projects: 0, canvases: 0, nodes: 0, edges: 0, assets: 0, jobs: 0 };
  }

  const [projects, canvases, nodes, edges, assets, jobs] = await Promise.all([
    prisma.creativeProject.count({ where: { ownerId: ownerUserId } }),
    prisma.creativeCanvas.count({ where: { creativeProject: { ownerId: ownerUserId } } }),
    prisma.canvasNode.count({ where: { creativeProject: { ownerId: ownerUserId } } }),
    prisma.canvasEdge.count({ where: { creativeProject: { ownerId: ownerUserId } } }),
    prisma.creativeProjectAsset.count({ where: { creativeProject: { ownerId: ownerUserId } } }),
    prisma.generationJob.count({ where: { ownerId: ownerUserId } })
  ]);

  return { projects, canvases, nodes, edges, assets, jobs };
}

async function readProtectedKnowledgeSnapshot(prisma: PrismaClient) {
  const [articles, published] = await Promise.all([
    prisma.knowledgeArticle.count(),
    prisma.knowledgeArticle.count({ where: { status: "PUBLISHED" } })
  ]);

  return {
    articles,
    published,
    fingerprint: fingerprint({ articles, published })
  };
}

async function readProtectedPlatformSnapshot(prisma: PrismaClient) {
  const [verificationCodes, oauthAccounts, aiEvents, aiLearning, aiJobs, memoryFacts] =
    await Promise.all([
      prisma.emailVerificationCode.count(),
      prisma.userOAuthAccount.count(),
      prisma.aIEvent.count(),
      prisma.aILearning.count(),
      prisma.aiJob.count(),
      prisma.memoryFact.count()
    ]);

  return {
    verificationCodes,
    oauthAccounts,
    aiEvents,
    aiLearning,
    aiJobs,
    memoryFacts,
    fingerprint: fingerprint({
      verificationCodes,
      aiEvents,
      aiLearning,
      aiJobs,
      memoryFacts
    })
  };
}

async function collectProtectedUserIds(tx: Tx) {
  const ownerUser = await tx.user.findUnique({
    where: { email: OWNER_EMAIL },
    select: { id: true }
  });
  return ownerUser ? new Set([ownerUser.id]) : new Set<string>();
}

async function collectProtectedCampaignIds(tx: Tx) {
  const ids = new Set<string>();
  for (const article of await tx.knowledgeArticle.findMany({
    where: { campaignId: { not: null } },
    select: { campaignId: true }
  })) {
    if (article.campaignId) ids.add(article.campaignId);
  }
  return ids;
}

async function deleteCampaignGraph(tx: Tx, campaignIds: string[]) {
  if (campaignIds.length === 0) return 0;

  await tx.reviewAnnotation.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.reviewComment.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.campaignDelivery.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.videoJob.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.campaignVersion.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.campaignAsset.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.performanceSource.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.creatorInvitation.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.attribution.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.dispute.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.notification.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.activityLog.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.communicationMessage.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.orderCommission.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.referralCommission.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.ledgerEntry.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.escrowPayment.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.order.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.campaignAiUsageLog.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await tx.memoryFact.updateMany({
    where: { campaignId: { in: campaignIds } },
    data: { campaignId: null }
  });
  await tx.academyCourse.updateMany({
    where: { campaignId: { in: campaignIds } },
    data: { campaignId: null }
  });
  await tx.partnerProgram.updateMany({
    where: { campaignId: { in: campaignIds } },
    data: { campaignId: null }
  });

  const deleted = await tx.campaign.deleteMany({ where: { id: { in: campaignIds } } });
  return deleted.count;
}

async function deleteOrdinaryUsers(tx: Tx, protectedUserIds: Set<string>) {
  const disposableUsers = await tx.user.findMany({
    where: { id: { notIn: [...protectedUserIds] } },
    select: {
      id: true,
      email: true,
      role: true,
      creatorProfile: { select: { id: true } }
    }
  });

  if (disposableUsers.length === 0) {
    return { removedUsers: 0, removedEmails: [] as string[] };
  }

  const userIds = disposableUsers.map((user) => user.id);
  const brandIds = disposableUsers.filter((user) => user.role === "BRAND").map((user) => user.id);
  const creatorIds = disposableUsers.filter((user) => user.role === "CREATOR").map((user) => user.id);
  const creatorProfileIds = disposableUsers
    .map((user) => user.creatorProfile?.id)
    .filter((id): id is string => Boolean(id));

  const protectedCampaignIds = await collectProtectedCampaignIds(tx);
  const disposableCampaigns = await tx.campaign.findMany({
    where: {
      id: { notIn: [...protectedCampaignIds] },
      OR: [{ brandId: { in: brandIds } }, { creatorId: { in: creatorIds } }]
    },
    select: { id: true }
  });
  await deleteCampaignGraph(
    tx,
    disposableCampaigns.map((campaign) => campaign.id)
  );

  await tx.notification.deleteMany({ where: { userId: { in: userIds } } });
  await tx.communicationMessage.deleteMany({
    where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] }
  });
  await tx.conversationMessage.deleteMany({
    where: {
      conversation: {
        OR: [{ customerId: { in: userIds } }, { assignedTo: { in: userIds } }]
      }
    }
  });
  await tx.conversation.deleteMany({
    where: { OR: [{ customerId: { in: userIds } }, { assignedTo: { in: userIds } }] }
  });
  if (creatorProfileIds.length > 0) {
    await tx.creatorInvitation.deleteMany({ where: { creatorId: { in: creatorProfileIds } } });
  }
  await tx.creatorMembershipHistory.deleteMany({ where: { creatorId: { in: creatorIds } } });
  await tx.creatorMembership.deleteMany({ where: { creatorId: { in: creatorIds } } });
  await tx.creatorEarnings.deleteMany({ where: { creatorId: { in: creatorIds } } });
  await tx.order.deleteMany({
    where: { OR: [{ clientId: { in: userIds } }, { creatorId: { in: userIds } }] }
  });
  await tx.creativeProject.deleteMany({ where: { ownerId: { in: userIds } } });
  await tx.aiPreference.deleteMany({ where: { userId: { in: userIds } } });
  await tx.relationshipDna.deleteMany({
    where: { OR: [{ brandId: { in: userIds } }, { creatorId: { in: userIds } }] }
  });
  await tx.chatMessage.deleteMany({ where: { userId: { in: userIds } } });
  await tx.chatSession.deleteMany({ where: { userId: { in: userIds } } });
  await tx.aiCopilotContext.deleteMany({ where: { userId: { in: userIds } } });

  const wallets = await tx.wallet.findMany({
    where: { userId: { in: userIds } },
    select: { id: true }
  });
  const walletIds = wallets.map((wallet) => wallet.id);
  if (walletIds.length > 0) {
    await tx.transaction.deleteMany({ where: { walletId: { in: walletIds } } });
  }
  await tx.wallet.deleteMany({ where: { userId: { in: userIds } } });
  await tx.walletAccount.deleteMany({ where: { userId: { in: userIds } } });
  await tx.brandProfile.deleteMany({ where: { userId: { in: userIds } } });
  await tx.studioProfile.deleteMany({ where: { userId: { in: userIds } } });
  await tx.creatorProfile.deleteMany({ where: { userId: { in: userIds } } });
  await tx.userOAuthAccount.deleteMany({ where: { userId: { in: userIds } } });

  const deletedUsers = await tx.user.deleteMany({ where: { id: { in: userIds } } });

  return {
    removedUsers: deletedUsers.count,
    removedEmails: disposableUsers.map((user) => user.email)
  };
}

async function resetLocalRuntimeStores() {
  await fs.mkdir(LOCAL_DATA_ROOT, { recursive: true });
  await Promise.all(
    Object.entries(EMPTY_RUNTIME_STORES).map(([fileName, data]) =>
      fs.writeFile(
        path.join(LOCAL_DATA_ROOT, fileName),
        `${JSON.stringify(data, null, 2)}\n`,
        "utf8"
      )
    )
  );
  await fs.rm(path.join(LOCAL_DATA_ROOT, "object-storage"), { recursive: true, force: true });
  await fs.mkdir(path.join(LOCAL_DATA_ROOT, "object-storage"), { recursive: true });
}

function assertProtectedCountsNotDecreased(
  label: string,
  before: Record<string, number>,
  after: Record<string, number>
) {
  for (const key of Object.keys(before)) {
    if (key === "fingerprint") continue;
    if ((after[key] ?? 0) < before[key]) {
      throw new Error(
        `Reset verification failed: protected ${label} decreased (${key}: ${before[key]} → ${after[key] ?? 0}).`
      );
    }
  }
}

function withoutFingerprint(snapshot: Record<string, number | string>) {
  const { fingerprint: _ignored, ...counts } = snapshot;
  return counts as Record<string, number>;
}

async function main() {
  if (process.env[CONFIRM_ENV] !== CONFIRM_VALUE) {
    throw new Error(`Refusing reset. Set ${CONFIRM_ENV}=${CONFIRM_VALUE}.`);
  }

  const databaseUrl =
    process.env.DIRECT_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim() || "";
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const production = isProductionDatabase(databaseUrl);
  if (production && process.env[PRODUCTION_FLAG] !== "production") {
    throw new Error(
      `Production database detected (${databaseHost(databaseUrl)}). Set ${PRODUCTION_FLAG}=production.`
    );
  }

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const adminBefore = await readProtectedAdminSnapshot(prisma);
    const ownerUser = await prisma.user.findUnique({
      where: { email: OWNER_EMAIL },
      select: { id: true, email: true }
    });
    const ownerCanvasBefore = await readOwnerCanvasSnapshot(prisma, ownerUser?.id ?? null);
    const knowledgeBefore = await readProtectedKnowledgeSnapshot(prisma);
    const platformBefore = await readProtectedPlatformSnapshot(prisma);
    const usersBefore = await prisma.user.count();
    const campaignsBefore = await prisma.campaign.count();

    const result = await prisma.$transaction(async (tx) => {
      const protectedUserIds = await collectProtectedUserIds(tx);
      const protectedCampaignIds = await collectProtectedCampaignIds(tx);

      const disposableCampaigns = await tx.campaign.findMany({
        where: { id: { notIn: [...protectedCampaignIds] } },
        select: { id: true }
      });
      const removedCampaigns = await deleteCampaignGraph(
        tx,
        disposableCampaigns.map((campaign) => campaign.id)
      );

      const userResult = await deleteOrdinaryUsers(tx, protectedUserIds);
      await tx.$executeRawUnsafe('DELETE FROM "session_logs"');

      return {
        removedCampaigns,
        removedUsers: userResult.removedUsers,
        removedEmails: userResult.removedEmails,
        keptUserIds: [...protectedUserIds]
      };
    }, { timeout: 180_000 });

    const adminAfter = await readProtectedAdminSnapshot(prisma);
    const ownerCanvasAfter = await readOwnerCanvasSnapshot(prisma, ownerUser?.id ?? null);
    const knowledgeAfter = await readProtectedKnowledgeSnapshot(prisma);
    const platformAfter = await readProtectedPlatformSnapshot(prisma);
    const usersAfter = await prisma.user.count();
    const campaignsAfter = await prisma.campaign.count();

    assertProtectedCountsNotDecreased(
      "master admin sessions",
      { sessions: adminBefore.sessionCount, passkeys: adminBefore.passkeyCount },
      { sessions: adminAfter.sessionCount, passkeys: adminAfter.passkeyCount }
    );
    if (adminBefore.id !== adminAfter.id || adminBefore.fingerprint !== adminAfter.fingerprint) {
      throw new Error("Reset verification failed: protected master admin identity changed.");
    }
    assertProtectedCountsNotDecreased("owner canvas", ownerCanvasBefore, ownerCanvasAfter);
    assertProtectedCountsNotDecreased(
      "Knowledge Center",
      withoutFingerprint(knowledgeBefore),
      withoutFingerprint(knowledgeAfter)
    );
    assertProtectedCountsNotDecreased(
      "platform auth/learning counts",
      withoutFingerprint(platformBefore),
      withoutFingerprint(platformAfter)
    );

    await resetLocalRuntimeStores();

    console.log("Ordinary user test data reset complete (protected assets untouched).");
    console.log(`  database: ${databaseHost(databaseUrl)}`);
    console.log(`  users: ${usersBefore} → ${usersAfter} (kept ${result.keptUserIds.length} protected account(s))`);
    console.log(`  campaigns: ${campaignsBefore} → ${campaignsAfter} (removed ${result.removedCampaigns})`);
    console.log(`  knowledge articles preserved: ${knowledgeAfter.articles} (${knowledgeAfter.published} published)`);
    console.log(
      `  owner canvas preserved: projects=${ownerCanvasAfter.projects}, canvases=${ownerCanvasAfter.canvases}, nodes=${ownerCanvasAfter.nodes}`
    );
    console.log(`  verification codes preserved: ${platformAfter.verificationCodes}`);
    console.log(`  OAuth accounts preserved: ${platformAfter.oauthAccounts}`);
    console.log(`  master admin preserved: ${adminAfter.email}`);
    if (result.removedEmails.length > 0) {
      console.log("  removed user emails:");
      for (const email of result.removedEmails) console.log(`    - ${email}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
