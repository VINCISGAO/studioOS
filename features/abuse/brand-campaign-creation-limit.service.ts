import "server-only";

import type { BrandCampaignMemory, BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { userRepository } from "@/features/auth/user.repository";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import {
  BRAND_CAMPAIGN_CREATION_LIMIT_10M,
  BRAND_CAMPAIGN_CREATION_LIMIT_24H,
  TEN_MINUTES_MS,
  TWENTY_FOUR_HOURS_MS
} from "@/lib/studioos/brand-abuse-policy";

export type BrandCreationRateCheck = {
  creationsLast10m: number;
  creationsLast24h: number;
  blocked: boolean;
  code: "rate_limit_10m" | "rate_limit_24h" | null;
};

type RecentCampaignRow = {
  status: string;
  createdAt: Date;
  description: string | null;
  campaignMemoryJson: unknown;
  productionBrief: unknown;
};

function readCampaignMemory(raw: unknown): BrandCampaignMemory {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  return raw as BrandCampaignMemory;
}

function readProductionBrief(raw: unknown): BrandProductionBrief {
  if (!raw || typeof raw !== "object") {
    return { legacy_project_id: "", product: { name: "", url: "", category: "" } };
  }
  return raw as BrandProductionBrief;
}

/** Empty wizard opens should not consume anti-abuse quota. */
export function countsTowardBrandCampaignCreationLimit(campaign: RecentCampaignRow): boolean {
  if (campaign.status !== "DRAFT") {
    return true;
  }

  const memory = readCampaignMemory(campaign.campaignMemoryJson);
  if (memory.wizard?.ephemeral !== true) {
    return true;
  }

  const step = memory.wizard?.step ?? 1;
  const completedSteps = memory.wizard?.completed_steps?.length ?? 0;
  if (step > 1 || completedSteps > 0) {
    return true;
  }

  const brief = readProductionBrief(campaign.productionBrief);
  const hasBriefContent = Boolean(
    brief.product?.name?.trim() ||
      brief.product?.url?.trim() ||
      brief.product?.category?.trim() ||
      campaign.description?.trim()
  );

  return hasBriefContent;
}

async function resolveBrandUserId(email: string): Promise<string | null> {
  const user = await userRepository.findByEmail(email.trim().toLowerCase());
  return user?.id ?? null;
}

export async function checkBrandCampaignCreationRate(
  clientEmail: string
): Promise<BrandCreationRateCheck> {
  const brandId = await resolveBrandUserId(clientEmail);
  if (!brandId || !hasDatabaseUrl()) {
    return { creationsLast10m: 0, creationsLast24h: 0, blocked: false, code: null };
  }

  const now = Date.now();
  const since10m = new Date(now - TEN_MINUTES_MS);
  const since24h = new Date(now - TWENTY_FOUR_HOURS_MS);

  const recent = await prisma.campaign.findMany({
    where: {
      brandId,
      deletedAt: null,
      createdAt: { gte: since24h }
    },
    select: {
      status: true,
      createdAt: true,
      description: true,
      campaignMemoryJson: true,
      productionBrief: true
    }
  });

  const meaningful = recent.filter(countsTowardBrandCampaignCreationLimit);
  const creationsLast24h = meaningful.length;
  const creationsLast10m = meaningful.filter((campaign) => campaign.createdAt >= since10m).length;

  if (creationsLast10m >= BRAND_CAMPAIGN_CREATION_LIMIT_10M) {
    return { creationsLast10m, creationsLast24h, blocked: true, code: "rate_limit_10m" };
  }
  if (creationsLast24h >= BRAND_CAMPAIGN_CREATION_LIMIT_24H) {
    return { creationsLast10m, creationsLast24h, blocked: true, code: "rate_limit_24h" };
  }

  return { creationsLast10m, creationsLast24h, blocked: false, code: null };
}

export function brandCreationRateErrorMessage(
  locale: "en" | "zh",
  code: "rate_limit_10m" | "rate_limit_24h"
): string {
  if (locale === "zh") {
    return code === "rate_limit_10m"
      ? "创建过于频繁。为保障平台服务质量，10 分钟内最多创建 5 个有效项目。请稍后再试。"
      : "已达到今日创建建议上限。24 小时内最多创建 12 个有效项目，请明天再试或先完成进行中的项目。";
  }
  return code === "rate_limit_10m"
    ? "You are creating projects too quickly. For service quality, the limit is 5 meaningful new projects per 10 minutes. Please wait and try again."
    : "You have reached today’s recommended creation limit — up to 12 meaningful new projects per 24 hours. Try again tomorrow or finish in-progress work first.";
}
