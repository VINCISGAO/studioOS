import type { GenerationType } from "@prisma/client";
import { generationConcurrencyPolicy } from "@/features/generation/concurrency/generation-concurrency-policy";
import { generationQueueRepository } from "@/features/generation/concurrency/generation-queue.repository";
import type {
  GenerationConcurrencyCounts,
  GenerationCreateSlotInput,
  GenerationDispatchDecision,
  GenerationDispatchInput
} from "@/features/generation/concurrency/generation-concurrency.types";
import { appError } from "@/lib/core/errors";
import { prisma } from "@/lib/core/database/prisma";

function assertCreateLimits(counts: GenerationConcurrencyCounts, input: GenerationCreateSlotInput) {
  const policy = generationConcurrencyPolicy;
  const typeRunning = counts.userRunningByType[input.type];
  const typeQueued = counts.userQueuedByType[input.type];
  const typeIncomplete = typeRunning + typeQueued;
  const typeIncompleteLimit =
    policy.typeRunningLimit[input.type] + policy.typeQueuedLimit[input.type];
  const userIncomplete = counts.userRunningTotal + counts.userQueuedTotal;
  const userIncompleteLimit = policy.userMaxRunning + policy.userMaxQueued;
  const projectIncomplete = counts.projectRunningTotal + counts.projectQueuedTotal;
  const projectIncompleteLimit = policy.projectMaxRunning + policy.projectMaxQueued;

  if (counts.userQueuedTotal >= policy.userMaxQueued) {
    throw appError(
      "AI_USER_QUEUE_LIMIT_REACHED",
      "当前已有较多任务排队，请等待部分任务完成后再试。",
      { retryAfterSec: 30, scope: "user_queued" }
    );
  }

  if (userIncomplete >= userIncompleteLimit) {
    throw appError(
      "AI_USER_QUEUE_LIMIT_REACHED",
      "当前已有较多任务排队，请等待部分任务完成后再试。",
      { retryAfterSec: 30, scope: "user_total" }
    );
  }

  if (typeQueued >= policy.typeQueuedLimit[input.type]) {
    throw appError(
      "AI_USER_QUEUE_LIMIT_REACHED",
      "当前已有较多任务排队，请等待部分任务完成后再试。",
      { retryAfterSec: 30, scope: "type_queued", type: input.type }
    );
  }

  if (typeIncomplete >= typeIncompleteLimit) {
    throw appError(
      "AI_USER_QUEUE_LIMIT_REACHED",
      "当前已有较多任务排队，请等待部分任务完成后再试。",
      { retryAfterSec: 30, scope: "type_total", type: input.type }
    );
  }

  if (counts.projectQueuedTotal >= policy.projectMaxQueued) {
    throw appError(
      "AI_USER_QUEUE_LIMIT_REACHED",
      "当前项目排队任务已达上限，请稍后再试。",
      { retryAfterSec: 30, scope: "project_queued" }
    );
  }

  if (projectIncomplete >= projectIncompleteLimit) {
    throw appError(
      "AI_USER_QUEUE_LIMIT_REACHED",
      "当前项目并发生成任务已达上限，请稍后再试。",
      { retryAfterSec: 30, scope: "project_total" }
    );
  }

  if (counts.providerQueuedTotal >= policy.providerMaxQueued) {
    throw appError(
      "AI_PROVIDER_QUEUE_BUSY",
      "当前模型使用人数较多，请稍后再试或选择其他模型。",
      { retryAfterSec: 60, provider: input.provider }
    );
  }
}

function evaluateDispatch(counts: GenerationConcurrencyCounts, input: GenerationCreateSlotInput): GenerationDispatchDecision {
  const policy = generationConcurrencyPolicy;
  const providerRunningLimit = policy.providerRunningLimit(input);

  if (counts.userRunningTotal >= policy.userMaxRunning) {
    return { allowed: false, reason: "USER_RUNNING" };
  }
  if (counts.userRunningByType[input.type] >= policy.typeRunningLimit[input.type]) {
    return { allowed: false, reason: "TYPE_RUNNING" };
  }
  if (counts.projectRunningTotal >= policy.projectMaxRunning) {
    return { allowed: false, reason: "PROJECT" };
  }
  if (counts.providerRunningTotal >= providerRunningLimit) {
    return { allowed: false, reason: "PROVIDER_RUNNING" };
  }

  return { allowed: true };
}

export class GenerationConcurrencyService {
  async assertCanCreateJob(input: GenerationCreateSlotInput) {
    await prisma.$transaction(async (tx) => {
      await generationQueueRepository.acquireProjectSlotLock(tx, input.userId, input.projectId);
      const counts = await generationQueueRepository.countActiveJobs(tx, input);
      assertCreateLimits(counts, input);
    });
  }

  async checkCanDispatchJob(input: GenerationDispatchInput): Promise<GenerationDispatchDecision> {
    const counts = await generationQueueRepository.countActiveJobs(prisma, input);
    return evaluateDispatch(counts, input);
  }

  async getActiveCounts(input: GenerationCreateSlotInput) {
    return generationQueueRepository.countActiveJobs(prisma, input);
  }
}

export const generationConcurrencyService = new GenerationConcurrencyService();
