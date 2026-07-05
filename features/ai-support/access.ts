import type { AuthUserDto } from "@/features/auth/auth.service";
import { prisma } from "@/lib/core/database/prisma";
import { appError } from "@/lib/core/errors";

export function canManageAiSupport(user: AuthUserDto) {
  return user.role === "ADMIN" || user.role === "SUPPORT" || user.role === "SYSTEM";
}

export async function resolveAiSupportCreatorId(user: AuthUserDto, requestedCreatorId?: string | null) {
  if (canManageAiSupport(user)) {
    if (!requestedCreatorId) {
      throw appError("VALIDATION_ERROR", "creator_id is required");
    }
    return requestedCreatorId;
  }

  if (!user.hasCreatorProfile && user.role !== "CREATOR") {
    throw appError("FORBIDDEN", "Only creators and support users can manage AI support settings");
  }

  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true }
  });

  if (!profile) {
    throw appError("NOT_FOUND", "Creator profile not found");
  }

  if (requestedCreatorId && requestedCreatorId !== profile.id) {
    throw appError("FORBIDDEN", "Cannot access another creator's AI support settings");
  }

  return profile.id;
}
