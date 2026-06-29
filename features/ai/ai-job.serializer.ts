import type { AiJob } from "@prisma/client";

export function serializeAiJob(job: AiJob) {
  return {
    id: job.id,
    campaignId: job.campaignId,
    type: job.type,
    provider: job.provider,
    status: job.status,
    promptVersion: job.promptVersion,
    tokenInput: job.tokenInput,
    tokenOutput: job.tokenOutput,
    cost: Number(job.cost),
    latencyMs: job.latencyMs,
    retryCount: job.retryCount,
    input: job.inputJson,
    output: job.outputJson,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null
  };
}
