/**
 * Creator-1 impact analysis — run after migration, before backfill / enforcement.
 * Usage: npm run creator-lifecycle:analyze
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const prisma = new PrismaClient();

type Row = Record<string, string | number | boolean>;

function toCsv(rows: Row[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => JSON.stringify(row[header] ?? "")).join(","));
  }
  return lines.join("\n");
}

async function main() {
  const [
    totalCreatorProfiles,
    depositPaidCount,
    profileCompletedCount,
    strategyBCandidates,
    strategyCCandidates,
    activeInvitationsCount,
    activeOrdersCount,
    matchingPoolCurrent,
    membershipVerifiedPlanCount
  ] = await Promise.all([
    prisma.creatorProfile.count(),
    prisma.creatorProfile.count({
      where: { depositAccount: { depositStatus: "PAID" } }
    }),
    prisma.creatorProfile.count({ where: { profileCompletedAt: { not: null } } }),
    prisma.creatorProfile.count({ where: { depositAccount: { depositStatus: "PAID" } } }),
    prisma.creatorProfile.count({
      where: {
        depositAccount: { depositStatus: "PAID" },
        profileCompletedAt: { not: null }
      }
    }),
    prisma.creatorInvitation.count({
      where: { status: { in: ["SENT", "VIEWED", "ACCEPTED"] } }
    }),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
    prisma.creatorProfile.count({
      where: {
        availability: { in: ["AVAILABLE", "LIMITED", "BUSY"] },
        user: { role: "CREATOR", deletedAt: null, status: "ACTIVE" }
      }
    }),
    prisma.creatorMembership.count({
      where: { status: "ACTIVE", plan: { planType: "VERIFIED" } }
    })
  ]);

  const wouldLoseMatchingIfEnforcedNoBackfill = matchingPoolCurrent;

  const report = {
    generatedAt: new Date().toISOString(),
    total_creator_profiles: totalCreatorProfiles,
    deposit_paid_count: depositPaidCount,
    profile_completed_count: profileCompletedCount,
    strategy_b_candidate_count: strategyBCandidates,
    strategy_c_candidate_count: strategyCCandidates,
    active_invitations_count: activeInvitationsCount,
    active_orders_count: activeOrdersCount,
    matching_pool_current: matchingPoolCurrent,
    would_lose_matching_if_enforced_no_backfill: wouldLoseMatchingIfEnforcedNoBackfill,
    matching_pool_after_strategy_a: 0,
    matching_pool_after_strategy_b: strategyBCandidates,
    matching_pool_after_strategy_c: strategyCCandidates,
    membership_verified_plan_count: membershipVerifiedPlanCount,
    risk:
      wouldLoseMatchingIfEnforcedNoBackfill > 0
        ? "HIGH — select backfill B/C/D before enabling creator.lifecycle.enforcement"
        : "LOW — no active matching pool or empty environment"
  };

  const profiles = await prisma.creatorProfile.findMany({
    select: {
      id: true,
      displayName: true,
      verificationStatus: true,
      canAcceptProjects: true,
      marketplaceVisible: true,
      profileCompletedAt: true,
      depositAccount: { select: { depositStatus: true } },
      user: { select: { email: true, status: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  const csvRows: Row[] = profiles.map((profile) => ({
    creatorProfileId: profile.id,
    email: profile.user.email,
    displayName: profile.displayName,
    verificationStatus: profile.verificationStatus,
    depositStatus: profile.depositAccount?.depositStatus ?? "UNPAID",
    profileCompleted: profile.profileCompletedAt != null,
    strategyB: profile.depositAccount?.depositStatus === "PAID",
    strategyC:
      profile.depositAccount?.depositStatus === "PAID" && profile.profileCompletedAt != null
  }));

  const outDir = join(ROOT, "tmp");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "creator-lifecycle-impact-report.json"), JSON.stringify(report, null, 2));
  writeFileSync(join(outDir, "creator-lifecycle-impact.csv"), toCsv(csvRows));

  console.log(JSON.stringify(report, null, 2));
  console.log(`\nWrote ${join(outDir, "creator-lifecycle-impact-report.json")}`);
  console.log(`Wrote ${join(outDir, "creator-lifecycle-impact.csv")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
