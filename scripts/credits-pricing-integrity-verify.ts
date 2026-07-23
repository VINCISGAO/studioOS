/**
 * Pricing rule integrity verification
 * Run: npm run credits:pricing:verify
 */
import { PrismaClient } from "@prisma/client";
import { creditGenerationBillingService } from "../features/credit-wallet/credit-generation-billing.service";
import { creditPricingIntegrityService } from "../features/credit-wallet/credit-pricing-integrity.service";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

function report(checks: Check[]) {
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
  }
  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`${failed.length} pricing integrity check(s) failed`);
  }
}

async function main() {
  const checks: Check[] = [];

  if (!process.env.DATABASE_URL) {
    checks.push({ name: "pricing.skip", ok: true, detail: "DATABASE_URL not configured" });
    report(checks);
    return;
  }

  const reportData = await creditPricingIntegrityService.getReport();
  checks.push({
    name: "pricing.integrity_report",
    ok: reportData.healthy,
    detail: reportData.issues.map((issue) => issue.internalModelId).join(", ") || "healthy"
  });

  for (const modelId of ["gpt-image", "nano-banana-2", "seedance-2.0", "kling-3.0", "veo-3.1", "v7.5-all"]) {
    const generationType =
      modelId.startsWith("v7") ? "MUSIC" : ["gpt-image", "nano-banana-2"].includes(modelId) ? "IMAGE" : "VIDEO";
    const quote = await creditGenerationBillingService.quoteGenerationDetailed({
      type: generationType,
      model: modelId,
      parameters:
        generationType === "MUSIC"
          ? { mode: "custom", duration: 30, outputs: 1 }
          : generationType === "VIDEO"
            ? { duration: 5, quality: "720p", outputs: 1 }
            : { width: 1024, height: 1024, resolution: "1024", outputs: 1, quality: "medium" }
    });
    checks.push({
      name: `pricing.quote.${modelId}`,
      ok:
        generationType === "VIDEO" && modelId === "seedance-2.0"
          ? quote.credits === 69 && Boolean(quote.ruleId)
          : quote.credits > 0 && Boolean(quote.ruleId),
      detail: `${quote.credits}/${quote.ruleId}`
    });
  }

  const enabledWithoutRules = await prisma.aiModel.count({
    where: {
      enabled: true,
      deletedAt: null,
      pricingRules: { none: { status: "PUBLISHED", enabled: true } }
    }
  });
  checks.push({
    name: "pricing.enabled_models_have_rules",
    ok: enabledWithoutRules === 0,
    detail: String(enabledWithoutRules)
  });

  report(checks);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
