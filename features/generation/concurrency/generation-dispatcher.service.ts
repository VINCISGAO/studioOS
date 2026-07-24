import { generationConcurrencyService } from "@/features/generation/concurrency/generation-concurrency.service";
import { generationQueueRepository } from "@/features/generation/concurrency/generation-queue.repository";
import { logger } from "@/lib/core/logger";

type ScheduleJob = (input: {
  type: "IMAGE" | "VIDEO" | "MUSIC";
  provider: string;
  jobId: string;
  ownerId: string;
}) => void;

export class GenerationDispatcherService {
  async dispatchQueuedJobs(input: {
    ownerId: string;
    projectId?: string;
    scheduleJob: ScheduleJob;
  }) {
    const queued = await generationQueueRepository.listQueuedJobsForOwner(
      input.ownerId,
      input.projectId
    );
    if (!queued.length) return;

    const dispatchedTypes = new Set<string>();

    for (const job of queued) {
      const typeKey = `${job.type}:${job.provider}`;
      if (dispatchedTypes.has(typeKey)) continue;

      const decision = await generationConcurrencyService.checkCanDispatchJob({
        userId: job.ownerId,
        projectId: job.creativeProjectId,
        type: job.type,
        provider: job.provider,
        jobId: job.id
      });
      if (!decision.allowed) continue;

      input.scheduleJob({
        type: job.type,
        provider: job.provider,
        jobId: job.id,
        ownerId: job.ownerId
      });
      dispatchedTypes.add(typeKey);
    }
  }

  async dispatchAfterTerminal(input: {
    ownerId: string;
    projectId: string;
    scheduleJob: ScheduleJob;
  }) {
    try {
      await this.dispatchQueuedJobs(input);
    } catch (error) {
      logger.error("Generation queue dispatch failed", {
        service: "GenerationDispatcherService",
        ownerId: input.ownerId,
        projectId: input.projectId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export const generationDispatcherService = new GenerationDispatcherService();
