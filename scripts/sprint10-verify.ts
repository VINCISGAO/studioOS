/**
 * Sprint 10 — AI Gateway + Queue
 * Run: npm run sprint10:verify
 */
import { PrismaClient } from "@prisma/client";
import { campaignService } from "../features/campaign/campaign.service";
import { creativeDirectionService } from "../features/ai/creative-direction.service";
import { aiJobService } from "../features/ai/ai-job.service";
import { aiWorkerService } from "../features/ai/ai-worker.service";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let campaignId: string | null = null;

  try {
    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@adbridge.test" } });

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);

    const created = await campaignService.create(
      { id: brand.id, role: "BRAND" },
      {
        title: "Sprint 10 Verify Campaign",
        description: "AI gateway queue test",
        budget: 3200,
        currency: "USD",
        deadline: deadline.toISOString(),
        platform: "TikTok",
        aspect_ratio: "9:16"
      }
    );
    campaignId = created?.id ?? null;
    if (!campaignId) throw new Error("Campaign not created");

    const directions = await creativeDirectionService.generate(campaignId, {
      id: brand.id,
      role: "BRAND"
    });
    checks.push({
      name: "creative.generate",
      ok: directions.length === 3,
      detail: `${directions.length} directions`
    });

    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
    checks.push({
      name: "campaign.creative_ready",
      ok: campaign.status === "CREATIVE_READY",
      detail: campaign.status
    });

    const jobs = await aiJobService.listForCampaign(campaignId, { id: brand.id, role: "BRAND" });
    const job = jobs.items[0];
    checks.push({
      name: "ai.job.success",
      ok: job?.status === "SUCCESS",
      detail: job ? `${job.provider} $${job.cost}` : "missing"
    });

    checks.push({
      name: "ai.cost_tracking",
      ok: job != null && job.tokenInput >= 0 && job.tokenOutput >= 0,
      detail: job ? `${job.tokenInput}/${job.tokenOutput} tokens` : "n/a"
    });

    const queued = await creativeDirectionService.generateAsync(campaignId, {
      id: brand.id,
      role: "BRAND"
    });
    checks.push({
      name: "ai.async_enqueue",
      ok: Boolean(queued.jobId),
      detail: queued.jobId
    });

    if (queued.jobId) {
      await aiWorkerService.processJob(queued.jobId);
      const polled = await aiJobService.getJob(queued.jobId, { id: brand.id, role: "BRAND" });
      checks.push({
        name: "ai.async_process",
        ok: polled.status === "SUCCESS",
        detail: polled.status
      });
    }
  } catch (error) {
    checks.push({
      name: "sprint10.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (campaignId) {
      await prisma.aiJob.deleteMany({ where: { campaignId } });
      await prisma.activityLog.deleteMany({ where: { campaignId } });
      await prisma.domainEvent.deleteMany({ where: { aggregateId: campaignId } });
      await prisma.campaign.delete({ where: { id: campaignId } });
    }
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 10 verification\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
