import { after } from "next/server";
import { canvasRepository } from "@/features/canvas/canvas.repository";
import { creditGenerationBillingService } from "@/features/credit-wallet/credit-generation-billing.service";
import { logger } from "@/lib/core/logger";

export class CanvasMusicGenerationService {
  scheduleJob(jobId: string, ownerId: string) {
    const run = () => {
      void this.processJob(jobId, ownerId).catch((error) => {
        logger.error("Canvas music generation failed", {
          service: "CanvasMusicGenerationService",
          jobId,
          ownerId,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    };

    try {
      after(run);
    } catch {
      run();
    }
  }

  async processJob(jobId: string, ownerId: string) {
    let job = await canvasRepository.findGenerationJob(jobId, ownerId);
    if (!job || job.type !== "MUSIC") return;
    if (job.status !== "QUEUED" && job.status !== "SUBMITTING") return;

    await canvasRepository.updateGenerationJob(jobId, {
      status: "PROCESSING",
      progress: 35,
      startedAt: new Date()
    });

    await new Promise((resolve) => setTimeout(resolve, 1200));

    job = await canvasRepository.updateGenerationJob(jobId, {
      status: "SUCCEEDED",
      progress: 100,
      actualCredits: job.estimatedCredits,
      completedAt: new Date()
    });

    await creditGenerationBillingService.syncJobBilling(job);
  }
}

export const canvasMusicGenerationService = new CanvasMusicGenerationService();
