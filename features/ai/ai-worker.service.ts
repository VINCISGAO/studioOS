import { aiUsageQuotaService } from "@/features/abuse/ai-usage-quota.service";
import { aiJobRepository } from "@/features/ai/ai-job.repository";
import { assertCampaignEscrowFunded } from "@/features/payment/escrow-guards";
import { runCreativeDirectionJob } from "@/features/ai/creative-direction.runner";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import { aiConfig } from "@/lib/core/config/ai";
import { appError } from "@/lib/core/errors";
import { logger } from "@/lib/core/logger";
import { AiJobState, MAX_AI_RETRIES } from "@/features/shared/state-machines/ai-job.state-machine";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { normalizeLanguageCode } from "@/features/i18n/language.constants";
import type { WizardBriefSnapshot } from "@/lib/studioos/brand-wizard-brief-snapshot";

export class AiWorkerService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async enqueueCreativeDirection(
    campaignId: string,
    actorUserId: string,
    extras?: { briefSnapshot?: WizardBriefSnapshot; language?: string; wizardFastPath?: boolean }
  ) {
    this.assertDb();
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!extras?.wizardFastPath) {
      await assertCampaignEscrowFunded(
        campaignId,
        "AI creative generation is available only after escrow payment"
      );
    }
    const actor = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { languageCode: true, language: true }
    });
    const language = normalizeLanguageCode(extras?.language ?? actor?.languageCode ?? actor?.language);

    return aiJobRepository.create({
      campaignId,
      type: "CREATIVE_DIRECTION",
      provider: aiGatewayProviderLabel(),
      promptVersion: aiConfig.promptVersion,
      inputJson: {
        campaignId,
        actorUserId,
        title: campaign.title,
        platform: campaign.platform,
        aspectRatio: campaign.aspectRatio,
        budget: Number(campaign.budget),
        language,
        ...(extras?.briefSnapshot ? { briefSnapshot: extras.briefSnapshot } : {}),
        ...(extras?.wizardFastPath ? { wizardFastPath: true } : {})
      }
    });
  }

  scheduleProcess(jobId: string) {
    setImmediate(() => {
      void this.processJob(jobId).catch((error) => {
        logger.error("AI worker failed", {
          service: "AiWorkerService",
          jobId,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    });
  }

  async processJob(jobId: string) {
    this.assertDb();
    let job = await aiJobRepository.findById(jobId);
    if (!job) throw appError("NOT_FOUND", "AI job not found");

    if (job.status === AiJobState.QUEUED || job.status === AiJobState.RETRYING) {
      job = await prisma.aiJob.update({
        where: { id: jobId },
        data: { status: "RUNNING" }
      });
    } else if (job.status !== AiJobState.RUNNING) {
      return { ok: true as const, skipped: true, jobId };
    }

    try {
      const output = await this.dispatch(job);
      await aiJobRepository.update(jobId, {
        status: "SUCCESS",
        outputJson: output.result,
        tokenInput: output.tokenInput,
        tokenOutput: output.tokenOutput,
        cost: output.cost,
        latencyMs: output.latencyMs,
        provider: output.provider,
        completedAt: new Date()
      });

      if (job.campaignId && output.provider === "openai") {
        const actorUserId = String((job.inputJson as { actorUserId?: string }).actorUserId ?? "");
        if (actorUserId) {
          await aiUsageQuotaService.recordOpenAiUsage({
            userId: actorUserId,
            campaignId: job.campaignId,
            category: "creative_direction",
            provider: output.provider,
            tokenInput: output.tokenInput ?? 0,
            tokenOutput: output.tokenOutput ?? 0,
            cost: output.cost ?? 0,
            metadata: { jobId, jobType: job.type }
          });
        }
      }

      return { ok: true as const, jobId, status: "SUCCESS" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryCount = job.retryCount + 1;
      const nextStatus = retryCount >= MAX_AI_RETRIES ? "DEAD" : "RETRYING";

      await aiJobRepository.update(jobId, {
        status: nextStatus,
        retryCount,
        outputJson: { error: message }
      });

      if (job.campaignId && nextStatus === "DEAD") {
        await campaignService.transition(job.campaignId, CampaignEvent.AI_FAILED, {
          id: String((job.inputJson as { actorUserId?: string }).actorUserId ?? ""),
          role: "BRAND"
        });
      }

      return { ok: false as const, jobId, error: message };
    }
  }

  async processNextWaiting() {
    this.assertDb();
    const job = await aiJobRepository.claimNext();
    if (!job) return null;
    return this.processJob(job.id);
  }

  private async dispatch(job: NonNullable<Awaited<ReturnType<typeof aiJobRepository.findById>>>) {
    if (job.type === "CREATIVE_DIRECTION") {
      return this.runCreativeDirection(job);
    }
    throw new Error(`Unknown AI job type: ${job.type}`);
  }

  private async runCreativeDirection(job: NonNullable<Awaited<ReturnType<typeof aiJobRepository.findById>>>) {
    const campaignId = job.campaignId;
    if (!campaignId) throw new Error("Missing campaignId on AI job");

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const input = job.inputJson as {
      actorUserId?: string;
      language?: string;
      briefSnapshot?: WizardBriefSnapshot;
      wizardFastPath?: boolean;
    };
    if (!input.wizardFastPath) {
      await assertCampaignEscrowFunded(
        campaignId,
        "AI creative generation is available only after escrow payment"
      );
    }
    const actorUserId = String(input.actorUserId ?? campaign.brandId);
    const language = normalizeLanguageCode(input.language);
    const actor = { id: actorUserId, role: "BRAND" as const };

    if (campaign.status === CampaignState.AI_PROCESSING) {
      // already in processing
    } else if (campaign.status === CampaignState.DRAFT) {
      await campaignService.transition(campaignId, CampaignEvent.START_AI, actor);
    }

    const result = await runCreativeDirectionJob(campaign, {
      language,
      briefSnapshot: input.briefSnapshot ?? null,
      wizardFastPath: input.wizardFastPath === true
    });

    const brief = {
      ...((campaign.productionBrief as Record<string, unknown> | null) ?? {}),
      creative_directions: result.directions,
      language,
      generated_at: new Date().toISOString(),
      ai_job_id: job.id
    };

    await campaignRepository.updateCreativeBrief(campaignId, brief, result.directions[0]?.title);

    const refreshed = await campaignRepository.findById(campaignId);
    if (refreshed?.status === CampaignState.AI_PROCESSING) {
      await campaignService.transition(campaignId, CampaignEvent.AI_SUCCESS, actor);
    }

    return {
      result: { directions: result.directions },
      provider: result.provider,
      tokenInput: result.tokenInput,
      tokenOutput: result.tokenOutput,
      cost: result.cost,
      latencyMs: result.latencyMs
    };
  }
}

function aiGatewayProviderLabel() {
  return process.env.OPENAI_API_KEY?.trim() ? "openai" : "template";
}

export const aiWorkerService = new AiWorkerService();
