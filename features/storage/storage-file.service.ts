import type { StorageFile } from "@prisma/client";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

export type RecordStorageFileInput = {
  userId?: string | null;
  campaignId?: string | null;
  portfolioWorkId?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileKey: string;
  publicUrl?: string | null;
  mimeType: string;
  fileSize: number | bigint;
  provider?: string | null;
};

export class StorageFileService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  record(input: RecordStorageFileInput): Promise<StorageFile | null> {
    if (!hasDatabaseUrl()) return Promise.resolve(null);

    return prisma.storageFile.create({
      data: {
        userId: input.userId ?? null,
        campaignId: input.campaignId ?? null,
        portfolioWorkId: input.portfolioWorkId ?? null,
        fileName: input.fileName ?? null,
        fileType: input.fileType ?? null,
        fileKey: input.fileKey,
        publicUrl: input.publicUrl ?? null,
        mimeType: input.mimeType,
        fileSize: BigInt(input.fileSize),
        provider: input.provider ?? "r2"
      }
    });
  }

  async recordCreatorAvatar(
    legacyCreatorId: string,
    input: Omit<RecordStorageFileInput, "userId" | "fileType">
  ) {
    if (!hasDatabaseUrl()) return null;

    const profileId = await resolveCreatorProfileIdForLegacyId(legacyCreatorId);
    if (!profileId) return null;

    const profile = await prisma.creatorProfile.findUnique({
      where: { id: profileId },
      select: { userId: true }
    });
    if (!profile) return null;

    return this.record({
      ...input,
      userId: profile.userId,
      fileType: "USER_AVATAR"
    });
  }

  async recordBrandAvatar(
    brandProfileId: string,
    input: Omit<RecordStorageFileInput, "userId" | "fileType">
  ) {
    if (!hasDatabaseUrl()) return null;

    const profile = await prisma.brandProfile.findUnique({
      where: { id: brandProfileId },
      select: { userId: true }
    });
    if (!profile) return null;

    return this.record({
      ...input,
      userId: profile.userId,
      fileType: "BRAND_AVATAR"
    });
  }
}

export const storageFileService = new StorageFileService();
