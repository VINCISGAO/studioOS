import type { ConnectedChannel } from "@prisma/client";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

export type UpsertConnectedChannelInput = {
  creatorId: string;
  platform: string;
  accountUrl?: string | null;
  accountHandle?: string | null;
  status?: string;
  sourceCount?: number;
  aiLearningEnabled?: boolean;
  metadataJson?: unknown;
  lastSyncedAt?: Date | null;
};

export class ConnectedChannelService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  async listForCreator(creatorId: string): Promise<ConnectedChannel[]> {
    if (!hasDatabaseUrl()) return [];

    const creatorProfileId = await resolveCreatorProfileIdForLegacyId(creatorId);
    if (!creatorProfileId) return [];

    return prisma.connectedChannel.findMany({
      where: { creatorId: creatorProfileId },
      orderBy: [{ aiLearningEnabled: "desc" }, { platform: "asc" }]
    });
  }

  async upsert(input: UpsertConnectedChannelInput): Promise<ConnectedChannel | null> {
    if (!hasDatabaseUrl()) return null;

    const creatorProfileId = await resolveCreatorProfileIdForLegacyId(input.creatorId);
    if (!creatorProfileId) return null;
    const platform = input.platform.trim().toUpperCase();
    if (!platform) {
      throw new Error("Platform is required");
    }

    return prisma.connectedChannel.upsert({
      where: {
        creatorId_platform: {
          creatorId: creatorProfileId,
          platform
        }
      },
      create: {
        creatorId: creatorProfileId,
        platform,
        accountUrl: input.accountUrl ?? null,
        accountHandle: input.accountHandle ?? null,
        status: input.status ?? "CONNECTED",
        sourceCount: input.sourceCount ?? 0,
        aiLearningEnabled: input.aiLearningEnabled ?? true,
        metadataJson: asInputJson(input.metadataJson),
        lastSyncedAt: input.lastSyncedAt ?? null
      },
      update: {
        ...(input.accountUrl !== undefined ? { accountUrl: input.accountUrl } : {}),
        ...(input.accountHandle !== undefined ? { accountHandle: input.accountHandle } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.sourceCount !== undefined ? { sourceCount: input.sourceCount } : {}),
        ...(input.aiLearningEnabled !== undefined ? { aiLearningEnabled: input.aiLearningEnabled } : {}),
        ...(input.metadataJson !== undefined ? { metadataJson: asInputJson(input.metadataJson) } : {}),
        ...(input.lastSyncedAt !== undefined ? { lastSyncedAt: input.lastSyncedAt } : {})
      }
    });
  }

  async setAiLearningEnabled(creatorId: string, platform: string, enabled: boolean) {
    return this.upsert({
      creatorId,
      platform,
      aiLearningEnabled: enabled
    });
  }

  async markSynced(creatorId: string, platform: string, sourceCount: number) {
    return this.upsert({
      creatorId,
      platform,
      sourceCount,
      status: "CONNECTED",
      lastSyncedAt: new Date()
    });
  }
}

export const connectedChannelService = new ConnectedChannelService();
