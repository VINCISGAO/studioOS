import { AI_MATCHING_WEIGHTS } from "@/lib/studioos/ai-matching-policy";
import { aiLearningEventRepository } from "@/features/ai/ai-learning-event.repository";
import { activityService } from "@/features/campaign/activity.service";
import { memoryRepository } from "@/features/memory/memory.repository";
import { relationshipDnaService } from "@/features/memory/relationship-dna.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { isCampaignEscrowFunded } from "@/features/payment/escrow-guards";
import type { BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { notificationService } from "@/features/notification/notification.service";
import { getAppBaseUrl } from "@/lib/app-url";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { Campaign, CreatorProfile } from "@prisma/client";

type CreatorMatchingMemory = {
  minAcceptBudgetUsd: number | null;
  budgetDeclines: number;
  declineTotal: number;
};

type FrozenMatchingBrief = {
  budget: number;
  platform: string;
  text: string;
};

export type CreatorMatchResult = {
  creatorProfileId: string;
  userId: string;
  displayName: string;
  headline: string | null;
  matchScore: number;
  reasons: string[];
  availability: string;
  relationshipBoost?: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function parseBudgetRange(raw?: string | null) {
  if (!raw) return 200;
  const values = raw
    .split(/[-–—]/)
    .map((part) => Number(part.replace(/[^\d.]/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!values.length) return 200;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function frozenBriefForMatching(campaign: Campaign): FrozenMatchingBrief | null {
  const brief = (campaign.productionBrief ?? {}) as BrandProductionBrief;
  const frozen = brief.frozen_production_brief;
  if (frozen?.full_text?.trim()) {
    return {
      budget: parseBudgetRange(frozen.budget_range),
      platform: frozen.platforms ?? "",
      text: [
        frozen.title,
        frozen.core_idea,
        frozen.hook,
        frozen.story,
        frozen.tone,
        frozen.visual_style,
        frozen.shot_list.join(" "),
        frozen.cta,
        frozen.recommended_creator_type,
        frozen.expected_outcome,
        frozen.full_text
      ]
        .filter(Boolean)
        .join(" ")
    };
  }

  const fallbackText = [
    campaign.title,
    campaign.description,
    brief.product?.name,
    brief.product?.category,
    brief.objective?.type,
    brief.objective?.notes,
    brief.audience,
    brief.goal,
    brief.notes,
    JSON.stringify(brief.questionnaire ?? {}),
    JSON.stringify(brief.confirmed_brief ?? {}),
    JSON.stringify(brief.style ?? {})
  ]
    .filter(Boolean)
    .join(" ");

  if (!fallbackText.trim()) return null;

  return {
    budget: parseBudgetRange(brief.budget?.range ?? String(campaign.budget)),
    platform: campaign.platform ?? "",
    text: fallbackText
  };
}

function resolveLegacyProjectId(campaign: Campaign) {
  const brief = (campaign.productionBrief ?? {}) as BrandProductionBrief;
  return brief.legacy_project_id ?? campaign.id;
}

function baseScore(
  brief: FrozenMatchingBrief,
  profile: CreatorProfile & { user: { email: string; id: string } },
  memory: CreatorMatchingMemory
) {
  const budget = brief.budget;
  const minBudget = memory.minAcceptBudgetUsd ?? (profile.minBudget ? Number(profile.minBudget) : null);
  const maxBudget = profile.maxBudget ? Number(profile.maxBudget) : null;

  if (minBudget && budget < minBudget) return null;
  if (maxBudget && budget > maxBudget * 1.5) return null;
  if (profile.availability === "OFFLINE" || profile.availability === "VACATION") return null;

  const dna = (profile.creatorDnaJson ?? {}) as {
    style?: string[];
    strength?: string[];
    tools?: string[];
    editingSoftware?: string[];
  };
  const styles = Array.isArray(dna.style) ? dna.style : [];
  const strengths = Array.isArray(dna.strength) ? dna.strength : [];
  const tools = [
    ...(Array.isArray(dna.tools) ? dna.tools : []),
    ...(Array.isArray(dna.editingSoftware) ? dna.editingSoftware : [])
  ];
  const platform = normalize(brief.platform);
  const reasons: string[] = [];
  let score = 0;

  if (platform && strengths.some((s) => normalize(s).includes(platform) || platform.includes(normalize(s)))) {
    score += AI_MATCHING_WEIGHTS.platform;
    reasons.push(`Platform fit: ${brief.platform}`);
  }

  if (styles.some((s) => normalize(brief.text).includes(normalize(s)))) {
    score += AI_MATCHING_WEIGHTS.category;
    reasons.push(`Style alignment: ${styles.join(", ")}`);
  }

  if (tools.length) {
    score += AI_MATCHING_WEIGHTS.toolMatch;
    reasons.push(`Creator tools: ${tools.slice(0, 3).join(", ")}`);
  }

  score += Math.round((profile.aiQualityScore / 100) * AI_MATCHING_WEIGHTS.aiTagMax);
  reasons.push(`AI quality score: ${profile.aiQualityScore}`);

  score += Math.round((Number(profile.completionRate) / 100) * 10);
  if (profile.completedCampaigns > 0) {
    score += AI_MATCHING_WEIGHTS.profileCompleteBonus;
    reasons.push(`${profile.completedCampaigns} completed campaigns`);
  }

  const declinePenalty = Math.min(12, Math.round(memory.budgetDeclines * 2 + memory.declineTotal * 0.5));
  if (declinePenalty > 0) {
    score -= declinePenalty;
    reasons.push(`AI memory: recent decline friction -${declinePenalty}`);
  }

  score += AI_MATCHING_WEIGHTS.activeStatusBonus;

  return { score, reasons };
}

export class MatchingService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async matchCreatorsForCampaign(campaignId: string, user: AuthUser, limit = 6): Promise<CreatorMatchResult[]> {
    this.assertDb();
    PermissionService.assert(user, "campaign.read");

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }

    const allowedStatuses = new Set(["MATCHING", "INVITATION_SENT"]);
    if (!allowedStatuses.has(campaign.status)) {
      throw appError("INVALID_TRANSITION", "Matching is available only after escrow payment is funded");
    }
    if (!(await isCampaignEscrowFunded(campaignId))) {
      throw appError("INVALID_TRANSITION", "Escrow must be funded before matching creators");
    }
    const matchingBrief = frozenBriefForMatching(campaign);
    if (!matchingBrief) {
      throw appError("VALIDATION_ERROR", "Frozen Production Brief is required before matching");
    }

    const profiles = await prisma.creatorProfile.findMany({
      where: {
        availability: { in: ["AVAILABLE", "BUSY"] },
        user: { role: "CREATOR", deletedAt: null, status: "ACTIVE" }
      },
      include: { user: true }
    });

    const creatorUserIds = profiles.map((profile) => profile.userId);
    const [matchingFacts, relationshipBoosts] = await Promise.all([
      memoryRepository.listCreatorMatchingFacts(creatorUserIds),
      relationshipDnaService.getMatchingBoostsForCreators(campaign.brandId, creatorUserIds)
    ]);
    const memoryByCreator = groupCreatorMatchingFacts(matchingFacts);

    const scored: CreatorMatchResult[] = [];
    for (const profile of profiles) {
      const memory = memoryByCreator.get(profile.userId) ?? emptyCreatorMatchingMemory();
      const base = baseScore(matchingBrief, profile, memory);
      if (!base) continue;

      const rel = relationshipBoosts.get(profile.userId) ?? { boost: 0, reasons: [] };
      const total = Math.min(AI_MATCHING_WEIGHTS.scoreCap, base.score + rel.boost);

      scored.push({
        creatorProfileId: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
        headline: profile.headline,
        matchScore: total,
        reasons: [...rel.reasons, ...base.reasons],
        availability: profile.availability,
        relationshipBoost: rel.boost
      });
    }

    const ranked = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
    await activityService.write(campaign.id, "ai.matching_complete", {
      userId: user.id,
      email: user.id,
      role: user.role.toUpperCase() === "ADMIN" ? "admin" : "brand"
    }, {
      matchCount: ranked.length,
      source: "Final Production Brief"
    });
    const learningEvent = await aiLearningEventRepository.append({
      eventType: "AIMatchingComplete",
      entityType: "Campaign",
      entityId: campaign.id,
      payload: {
        campaignId: campaign.id,
        matchCount: ranked.length,
        briefSource: "frozen_production_brief"
      },
      learningType: "matching_result",
      after: {
        matches: ranked.map((item) => ({
          creatorProfileId: item.creatorProfileId,
          score: item.matchScore
        }))
      },
      confidence: 0.85
    });
    await memoryRepository.upsertFact({
      ownerType: "CAMPAIGN",
      campaignId: campaign.id,
      category: "matching_statistics",
      factKey: "latest_match_count",
      factValue: String(ranked.length),
      confidence: 0.85,
      sourceType: "AIEvent",
      sourceRefId: learningEvent?.eventId ?? undefined
    });
    const legacyProjectId = resolveLegacyProjectId(campaign);
    await notificationService.notify({
      userId: campaign.brandId,
      campaignId: campaign.id,
      title: "AI found creator matches",
      content: `VINCIS found ${ranked.length} creator matches using the Final Production Brief.`,
      actionUrl: `${getAppBaseUrl()}/brand/projects/${legacyProjectId}?tab=match`,
      template: "ai.matching_complete",
      priority: "HIGH",
      email: false
    });
    return ranked;
  }
}

export const matchingService = new MatchingService();

function emptyCreatorMatchingMemory(): CreatorMatchingMemory {
  return { minAcceptBudgetUsd: null, budgetDeclines: 0, declineTotal: 0 };
}

function groupCreatorMatchingFacts(
  facts: Awaited<ReturnType<typeof memoryRepository.listCreatorMatchingFacts>>
) {
  const grouped = new Map<string, Array<{ category: string; factKey: string; factValue: string }>>();
  for (const fact of facts) {
    if (!fact.creatorId) continue;
    const bucket = grouped.get(fact.creatorId) ?? [];
    bucket.push({ category: fact.category, factKey: fact.factKey, factValue: fact.factValue });
    grouped.set(fact.creatorId, bucket);
  }

  const memoryByCreator = new Map<string, CreatorMatchingMemory>();
  for (const [creatorId, creatorFacts] of grouped) {
    memoryByCreator.set(creatorId, {
      minAcceptBudgetUsd: numberFact(creatorFacts, "matching_preference", "min_accept_budget_usd"),
      budgetDeclines: numberFact(creatorFacts, "matching_statistics", "budget_declines") ?? 0,
      declineTotal: numberFact(creatorFacts, "matching_statistics", "decline_total") ?? 0
    });
  }
  return memoryByCreator;
}

function numberFact(
  facts: Array<{ category: string; factKey: string; factValue: string }>,
  category: string,
  key: string
) {
  const raw = facts.find((fact) => fact.category === category && fact.factKey === key)?.factValue;
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
