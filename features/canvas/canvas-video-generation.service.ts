import { videoGenerationService } from "@/features/video-engine/video-generation.service";

/** @deprecated Prefer `videoGenerationService` from `features/video-engine`. */
export class CanvasVideoGenerationService {
  scheduleJob(jobId: string, ownerId: string) {
    videoGenerationService.scheduleJob(jobId, ownerId);
  }

  async processJob(jobId: string, ownerId: string) {
    await videoGenerationService.processJob(jobId, ownerId);
  }
}

export const canvasVideoGenerationService = new CanvasVideoGenerationService();
