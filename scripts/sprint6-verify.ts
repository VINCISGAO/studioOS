/**
 * Sprint 6 — Chunk upload, video worker queue, HLS + watermark
 * Run: npm run sprint6:verify
 */
import { PrismaClient } from "@prisma/client";
import { createChunkSession, saveChunk, mergeChunks, deleteChunkSession } from "../features/video/video-upload.store";
import { videoRepository } from "../features/video/video.repository";
import { videoWorkerService } from "../features/video/video-worker.service";
import { saveVideoVersionFromBuffer } from "../lib/studioos/video-version-upload";
import { versionProcessingService } from "../features/video/version-processing.service";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let campaignId: string | null = null;
  let uploadId: string | null = null;
  let versionId: string | null = null;
  let jobId: string | null = null;

  try {
    const creator = await prisma.user.findUniqueOrThrow({ where: { email: "creator.nova@adbridge.test" } });
    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@adbridge.test" } });

    const campaign = await prisma.campaign.create({
      data: {
        brandId: brand.id,
        creatorId: creator.id,
        title: "Sprint 6 Verify Campaign",
        budget: 2400,
        deadline: new Date(Date.now() + 12 * 86400000),
        platform: "TikTok",
        aspectRatio: "9:16",
        status: "PRODUCING",
        reviewRound: 0,
        currentVersion: 0
      }
    });
    campaignId = campaign.id;

    const payload = Buffer.from("sprint6-demo-video-bytes");
    const session = await createChunkSession({
      campaignId: campaign.id,
      fileName: "review-v1.mp4",
      mimeType: "video/mp4",
      totalSize: payload.length,
      uploadedBy: creator.id
    });
    uploadId = session.id;

    checks.push({
      name: "upload.init",
      ok: session.totalChunks >= 1,
      detail: `${session.totalChunks} chunk(s)`
    });

    await saveChunk(session.id, 0, payload);
    const merged = await mergeChunks(session.id);
    checks.push({
      name: "upload.merge",
      ok: merged.length === payload.length,
      detail: `${merged.length} bytes`
    });

    const versionNumber = await videoRepository.getNextVersionNumber(campaign.id);
    const saved = await saveVideoVersionFromBuffer({
      campaignId: campaign.id,
      versionNumber,
      buffer: merged,
      fileName: "review-v1.mp4"
    });
    if (!saved.ok) throw new Error(saved.error);

    const version = await videoRepository.createVersion({
      campaignId: campaign.id,
      versionNumber,
      uploadedBy: creator.id,
      videoKey: saved.file_key,
      videoUrl: saved.url
    });
    versionId = version.id;

    const job = await videoWorkerService.enqueueTranscode({
      campaignId: campaign.id,
      versionId: version.id,
      videoUrl: saved.url,
      watermark: true
    });
    jobId = job.id;

    const processed = await videoWorkerService.processJob(job.id);
    checks.push({
      name: "worker.process",
      ok: processed.ok,
      detail: processed.ok ? version.id : processed.error
    });

    const ready = await prisma.campaignVersion.findUniqueOrThrow({ where: { id: version.id } });
    checks.push({
      name: "version.ready",
      ok: ready.status === "READY" && ready.reviewStatus === "READY",
      detail: `${ready.status}/${ready.reviewStatus}`
    });
    checks.push({
      name: "version.hls",
      ok: Boolean(ready.hlsUrl),
      detail: ready.hlsUrl ? "hls set" : "missing"
    });
    checks.push({
      name: "version.watermark",
      ok: ready.watermark === true,
      detail: String(ready.watermark)
    });

    const status = await versionProcessingService.getProcessingStatus(version.id, {
      id: brand.id,
      role: "BRAND"
    });
    checks.push({
      name: "processing.status",
      ok: status.job?.status === "SUCCESS",
      detail: status.job?.status ?? "none"
    });

    await deleteChunkSession(session.id);
    uploadId = null;
  } catch (error) {
    checks.push({
      name: "sprint6.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (uploadId) await deleteChunkSession(uploadId).catch(() => undefined);
    if (campaignId) {
      await prisma.workerLog.deleteMany({ where: { jobId: jobId ?? undefined } });
      if (jobId) await prisma.videoJob.deleteMany({ where: { id: jobId } });
      if (versionId) {
        await prisma.reviewAnnotation.deleteMany({ where: { versionId } });
        await prisma.reviewComment.deleteMany({ where: { versionId } });
        await prisma.campaignVersion.deleteMany({ where: { id: versionId } });
      }
      await prisma.activityLog.deleteMany({ where: { campaignId } });
      await prisma.campaign.delete({ where: { id: campaignId } });
    }
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 6 verification\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
