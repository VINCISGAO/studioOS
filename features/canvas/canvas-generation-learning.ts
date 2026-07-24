import type { GenerationJob } from "@prisma/client";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { normalizeCopilotRole } from "@/features/ai-copilot/ai-copilot.types";
import { recordLucienCanvasGeneration } from "@/features/ai-copilot/lucien-learning.service";
import { canvasPromptKnowledgeService } from "@/features/ai-copilot/canvas-prompt-knowledge.service";
import { canvasRepository } from "@/features/canvas/canvas.repository";
import { creditGenerationBillingService } from "@/features/credit-wallet/credit-generation-billing.service";
import { normalizeLanguageCode } from "@/features/i18n/language.constants";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveAnswerMode(job: GenerationJob): string {
  const input = isRecord(job.input) ? job.input : {};
  const referenceAssetId =
    typeof input.referenceAssetId === "string" ? input.referenceAssetId.trim() : "";

  if (job.status === "FAILED") {
    if (job.type === "IMAGE") return "image_generation_failed";
    if (job.type === "VIDEO") return "video_generation_failed";
    return "music_generation_failed";
  }

  if (job.type === "IMAGE") {
    return referenceAssetId ? "image_to_image" : "image_generation";
  }
  if (job.type === "VIDEO") return "video_generation";
  return "music_generation";
}

export async function recordCanvasGenerationLucienLearning(
  user: AuthUserDto,
  job: GenerationJob
) {
  if (job.status !== "SUCCEEDED" && job.status !== "FAILED") return;

  const inputPayload = isRecord(job.input) ? job.input : {};

  await recordLucienCanvasGeneration({
    entityId: user.id,
    role: normalizeCopilotRole(user),
    projectId: job.creativeProjectId,
    canvasId: job.canvasId,
    campaignId: job.campaignId,
    jobId: job.id,
    nodeId: job.nodeId,
    generationType: job.type,
    provider: job.provider,
    model: job.model,
    prompt: job.prompt,
    status: job.status,
    answerMode: resolveAnswerMode(job),
    language: normalizeLanguageCode(user.languageCode ?? "en"),
    outputAssetId: job.outputAssetId,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
    estimatedCredits: job.estimatedCredits,
    actualCredits: job.actualCredits,
    inputPayload
  });
}

export async function finalizeCanvasGenerationJob(
  user: AuthUserDto | null,
  jobId: string,
  ownerId: string
) {
  if (!user) return;

  const settledJob = await canvasRepository.findGenerationJob(jobId, ownerId);
  if (!settledJob) return;
  if (settledJob.status !== "SUCCEEDED" && settledJob.status !== "FAILED") return;

  await creditGenerationBillingService.syncJobBilling(settledJob);
  await recordCanvasGenerationLucienLearning(user, settledJob);

  if (settledJob.status === "SUCCEEDED" && settledJob.prompt.trim()) {
    await canvasPromptKnowledgeService.upsertFromGeneration({
      jobId: settledJob.id,
      campaignId: settledJob.campaignId,
      languageCode: user.languageCode ?? "en",
      generationType: settledJob.type,
      prompt: settledJob.prompt,
      model: settledJob.model,
      inputPayload: isRecord(settledJob.input) ? settledJob.input : undefined
    });
  }
}
