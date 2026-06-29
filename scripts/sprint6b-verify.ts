/**
 * Sprint 6b — Phase 6 Video Engine completion (Signed URL, QA, worker, storage)
 * Run: npm run sprint6b:verify
 */
import { PrismaClient } from "@prisma/client";
import { createChunkSession, saveChunk, mergeChunks, deleteChunkSession } from "../features/video/video-upload.store";
import { videoRepository } from "../features/video/video.repository";
import { videoWorkerService } from "../features/video/video-worker.service";
import { saveVideoVersionFromBuffer } from "../lib/studioos/video-version-upload";
import { versionProcessingService } from "../features/video/version-processing.service";
import {
  buildVersionPlayback,
  createPlaybackToken,
  verifyPlaybackToken
} from "../features/video/playback-token.service";
import { playbackAuditService } from "../features/video/playback-audit.service";
import { videoConfig } from "../lib/core/config/video";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let campaignId: string | null = null;
  let uploadId: string | null = null;
  let versionId: string | null = null;
  let jobId: string | null = null;

  try {
    checks.push({
      name: "config.enforce_hls",
      ok: videoConfig.enforceHlsOnly,
      detail: String(videoConfig.enforceHlsOnly)
    });

    const creator = await prisma.user.findUniqueOrThrow({ where: { email: "creator.nova@adbridge.test" } });
    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@adbridge.test" } });

    const campaign = await prisma.campaign.create({
      data: {
        brandId: brand.id,
        creatorId: creator.id,
        title: "Sprint 6b Verify Campaign",
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

    const payload = Buffer.from("sprint6b-demo-video-bytes");
    const session = await createChunkSession({
      campaignId: campaign.id,
      fileName: "review-v1.mp4",
      mimeType: "video/mp4",
      totalSize: payload.length,
      uploadedBy: creator.id
    });
    uploadId = session.id;
    await saveChunk(session.id, 0, payload);
    await mergeChunks(session.id);

    const versionNumber = await videoRepository.getNextVersionNumber(campaign.id);
    const saved = await saveVideoVersionFromBuffer({
      campaignId: campaign.id,
      versionNumber,
      buffer: payload,
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
      name: "version.hls_storage",
      ok: Boolean(ready.hlsUrl),
      detail: ready.hlsUrl ?? "missing"
    });

    const playback = buildVersionPlayback(ready, brand.id);
    checks.push({
      name: "playback.signed_hls",
      ok: Boolean(playback.hls?.includes("/api/v1/playback/")) && playback.mp4 === null,
      detail: playback.hls ?? "none"
    });
    checks.push({
      name: "playback.no_mp4",
      ok: playback.mp4 === null,
      detail: "ADR-002"
    });

    const token = createPlaybackToken({
      versionId: version.id,
      userId: brand.id,
      campaignId: campaign.id
    });
    checks.push({
      name: "playback.token",
      ok: Boolean(verifyPlaybackToken(token)),
      detail: "signed token valid"
    });

    await playbackAuditService.log({
      campaignId: campaign.id,
      versionId: version.id,
      userId: brand.id,
      action: "play",
      timeSeconds: 0
    });
    const audit = await prisma.activityLog.findFirst({
      where: { campaignId: campaign.id, action: "playback.play" },
      orderBy: { createdAt: "desc" }
    });
    checks.push({
      name: "playback.audit",
      ok: Boolean(audit),
      detail: audit?.action
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
    checks.push({
      name: "processing.playback_signed",
      ok: Boolean(status.playback.hls?.includes("/api/v1/playback/")) && status.playback.mp4 === null,
      detail: status.playback.hls ? "signed" : "missing"
    });

    await deleteChunkSession(session.id);
    uploadId = null;
  } catch (error) {
    checks.push({
      name: "sprint6b.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (uploadId) await deleteChunkSession(uploadId).catch(() => undefined);
    if (campaignId) {
      await prisma.activityLog.deleteMany({ where: { campaignId } });
      await prisma.workerLog.deleteMany({ where: { jobId: jobId ?? undefined } });
      if (jobId) await prisma.videoJob.deleteMany({ where: { id: jobId } });
      if (versionId) {
        await prisma.reviewAnnotation.deleteMany({ where: { versionId } });
        await prisma.reviewComment.deleteMany({ where: { versionId } });
        await prisma.campaignVersion.deleteMany({ where: { id: versionId } });
      }
      await prisma.campaign.delete({ where: { id: campaignId } });
    }
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 6b verification (Phase 6 Video Engine)\n");
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
