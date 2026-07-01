/**
 * Remove runtime Prisma data for the six demo portal accounts (not admin).
 * Keeps user rows and profiles; clears campaigns, messages, wallets, memberships.
 *
 * Run via: npm run reset:demo-prisma
 */
import { PrismaClient } from "@prisma/client";
import { DEMO_USERS } from "../lib/demo-auth";
import { hasDatabaseUrl } from "../lib/core/database/prisma";

const DEMO_EMAILS = DEMO_USERS.filter((user) => user.role !== "admin").map((user) => user.email);

async function deleteCampaignGraph(prisma: PrismaClient, campaignIds: string[]) {
  if (campaignIds.length === 0) return 0;

  await prisma.videoJob.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.reviewAnnotation.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.reviewComment.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.campaignDelivery.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.campaignVersion.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.campaignAsset.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.creatorInvitation.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.dispute.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.communicationMessage.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.memoryFact.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.activityLog.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.notification.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.orderCommission.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.ledgerEntry.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });
  await prisma.escrowPayment.deleteMany({
    where: { campaignId: { in: campaignIds } }
  });

  const deleted = await prisma.campaign.deleteMany({
    where: { id: { in: campaignIds } }
  });

  return deleted.count;
}

async function main() {
  if (!hasDatabaseUrl()) {
    console.log("DATABASE_URL not set — skipping Prisma demo reset.");
    return;
  }

  const prisma = new PrismaClient();

  try {
    const users = await prisma.user.findMany({
      where: { email: { in: DEMO_EMAILS } },
      select: { id: true, email: true, role: true, creatorProfile: { select: { id: true } } }
    });

    if (users.length === 0) {
      console.log("No demo users found — run npm run db:seed first.");
      return;
    }

    const userIds = users.map((user) => user.id);
    const brandIds = users.filter((user) => user.role === "BRAND").map((user) => user.id);
    const creatorIds = users.filter((user) => user.role === "CREATOR").map((user) => user.id);
    const creatorProfileIds = users
      .map((user) => user.creatorProfile?.id)
      .filter((id): id is string => Boolean(id));

    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [{ brandId: { in: brandIds } }, { creatorId: { in: creatorIds } }]
      },
      select: { id: true }
    });

    const campaignIds = campaigns.map((item) => item.id);
    const deletedCampaigns = await deleteCampaignGraph(prisma, campaignIds);

    const deletedNotifications = await prisma.notification.deleteMany({
      where: { userId: { in: userIds } }
    });

    await prisma.communicationMessage.deleteMany({
      where: {
        OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }]
      }
    });

    if (creatorProfileIds.length > 0) {
      await prisma.creatorInvitation.deleteMany({
        where: { creatorId: { in: creatorProfileIds } }
      });
    }

    await prisma.creatorMembershipHistory.deleteMany({
      where: { creatorId: { in: creatorIds } }
    });

    await prisma.creatorMembership.deleteMany({
      where: { creatorId: { in: creatorIds } }
    });

    await prisma.creatorEarnings.deleteMany({
      where: { creatorId: { in: creatorIds } }
    });

    const walletAccounts = await prisma.walletAccount.findMany({
      where: { userId: { in: creatorIds } },
      select: { id: true }
    });
    const walletAccountIds = walletAccounts.map((item) => item.id);

    if (walletAccountIds.length > 0) {
      await prisma.ledgerEntry.deleteMany({
        where: { walletAccountId: { in: walletAccountIds } }
      });
      await prisma.walletAsset.updateMany({
        where: { walletAccountId: { in: walletAccountIds } },
        data: { availableBalance: 0, pendingBalance: 0, frozenBalance: 0 }
      });
    }

    const wallets = await prisma.wallet.findMany({
      where: { userId: { in: creatorIds } },
      select: { id: true }
    });

    if (wallets.length > 0) {
      await prisma.transaction.deleteMany({
        where: { walletId: { in: wallets.map((item) => item.id) } }
      });
    }

    await prisma.wallet.updateMany({
      where: { userId: { in: creatorIds } },
      data: {
        availableBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdraw: 0
      }
    });

    const { membershipService } = await import("../features/membership/membership.service");
    for (const user of users.filter((item) => item.role === "CREATOR")) {
      await membershipService.ensureDefaultMembershipOnCreatorRegister(
        user.id,
        user.creatorProfile?.id
      );
    }

    console.log("Prisma demo reset complete.");
    console.log(`  campaigns removed: ${deletedCampaigns}`);
    console.log(`  in-app notifications removed: ${deletedNotifications.count}`);
    console.log(`  demo users: ${users.map((user) => user.email).join(", ")}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
