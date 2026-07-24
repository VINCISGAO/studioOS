import "server-only";

import type {
  CreatorVerificationReviewAction,
  CreatorVerificationReviewLog,
  CreatorVerificationStatus,
  Prisma
} from "@prisma/client";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { appError } from "@/lib/core/errors";

export type CreatorVerificationReviewLogWriteInput = {
  creatorProfileId: string;
  action: CreatorVerificationReviewAction;
  previousVerificationStatus?: CreatorVerificationStatus | null;
  newVerificationStatus?: CreatorVerificationStatus | null;
  previousCanAcceptProjects?: boolean | null;
  newCanAcceptProjects?: boolean | null;
  previousMarketplaceVisible?: boolean | null;
  newMarketplaceVisible?: boolean | null;
  adminId?: string | null;
  reason?: string | null;
  internalNotes?: string | null;
  snapshotJson: Prisma.InputJsonValue;
};

export class CreatorVerificationReviewLogRepository {
  async append(input: CreatorVerificationReviewLogWriteInput): Promise<CreatorVerificationReviewLog> {
    if (!hasDatabaseUrl()) {
      throw appError("SYSTEM_ERROR", "Database required");
    }

    return prisma.creatorVerificationReviewLog.create({
      data: {
        creatorProfileId: input.creatorProfileId,
        action: input.action,
        previousVerificationStatus: input.previousVerificationStatus,
        newVerificationStatus: input.newVerificationStatus,
        previousCanAcceptProjects: input.previousCanAcceptProjects,
        newCanAcceptProjects: input.newCanAcceptProjects,
        previousMarketplaceVisible: input.previousMarketplaceVisible,
        newMarketplaceVisible: input.newMarketplaceVisible,
        adminId: input.adminId,
        reason: input.reason,
        internalNotes: input.internalNotes,
        snapshotJson: input.snapshotJson
      } satisfies Prisma.CreatorVerificationReviewLogUncheckedCreateInput
    });
  }

  async listByCreatorProfileId(creatorProfileId: string): Promise<CreatorVerificationReviewLog[]> {
    if (!hasDatabaseUrl()) return [];

    return prisma.creatorVerificationReviewLog.findMany({
      where: { creatorProfileId },
      orderBy: { createdAt: "asc" }
    });
  }
}

export const creatorVerificationReviewLogRepository = new CreatorVerificationReviewLogRepository();

export function assertAdminCanWriteCreatorVerificationReview(user: AuthUser): void {
  PermissionService.assert(user, "admin.user.manage");
}
