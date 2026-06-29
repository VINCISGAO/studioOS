/**
 * Sprint 4 — Review timeline, timecoded comments, circle annotations
 * Run: npm run sprint4:verify
 */
import { PrismaClient } from "@prisma/client";
import { reviewService } from "../features/review/review.service";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let commentId: string | null = null;

  try {
    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@adbridge.test" } });
    const campaign = await prisma.campaign.findFirstOrThrow({
      where: { title: "Summer Glow Campaign" },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
    });
    const version = campaign.versions[0];
    if (!version) throw new Error("No seeded version");

    const timeline = await reviewService.getCampaignReviewTimeline(campaign.id, {
      id: brand.id,
      role: "BRAND"
    });
    checks.push({
      name: "review.timeline",
      ok: timeline.versions.length >= 1 && timeline.comments.length >= 3,
      detail: `${timeline.versions.length} versions, ${timeline.comments.length} comments`
    });

    const playback = await reviewService.getVersion(version.id, { id: brand.id, role: "BRAND" });
    checks.push({
      name: "review.playback_urls",
      ok: Boolean(playback.playback.mp4),
      detail: playback.playback.hls ? "mp4+hls" : "mp4"
    });

    const created = await reviewService.createCommentForUser(
      version.id,
      { id: brand.id, role: "BRAND" },
      {
        time_seconds: 12.5,
        comment: "Sprint 4 verify — tighten logo placement.",
        annotation: {
          type: "CIRCLE",
          x: 0.35,
          y: 0.4,
          width: 0.18,
          height: 0.18,
          color: "#FF4D4F"
        }
      }
    );
    commentId = created.id;
    checks.push({
      name: "comment.create_with_circle",
      ok: created.annotation?.type === "CIRCLE",
      detail: created.id
    });

    const listed = await reviewService.listComments(version.id, { id: brand.id, role: "BRAND" });
    checks.push({
      name: "comment.list",
      ok: listed.some((c) => c.id === commentId),
      detail: `${listed.length} comments`
    });

    const updatedVersion = await prisma.campaignVersion.findUniqueOrThrow({ where: { id: version.id } });
    checks.push({
      name: "review.status_reviewing",
      ok: updatedVersion.reviewStatus === "REVIEWING",
      detail: updatedVersion.reviewStatus
    });
  } catch (error) {
    checks.push({
      name: "sprint4.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (commentId) {
      await prisma.reviewAnnotation.deleteMany({ where: { commentId } });
      await prisma.reviewComment.delete({ where: { id: commentId } });
    }
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 4 verification\n");
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
