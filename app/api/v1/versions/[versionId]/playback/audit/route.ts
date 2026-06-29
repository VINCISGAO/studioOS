import { z } from "zod";
import { playbackAuditService } from "@/features/video/playback-audit.service";
import { reviewRepository } from "@/features/review/review.repository";
import { PermissionService } from "@/features/auth/permission.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

const bodySchema = z.object({
  action: z.enum(["play", "pause", "seek", "download"]),
  time_seconds: z.number().min(0).optional()
});

type Params = { params: Promise<{ versionId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { versionId } = await params;
    const version = await reviewRepository.findVersion(versionId);
    if (!version) throw appError("NOT_FOUND", "Version not found");
    if (!PermissionService.canAccessCampaign(user, version.campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this version");
    }
    PermissionService.assert(user, "review.read");

    const json = bodySchema.parse(await request.json());
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
    const device = request.headers.get("user-agent");

    await playbackAuditService.log({
      campaignId: version.campaignId,
      versionId,
      userId: user.id,
      action: json.action,
      timeSeconds: json.time_seconds,
      ip,
      device
    });

    return apiSuccess({ logged: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
