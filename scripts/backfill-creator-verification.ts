/**
 * Owner-approved backfill for Creator verification — never run inside migration.
 * Usage:
 *   npm run creator-lifecycle:backfill -- --strategy=C --dry-run
 *   npm run creator-lifecycle:backfill -- --strategy=D --csv=tmp/owner-approved.csv --execute
 */
import { readFileSync } from "node:fs";
import { PrismaClient, type CreatorVerificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

type Strategy = "A" | "B" | "C" | "D";

function parseArgs(argv: string[]) {
  const strategyRaw = argv.find((arg) => arg.startsWith("--strategy="))?.split("=")[1]?.toUpperCase();
  const strategy = (strategyRaw ?? "") as Strategy;
  const dryRun = argv.includes("--dry-run");
  const execute = argv.includes("--execute");
  const csvPath = argv.find((arg) => arg.startsWith("--csv="))?.split("=")[1];
  return { strategy, dryRun, execute, csvPath };
}

async function loadCandidateIds(strategy: Strategy, csvPath?: string): Promise<string[]> {
  if (strategy === "A") return [];

  if (strategy === "D") {
    if (!csvPath) throw new Error("Strategy D requires --csv=path");
    const raw = readFileSync(csvPath, "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(",")[0]?.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  }

  if (strategy === "B") {
    const rows = await prisma.creatorProfile.findMany({
      where: { depositAccount: { depositStatus: "PAID" } },
      select: { id: true }
    });
    return rows.map((row) => row.id);
  }

  const rows = await prisma.creatorProfile.findMany({
    where: {
      depositAccount: { depositStatus: "PAID" },
      profileCompletedAt: { not: null }
    },
    select: { id: true }
  });
  return rows.map((row) => row.id);
}

async function applyApprove(profileId: string, batchId: string, dryRun: boolean) {
  const profile = await prisma.creatorProfile.findUnique({ where: { id: profileId } });
  if (!profile) {
    console.warn(`skip missing profile ${profileId}`);
    return;
  }

  const previousStatus = profile.verificationStatus;
  if (dryRun) {
    console.log(`[dry-run] APPROVE ${profileId} (${previousStatus} -> APPROVED)`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.creatorProfile.update({
      where: { id: profileId },
      data: {
        verificationStatus: "APPROVED",
        canAcceptProjects: true,
        marketplaceVisible: true,
        verificationReviewedAt: new Date()
      }
    });

    await tx.creatorVerificationReviewLog.create({
      data: {
        creatorProfileId: profileId,
        action: "APPROVE",
        previousVerificationStatus: previousStatus,
        newVerificationStatus: "APPROVED" satisfies CreatorVerificationStatus,
        previousCanAcceptProjects: profile.canAcceptProjects,
        newCanAcceptProjects: true,
        previousMarketplaceVisible: profile.marketplaceVisible,
        newMarketplaceVisible: true,
        reason: `Owner backfill batch ${batchId}`,
        snapshotJson: {
          batchId,
          source: "scripts/backfill-creator-verification.ts"
        }
      }
    });
  });

  console.log(`APPROVED ${profileId}`);
}

async function main() {
  const { strategy, dryRun, execute, csvPath } = parseArgs(process.argv.slice(2));
  if (!["A", "B", "C", "D"].includes(strategy)) {
    throw new Error("Provide --strategy=A|B|C|D");
  }
  if (!dryRun && !execute) {
    throw new Error("Pass --dry-run or --execute");
  }
  if (dryRun && execute) {
    throw new Error("Use either --dry-run or --execute, not both");
  }

  const batchId = `backfill-${strategy}-${new Date().toISOString()}`;
  const candidateIds = await loadCandidateIds(strategy, csvPath);

  console.log(
    JSON.stringify(
      {
        strategy,
        mode: dryRun ? "dry-run" : "execute",
        candidateCount: candidateIds.length,
        batchId
      },
      null,
      2
    )
  );

  if (strategy === "A") {
    console.log("Strategy A — no profile updates (remain NOT_APPLIED)");
    return;
  }

  for (const profileId of candidateIds) {
    await applyApprove(profileId, batchId, dryRun);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
