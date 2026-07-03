import type {
  PerformanceSourcePlatform,
  PerformanceSourceStatus
} from "@prisma/client";
import { activityService } from "@/features/campaign/activity.service";
import { notificationService } from "@/features/notification/notification.service";
import { aiLearningEventRepository } from "@/features/ai/ai-learning-event.repository";
import { connectedChannelService } from "@/features/channels/connected-channel.service";
import {
  performanceSourceRepository,
  serializePerformanceSource
} from "@/features/attribution/performance-source.repository";
import { prisma } from "@/lib/core/database/prisma";
import type {
  PerformanceSourceSourceType,
  SerializedPerformanceSource
} from "@/features/attribution/performance-source.types";
import { asInputJson } from "@/lib/core/prisma-json";
import { putObject } from "@/lib/studioos/object-storage";

const MAX_EVIDENCE_BYTES = 50 * 1024 * 1024;

function safeFileName(name: string) {
  const cleaned = name.trim().replace(/[/\\]/g, "-").replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned || "performance-evidence";
}

function eventMetadata(input: {
  sourceId: string;
  platform: PerformanceSourcePlatform;
  url?: string | null;
  fileName?: string | null;
}) {
  return {
    source_id: input.sourceId,
    platform: input.platform,
    ...(input.url ? { url: input.url } : {}),
    ...(input.fileName ? { file_name: input.fileName } : {})
  };
}

async function notifyBrand(input: {
  userId: string;
  campaignId: string;
  title: string;
  content: string;
}) {
  await notificationService.notify({
    userId: input.userId,
    campaignId: input.campaignId,
    title: input.title,
    content: input.content,
    actionUrl: "/brand/attribution",
    email: false
  });
}

async function syncConnectedChannelForCampaign(input: {
  campaignId: string;
  platform: PerformanceSourcePlatform;
  accountUrl?: string | null;
}) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: input.campaignId },
    select: {
      creatorId: true,
      _count: {
        select: { performanceSources: true }
      }
    }
  });
  if (!campaign?.creatorId) return;

  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: campaign.creatorId },
    select: { id: true }
  });
  if (!profile) return;

  await connectedChannelService.upsert({
    creatorId: profile.id,
    platform: input.platform,
    accountUrl: input.accountUrl ?? null,
    status: "CONNECTED",
    sourceCount: campaign._count.performanceSources,
    lastSyncedAt: new Date()
  });
}

export class PerformanceSourceService {
  async listForBrand(clientEmail: string): Promise<SerializedPerformanceSource[]> {
    return performanceSourceRepository.listForBrandEmail(clientEmail);
  }

  async requireBrandCampaign(input: { campaignRef: string; clientEmail: string }) {
    const campaign = await performanceSourceRepository.findAccessibleCampaign(
      input.campaignRef,
      input.clientEmail
    );
    if (!campaign) {
      throw new Error("Campaign not found or not allowed");
    }
    return campaign;
  }

  async createSource(input: {
    campaignRef: string;
    clientEmail: string;
    platform: PerformanceSourcePlatform;
    sourceType: PerformanceSourceSourceType;
    url?: string | null;
  }) {
    const campaign = await this.requireBrandCampaign(input);
    const source = await performanceSourceRepository.create({
      campaignId: campaign.id,
      uploadedBy: campaign.brandId,
      platform: input.platform,
      sourceType: input.sourceType,
      url: input.url
    });

    await activityService.write(
      campaign.id,
      "performance_source.created",
      { userId: campaign.brandId, email: input.clientEmail, role: "brand" },
      eventMetadata({
        sourceId: source.id,
        platform: input.platform,
        url: input.url
      })
    );
    await notifyBrand({
      userId: campaign.brandId,
      campaignId: campaign.id,
      title: "Performance source added",
      content: "A new social performance source was added for attribution."
    });
    await syncConnectedChannelForCampaign({
      campaignId: campaign.id,
      platform: input.platform,
      accountUrl: input.url
    });

    return { campaign, source };
  }

  async attachEvidence(input: {
    sourceId: string;
    campaignId: string;
    brandUserId: string;
    clientEmail: string;
    platform: PerformanceSourcePlatform;
    file: File;
  }) {
    if (!input.file.size) {
      throw new Error("Evidence file is empty");
    }
    if (input.file.size > MAX_EVIDENCE_BYTES) {
      throw new Error("Evidence file must be under 50MB");
    }

    const fileName = safeFileName(input.file.name || "performance-evidence");
    const key = `performance-sources/${input.campaignId}/${Date.now()}_${fileName}`;
    const buffer = Buffer.from(await input.file.arrayBuffer());
    const mimeType = input.file.type || "application/octet-stream";
    const stored = await putObject(key, buffer, mimeType);
    const source = await performanceSourceRepository.update(input.sourceId, {
      status: "IMPORTED",
      fileKey: stored.key,
      fileName,
      mimeType,
      fileSize: input.file.size,
      errorMessage: null
    });

    await activityService.write(
      input.campaignId,
      "performance_source.imported",
      { userId: input.brandUserId, email: input.clientEmail, role: "brand" },
      eventMetadata({
        sourceId: input.sourceId,
        platform: input.platform,
        fileName
      })
    );
    await syncConnectedChannelForCampaign({
      campaignId: input.campaignId,
      platform: input.platform
    });

    return source;
  }

  async markAnalyzed(input: {
    sourceId: string;
    campaignId: string;
    brandUserId: string;
    clientEmail: string;
    platform: PerformanceSourcePlatform;
    metrics: Record<string, unknown>;
    analysis: Record<string, unknown>;
    confidence: number;
  }) {
    const source = await performanceSourceRepository.update(input.sourceId, {
      status: "ANALYZED",
      metricsJson: asInputJson(input.metrics),
      analysisJson: asInputJson(input.analysis),
      errorMessage: null,
      analyzedAt: new Date()
    });

    await activityService.write(
      input.campaignId,
      "performance_source.analyzed",
      { userId: input.brandUserId, email: input.clientEmail, role: "brand" },
      eventMetadata({
        sourceId: input.sourceId,
        platform: input.platform,
        fileName: source.fileName
      })
    );
    await notifyBrand({
      userId: input.brandUserId,
      campaignId: input.campaignId,
      title: "Performance source analyzed",
      content: "AI attribution analyzed a social performance source and updated learning signals."
    });
    await aiLearningEventRepository.append({
      eventType: "PerformanceSourceAnalyzed",
      entityType: "Campaign",
      entityId: input.campaignId,
      payload: {
        sourceId: input.sourceId,
        platform: input.platform,
        metrics: input.metrics,
        analysis: input.analysis
      },
      learningType: "performance_source",
      after: {
        metrics: input.metrics,
        analysis: input.analysis
      },
      confidence: input.confidence
    });
    await syncConnectedChannelForCampaign({
      campaignId: input.campaignId,
      platform: input.platform,
      accountUrl: source.url
    });

    return serializePerformanceSource(source);
  }

  async markFailed(input: {
    sourceId: string;
    campaignId: string;
    brandUserId: string;
    clientEmail: string;
    platform: PerformanceSourcePlatform;
    error: string;
  }) {
    const source = await performanceSourceRepository.update(input.sourceId, {
      status: "FAILED" satisfies PerformanceSourceStatus,
      errorMessage: input.error
    });
    await activityService.write(
      input.campaignId,
      "performance_source.failed",
      { userId: input.brandUserId, email: input.clientEmail, role: "brand" },
      eventMetadata({
        sourceId: input.sourceId,
        platform: input.platform,
        fileName: source.fileName
      })
    );
    await notifyBrand({
      userId: input.brandUserId,
      campaignId: input.campaignId,
      title: "Performance source failed",
      content: input.error
    });

    return serializePerformanceSource(source);
  }
}

export const performanceSourceService = new PerformanceSourceService();
