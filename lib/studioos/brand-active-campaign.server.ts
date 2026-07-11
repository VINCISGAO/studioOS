import "server-only";

import {
  brandCreationRateErrorMessage,
  checkBrandCampaignCreationRate
} from "@/features/abuse/brand-campaign-creation-limit.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { userRepository } from "@/features/auth/user.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { countActiveCampaignRows, resolveBrandNewCampaignGate } from "@/lib/studioos/brand-active-campaign-limit";
import { toBrandProjectRows } from "@/lib/studioos/brand-dashboard";
import { getBrandPortalOrders, getBrandPortalProjects } from "@/lib/studioos/brand-portal-data";
import type { Locale } from "@/lib/i18n";
import type { BrandNewCampaignGate } from "@/lib/studioos/brand-active-campaign-limit";

export type BrandCampaignCreationGateResult = {
  activeCount: number;
  gate: BrandNewCampaignGate;
  creationsLast24h: number;
  creationsLast10m: number;
  rateLimitCode: "rate_limit_10m" | "rate_limit_24h" | null;
};

export async function getBrandActiveCampaignCount(clientEmail: string): Promise<number> {
  const normalized = clientEmail.toLowerCase();
  const [orders, projects, prismaCount] = await Promise.all([
    getBrandPortalOrders(normalized),
    getBrandPortalProjects(normalized),
    countActiveCampaignsFromDatabase(normalized)
  ]);
  const rows = toBrandProjectRows(orders, projects, "en");
  const jsonCount = countActiveCampaignRows(rows);
  return Math.max(jsonCount, prismaCount);
}

async function countActiveCampaignsFromDatabase(clientEmail: string): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  const user = await userRepository.findByEmail(clientEmail);
  if (!user) return 0;
  return campaignRepository.countActiveForBrand(user.id);
}

export async function resolveBrandCampaignCreationGate(
  clientEmail: string
): Promise<BrandCampaignCreationGateResult> {
  const normalized = clientEmail.toLowerCase();
  const [orders, projects, rate, prismaCount] = await Promise.all([
    getBrandPortalOrders(normalized),
    getBrandPortalProjects(normalized),
    checkBrandCampaignCreationRate(normalized),
    countActiveCampaignsFromDatabase(normalized)
  ]);
  const rows = toBrandProjectRows(orders, projects, "en");
  const activeCount = Math.max(countActiveCampaignRows(rows), prismaCount);

  if (rate.blocked && rate.code) {
    return {
      activeCount,
      gate: "rate_limit",
      creationsLast10m: rate.creationsLast10m,
      creationsLast24h: rate.creationsLast24h,
      rateLimitCode: rate.code
    };
  }

  return {
    activeCount,
    gate: resolveBrandNewCampaignGate(activeCount),
    creationsLast10m: rate.creationsLast10m,
    creationsLast24h: rate.creationsLast24h,
    rateLimitCode: null
  };
}

export async function assertBrandCampaignCreationAllowed(
  clientEmail: string,
  locale: Locale
): Promise<
  | { ok: true }
  | {
      ok: false;
      gate: BrandNewCampaignGate;
      error: string;
      rateLimitCode?: "rate_limit_10m" | "rate_limit_24h";
    }
> {
  const result = await resolveBrandCampaignCreationGate(clientEmail);
  if (result.gate === "allow" || result.gate === "warn") {
    return { ok: true };
  }
  if (result.gate === "block") {
    return {
      ok: false,
      gate: "block",
      error:
        locale === "zh"
          ? "当前已达到平台建议的 3 个同时进行项目上限。请等待其中一个项目完成后再创建新的项目。"
          : "You have reached the recommended limit of 3 active campaigns. Please complete one before starting another."
    };
  }
  const code = result.rateLimitCode ?? "rate_limit_24h";
  return {
    ok: false,
    gate: "rate_limit",
    error: brandCreationRateErrorMessage(locale, code),
    rateLimitCode: code
  };
}

export function brandCampaignLimitErrorMessage(locale: Locale): string {
  return locale === "zh"
    ? "当前已达到平台建议的 3 个同时进行项目上限。请等待其中一个项目完成后再创建新的项目。"
    : "You have reached the recommended limit of 3 active campaigns. Please complete one before starting another.";
}

export function brandCampaignRateLimitErrorMessage(locale: Locale, code: "rate_limit_10m" | "rate_limit_24h"): string {
  return brandCreationRateErrorMessage(locale, code);
}
