import type { AiJob, AiJobStatus } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class AiJobRepository {
  async create(input: {
    campaignId?: string;
    type: string;
    provider: string;
    inputJson: Record<string, unknown>;
    promptVersion?: string;
  }): Promise<AiJob> {
    return prisma.aiJob.create({
      data: {
        campaignId: input.campaignId,
        type: input.type,
        provider: input.provider,
        status: "QUEUED",
        inputJson: input.inputJson,
        promptVersion: input.promptVersion
      }
    });
  }

  async findById(id: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.aiJob.findUnique({ where: { id } });
  }

  async listForCampaign(campaignId: string, limit = 20) {
    return prisma.aiJob.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  async claimNext(): Promise<AiJob | null> {
    const job = await prisma.aiJob.findFirst({
      where: { status: { in: ["QUEUED", "RETRYING"] } },
      orderBy: { createdAt: "asc" }
    });
    if (!job) return null;

    return prisma.aiJob.update({
      where: { id: job.id, status: job.status },
      data: { status: "RUNNING" }
    });
  }

  async update(
    id: string,
    data: Partial<{
      status: AiJobStatus;
      outputJson: Record<string, unknown>;
      tokenInput: number;
      tokenOutput: number;
      cost: number;
      latencyMs: number;
      retryCount: number;
      provider: string;
      completedAt: Date;
    }>
  ) {
    return prisma.aiJob.update({
      where: { id },
      data: {
        ...data,
        cost: data.cost != null ? data.cost : undefined
      }
    });
  }
}

export const aiJobRepository = new AiJobRepository();
