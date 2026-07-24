/**
 * Pricing rule workflow verification (non-destructive)
 * Run: npm run credits:pricing:workflow:verify
 */
import { PrismaClient } from "@prisma/client";
import { adminPricingRuleService } from "../features/admin/credits/admin-pricing-rule.service";
import { creditGenerationBillingService } from "../features/credit-wallet/credit-generation-billing.service";
import { creditPricingRepository } from "../features/credit-wallet/credit-pricing.repository";

const prisma = new PrismaClient();
const actor = { id: "pricing-workflow-verify", role: "ADMIN" as const, email: "verify@vincis.local" };
const VERIFY_DRAFT_REASON = "workflow verify draft";

type Check = { name: string; ok: boolean; detail?: string };

async function cleanupPricingWorkflowVerifyArtifacts() {
  const removed = await prisma.creditPricingRule.deleteMany({
    where: {
      status: { in: ["DRAFT", "VALIDATED"] },
      changeReason: { contains: VERIFY_DRAFT_REASON, mode: "insensitive" }
    }
  });
  if (removed.count > 0) {
    console.log(`Cleaned ${removed.count} pricing verify draft artifact(s)`);
  }
}

/** CI hygiene: seedance-2.0 video drafts must not block runtime_ignores_drafts when published rules exist. */
async function cleanupStraySeedanceVideoDrafts() {
  if (process.env.CI !== "true" && process.env.PRICING_VERIFY_ALLOW_CLEANUP !== "1") {
    return;
  }

  const publishedSeedanceVideo = await prisma.creditPricingRule.count({
    where: {
      status: "PUBLISHED",
      generationType: "VIDEO",
      model: "seedance-2.0"
    }
  });
  if (publishedSeedanceVideo === 0) return;

  const removed = await prisma.creditPricingRule.deleteMany({
    where: {
      status: { in: ["DRAFT", "VALIDATED"] },
      generationType: "VIDEO",
      model: "seedance-2.0"
    }
  });
  if (removed.count > 0) {
    console.log(`Cleaned ${removed.count} stray seedance-2.0 video draft(s)`);
  }
}

async function preparePricingWorkflowDatabase() {
  await cleanupPricingWorkflowVerifyArtifacts();
  await cleanupStraySeedanceVideoDrafts();
}

function report(checks: Check[]) {
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
  }
  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) throw new Error(`${failed.length} pricing workflow check(s) failed`);
}

async function main() {
  const checks: Check[] = [];
  if (!process.env.DATABASE_URL) {
    checks.push({ name: "pricing.workflow.skip", ok: true, detail: "DATABASE_URL not configured" });
    report(checks);
    return;
  }

  await preparePricingWorkflowDatabase();

  const publishedCount = await prisma.creditPricingRule.count({
    where: { status: "PUBLISHED", enabled: true }
  });
  checks.push({ name: "pricing.workflow.published_rules", ok: publishedCount > 0, detail: String(publishedCount) });

  const quote = await creditGenerationBillingService.quoteGenerationDetailed({
    type: "VIDEO",
    model: "seedance-2.0",
    parameters: { duration: 5, quality: "720p", outputs: 1 }
  });
  checks.push({
    name: "pricing.workflow.quote_has_version",
    ok: quote.credits === 69 && quote.ruleVersion >= 1,
    detail: `${quote.credits}/${quote.ruleId}/v${quote.ruleVersion}`
  });

  const draftOnlyMatch = await creditPricingRepository.findBestMatchingRule({
    type: "VIDEO",
    model: "seedance-2.0",
    parameters: { duration: 5, quality: "720p", outputs: 1 },
    includeStatuses: ["DRAFT", "VALIDATED"]
  });
  checks.push({
    name: "pricing.workflow.runtime_ignores_drafts",
    ok: draftOnlyMatch == null,
    detail: draftOnlyMatch?.status ?? "none"
  });

  const source = await prisma.creditPricingRule.findFirst({
    where: { status: "PUBLISHED", model: "seedance-2.0" },
    orderBy: { version: "desc" }
  });

  if (source) {
    let draftId: string | null = null;
    try {
      const draft = await adminPricingRuleService.duplicate(actor, source.id, {
        changeReason: VERIFY_DRAFT_REASON
      });
      draftId = draft.id;
      checks.push({
        name: "pricing.workflow.duplicate_creates_draft",
        ok: draft.status === "DRAFT" && draft.version > source.version,
        detail: `${draft.id}/v${draft.version}`
      });

      let immutableBlocked = false;
      try {
        await adminPricingRuleService.update(actor, source.id, { creditPrice: source.creditPrice + 1 });
      } catch (error) {
        immutableBlocked = error instanceof Error && error.message.includes("immutable");
      }
      checks.push({
        name: "pricing.workflow.published_immutable",
        ok: immutableBlocked,
        detail: source.id
      });

      const validation = await adminPricingRuleService.validate(actor, draft.id);
      checks.push({
        name: "pricing.workflow.validate_returns_result",
        ok: Array.isArray(validation.issues),
        detail: validation.ok ? "ok" : validation.issues.map((issue) => issue.code).join(", ")
      });
    } finally {
      if (draftId) {
        await prisma.creditPricingRule.delete({ where: { id: draftId } }).catch(() => undefined);
      }
      await preparePricingWorkflowDatabase();
    }
  }

  const publishedWithVersion = await prisma.creditPricingRule.count({
    where: { status: "PUBLISHED", version: { gte: 1 } }
  });
  checks.push({
    name: "pricing.workflow.published_have_versions",
    ok: publishedWithVersion === publishedCount,
    detail: String(publishedWithVersion)
  });

  report(checks);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await preparePricingWorkflowDatabase().catch(() => undefined);
    await prisma.$disconnect();
  });
