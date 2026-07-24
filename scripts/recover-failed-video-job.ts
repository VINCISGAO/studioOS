/**
 * Recover a failed Canvas VIDEO job from Seedance after storage upload failure.
 *
 * Usage:
 *   npm run canvas:recover-failed-video -- --list
 *   npm run canvas:recover-failed-video -- --job-id <uuid>
 *   npm run canvas:recover-failed-video -- --node-id <canvas_node_id>
 *   npm run canvas:recover-failed-video -- --latest --project-id <uuid>
 *
 * Options:
 *   --dry-run   Fetch Seedance task + report only (no R2 upload / billing / DB writes)
 *   --force     Recover even when job already SUCCEEDED (re-upload + patch node)
 */
import type { GenerationJob, Prisma } from "@prisma/client";
import { authService } from "@/features/auth/auth.service";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { finalizeCanvasGenerationJob } from "@/features/canvas/canvas-generation-learning";
import { creditGenerationBillingService } from "@/features/credit-wallet/credit-generation-billing.service";
import { creditWalletRepository } from "@/features/credit-wallet/credit-wallet.repository";
import { VIDEO_JOB_EVENT_TYPES } from "@/features/video-engine/video-job-audit.types";
import { videoJobAuditService } from "@/features/video-engine/video-job-audit.service";
import {
  pickSeedanceVideoUrl,
  seedanceDownloadVideo,
  seedanceGetTask,
  SeedanceApiError
} from "@/lib/canvas/seedance-client";
import { resolveVideoNodeReadyDimensions } from "@/lib/canvas/video-node-ready-design";
import { prisma } from "@/lib/core/database/prisma";
import { hasSeedance } from "@/lib/core/config/ai";

type CliOptions = {
  list: boolean;
  dryRun: boolean;
  force: boolean;
  jobId?: string;
  nodeId?: string;
  projectId?: string;
  latest: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    list: false,
    dryRun: false,
    force: false,
    latest: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--list") options.list = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--latest") options.latest = true;
    else if (arg === "--job-id") options.jobId = argv[++index]?.trim();
    else if (arg === "--node-id") options.nodeId = argv[++index]?.trim();
    else if (arg === "--project-id") options.projectId = argv[++index]?.trim();
  }

  return options;
}

function usage() {
  console.log(`Recover failed Canvas video jobs from Seedance

Commands:
  npm run canvas:recover-failed-video -- --list
  npm run canvas:recover-failed-video -- --job-id <uuid>
  npm run canvas:recover-failed-video -- --node-id <canvas_node_id>
  npm run canvas:recover-failed-video -- --latest --project-id <uuid>

Options:
  --dry-run   Inspect Seedance only
  --force     Re-run recovery for an already SUCCEEDED job
`);
}

async function listRecoverableJobs(limit = 10) {
  const jobs = await prisma.generationJob.findMany({
    where: {
      type: "VIDEO",
      status: "FAILED",
      OR: [
        { errorMessage: { contains: "R2 upload", mode: "insensitive" } },
        { errorCode: { contains: "R2", mode: "insensitive" } },
        { provider: "seedance" }
      ]
    },
    orderBy: { completedAt: "desc" },
    take: limit,
    select: {
      id: true,
      nodeId: true,
      providerTaskId: true,
      creativeProjectId: true,
      errorMessage: true,
      completedAt: true,
      prompt: true
    }
  });

  if (!jobs.length) {
    console.log("No recent failed VIDEO jobs found.");
    return;
  }

  console.log("Recent recoverable VIDEO jobs:\n");
  for (const job of jobs) {
    console.log(
      [
        `job=${job.id}`,
        `node=${job.nodeId ?? "—"}`,
        `project=${job.creativeProjectId}`,
        `task=${job.providerTaskId ?? "—"}`,
        `completed=${job.completedAt?.toISOString() ?? "—"}`,
        `error=${job.errorMessage ?? "—"}`
      ].join("\n  ")
    );
    console.log(`  prompt=${job.prompt.slice(0, 120)}${job.prompt.length > 120 ? "…" : ""}\n`);
  }
}

async function resolveProviderTaskId(job: GenerationJob) {
  if (job.providerTaskId?.trim()) return job.providerTaskId.trim();
  const attempt = await prisma.generationJobAttempt.findFirst({
    where: { generationJobId: job.id, providerTaskId: { not: null } },
    orderBy: { attemptNumber: "desc" }
  });
  return attempt?.providerTaskId?.trim() ?? null;
}

async function findTargetJob(options: CliOptions) {
  if (options.jobId) {
    return prisma.generationJob.findUnique({ where: { id: options.jobId } });
  }

  if (options.nodeId) {
    return prisma.generationJob.findFirst({
      where: { nodeId: options.nodeId, type: "VIDEO", status: "FAILED" },
      orderBy: { completedAt: "desc" }
    });
  }

  if (options.latest && options.projectId) {
    return prisma.generationJob.findFirst({
      where: {
        creativeProjectId: options.projectId,
        type: "VIDEO",
        status: "FAILED"
      },
      orderBy: { completedAt: "desc" }
    });
  }

  return null;
}

function readAspectRatio(nodeData: Record<string, unknown>) {
  const generationParameters = nodeData.generationParameters;
  if (!isRecord(generationParameters)) return undefined;
  return typeof generationParameters.aspectRatio === "string"
    ? generationParameters.aspectRatio
    : undefined;
}

async function patchCanvasNodeForRecoveredVideo(input: {
  nodeId: string;
  assetId: string;
  jobId: string;
}) {
  const node = await prisma.canvasNode.findUnique({ where: { id: input.nodeId } });
  if (!node) {
    console.warn(`Canvas node ${input.nodeId} not found — asset saved, refresh canvas manually.`);
    return;
  }

  const data = isRecord(node.data) ? { ...node.data } : {};
  const readyDimensions = resolveVideoNodeReadyDimensions({
    aspectRatio: readAspectRatio(data)
  });
  const nextData: Record<string, unknown> = {
    ...data,
    progress: 100,
    status: "ready",
    assetId: input.assetId,
    url: `/api/canvas/assets/${input.assetId}/preview`,
    jobId: input.jobId
  };
  delete nextData.error;

  await prisma.canvasNode.update({
    where: { id: input.nodeId },
    data: {
      type: "video",
      width: readyDimensions.width,
      height: readyDimensions.height,
      data: nextData as Prisma.InputJsonValue
    }
  });

  await prisma.creativeCanvas.update({
    where: { id: node.canvasId },
    data: { version: { increment: 1 } }
  });
}

async function settleRecoveredJobBilling(job: GenerationJob) {
  const actualCredits = job.estimatedCredits;
  if (job.creditReservationId) {
    const existing = await creditWalletRepository.findReservationById(job.creditReservationId);
    if (existing?.status === "ACTIVE") {
      await creditGenerationBillingService.finalizeSuccess(job.creditReservationId, actualCredits, {
        campaignId: job.campaignId,
        generationJobId: job.id
      });
      return;
    }
  }

  const parameters = isRecord(job.input) ? job.input : {};
  const { reservation } = await creditGenerationBillingService.reserveForGeneration({
    userId: job.ownerId,
    type: "VIDEO",
    model: job.model,
    parameters,
    idempotencyKey: `recover:${job.id}`,
    generationJobId: job.id,
    campaignId: job.campaignId
  });

  await creditGenerationBillingService.finalizeSuccess(reservation.id, actualCredits, {
    campaignId: job.campaignId,
    generationJobId: job.id
  });
}

async function recoverJob(job: GenerationJob, options: CliOptions) {
  if (job.type !== "VIDEO") {
    throw new Error(`Job ${job.id} is not a VIDEO job`);
  }

  if (job.status === "SUCCEEDED" && job.outputAssetId && !options.force) {
    console.log(`Job ${job.id} already succeeded with asset ${job.outputAssetId}. Use --force to re-upload.`);
    return;
  }

  if (job.status !== "FAILED" && !(options.force && job.status === "SUCCEEDED")) {
    throw new Error(`Job ${job.id} status is ${job.status}; only FAILED jobs are recoverable`);
  }

  if (job.provider !== "seedance") {
    throw new Error(`Job ${job.id} provider is ${job.provider}; only seedance jobs are supported`);
  }

  if (!hasSeedance()) {
    throw new Error("SEEDANCE_API_KEY is not configured");
  }

  const providerTaskId = await resolveProviderTaskId(job);
  if (!providerTaskId) {
    throw new Error(`Job ${job.id} has no providerTaskId — cannot query Seedance`);
  }

  console.log(`Inspecting Seedance task ${providerTaskId}…`);
  const task = await seedanceGetTask(providerTaskId);
  if (task.status !== "completed") {
    throw new Error(`Seedance task ${providerTaskId} status=${task.status}; expected completed`);
  }

  const videoUrl = pickSeedanceVideoUrl(task);
  if (!videoUrl) {
    throw new Error(`Seedance task ${providerTaskId} has no downloadable video URL`);
  }

  const expiresAt = task.data?.video_expires_at;
  if (expiresAt) {
    const expiry = new Date(expiresAt);
    if (Number.isFinite(expiry.getTime()) && expiry.getTime() < Date.now()) {
      throw new Error(`Seedance video URL expired at ${expiresAt}`);
    }
    console.log(`Seedance URL expires at ${expiresAt}`);
  }

  console.log(`Seedance video URL ready (${Math.round((task.data?.processing_time ?? 0) as number)}s processing)`);

  if (options.dryRun) {
    console.log("Dry run — skipping download, upload, billing, and canvas patch.");
    return;
  }

  const owner = await authService.getUserById(job.ownerId);
  if (!owner) {
    throw new Error(`Owner ${job.ownerId} not found`);
  }

  console.log("Downloading video from Seedance…");
  const downloaded = await seedanceDownloadVideo(videoUrl);
  console.log(`Downloaded ${downloaded.buffer.length} bytes (${downloaded.mimeType})`);

  console.log("Uploading to object storage…");
  const asset = await canvasAssetService.saveGeneratedVideoBuffer(job.creativeProjectId, owner, {
    buffer: downloaded.buffer,
    mimeType: downloaded.mimeType,
    fileName: "canvas-recovered-video.mp4",
    metadata: {
      prompt: job.prompt,
      model: job.model,
      seedanceTaskId: providerTaskId,
      generationJobId: job.id,
      nodeId: job.nodeId,
      provider: job.provider,
      recoveredAt: new Date().toISOString(),
      videoExpiresAt: expiresAt ?? null
    }
  });

  await prisma.generationJob.update({
    where: { id: job.id },
    data: {
      status: "SUCCEEDED",
      progress: 100,
      outputAssetId: asset.id,
      actualCredits: job.estimatedCredits,
      errorCode: null,
      errorMessage: null,
      completedAt: new Date()
    }
  });

  await videoJobAuditService.writeEvent({
    generationJobId: job.id,
    eventType: VIDEO_JOB_EVENT_TYPES.STORAGE_SAVED,
    toStatus: "SUCCEEDED",
    progress: 100,
    payload: {
      outputAssetId: asset.id,
      recovered: true,
      providerTaskId
    }
  });

  if (job.nodeId) {
    console.log(`Patching canvas node ${job.nodeId}…`);
    await patchCanvasNodeForRecoveredVideo({
      nodeId: job.nodeId,
      assetId: asset.id,
      jobId: job.id
    });
  }

  console.log("Settling billing…");
  await settleRecoveredJobBilling(job);
  await finalizeCanvasGenerationJob(owner, job.id, job.ownerId);

  console.log("\nRecovery complete.");
  console.log(`  jobId:   ${job.id}`);
  console.log(`  assetId: ${asset.id}`);
  console.log(`  preview: ${asset.url}`);
  if (job.nodeId) {
    console.log(`  nodeId:  ${job.nodeId}`);
  }
  console.log("\nRefresh the Canvas page to see the recovered video.");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.list) {
    await listRecoverableJobs();
    return;
  }

  const hasTarget =
    Boolean(options.jobId) ||
    Boolean(options.nodeId) ||
    (options.latest && Boolean(options.projectId));

  if (!hasTarget) {
    usage();
    process.exitCode = 1;
    return;
  }

  const job = await findTargetJob(options);
  if (!job) {
    throw new Error("No matching failed VIDEO job found");
  }

  await recoverJob(job, options);
}

main()
  .catch((error) => {
    if (error instanceof SeedanceApiError) {
      console.error(`Seedance error (${error.code}): ${error.message}`);
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
