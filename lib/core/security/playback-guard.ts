/**
 * Playback signed URL hardening — Sprint 16
 */
import { prisma } from "@/lib/core/database/prisma";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import type { PlaybackTokenPayload } from "@/features/video/playback-token.types";

export async function assertPlaybackAccess(payload: PlaybackTokenPayload): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: payload.u },
    select: { id: true, role: true }
  });
  if (!user) {
    throw appError("FORBIDDEN", "Playback token user invalid");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: payload.c },
    select: { brandId: true, creatorId: true }
  });
  if (!campaign) {
    throw appError("NOT_FOUND", "Campaign not found");
  }

  if (!PermissionService.canAccessCampaign({ id: user.id, role: user.role }, campaign)) {
    throw appError("FORBIDDEN", "Not allowed to access this playback");
  }

  if (!PermissionService.can({ id: user.id, role: user.role }, "review.read")) {
    throw appError("FORBIDDEN", "Missing review.read permission");
  }
}
