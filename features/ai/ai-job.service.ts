import { aiJobRepository } from "@/features/ai/ai-job.repository";
import { serializeAiJob } from "@/features/ai/ai-job.serializer";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export class AiJobService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async getJob(jobId: string, user: AuthUser) {
    this.assertDb();
    const job = await aiJobRepository.findById(jobId);
    if (!job) throw appError("NOT_FOUND", "AI job not found");

    if (job.campaignId) {
      const campaign = await campaignRepository.findById(job.campaignId);
      if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
      if (!PermissionService.canAccessCampaign(user, campaign) && user.role.toUpperCase() !== "ADMIN") {
        throw appError("FORBIDDEN", "Not allowed for this job");
      }
    }

    PermissionService.assert(user, "campaign.read");
    return serializeAiJob(job);
  }

  async listForCampaign(campaignId: string, user: AuthUser) {
    this.assertDb();
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }
    PermissionService.assert(user, "campaign.read");

    const jobs = await aiJobRepository.listForCampaign(campaignId);
    return { items: jobs.map(serializeAiJob) };
  }
}

export const aiJobService = new AiJobService();
