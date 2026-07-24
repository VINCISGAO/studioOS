import { canvasImageGenerationService } from "@/features/canvas/canvas-image-generation.service";
import { canvasMusicGenerationService } from "@/features/canvas/canvas-music-generation.service";
import { generationConcurrencyService } from "@/features/generation/concurrency/generation-concurrency.service";
import { videoGenerationService } from "@/features/video-engine/video-generation.service";

export function scheduleGenerationJob(input: {
  type: "IMAGE" | "VIDEO" | "MUSIC";
  provider: string;
  jobId: string;
  ownerId: string;
}) {
  if (input.type === "IMAGE" && input.provider === "openai") {
    canvasImageGenerationService.scheduleJob(input.jobId, input.ownerId);
    return;
  }
  if (input.type === "VIDEO") {
    videoGenerationService.scheduleJob(input.jobId, input.ownerId);
    return;
  }
  if (input.type === "MUSIC") {
    canvasMusicGenerationService.scheduleJob(input.jobId, input.ownerId);
  }
}

export async function maybeScheduleGenerationJob(input: {
  type: "IMAGE" | "VIDEO" | "MUSIC";
  provider: string;
  jobId: string;
  ownerId: string;
  projectId: string;
}) {
  const decision = await generationConcurrencyService.checkCanDispatchJob({
    userId: input.ownerId,
    projectId: input.projectId,
    type: input.type,
    provider: input.provider,
    jobId: input.jobId
  });
  if (!decision.allowed) return false;
  scheduleGenerationJob(input);
  return true;
}
