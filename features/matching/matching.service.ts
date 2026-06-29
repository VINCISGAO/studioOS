import { AI_MATCHING_WEIGHTS } from "@/lib/studioos/ai-matching-policy";
import { relationshipDnaService } from "@/features/memory/relationship-dna.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { Campaign, CreatorProfile } from "@prisma/client";

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

function baseScore(campaign: Campaign, profile: CreatorProfile & { user: { email: string; id: string } }) {
  const budget = Number(campaign.budget);
  const minBudget = profile.minBudget ? Number(profile.minBudget) : null;
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
  const platform = normalize(campaign.platform ?? "");
  const reasons: string[] = [];
  let score = 0;

  if (platform && strengths.some((s) => normalize(s).includes(platform) || platform.includes(normalize(s)))) {
    score += AI_MATCHING_WEIGHTS.platform;
    reasons.push(`Platform fit: ${campaign.platform}`);
  }

  if (styles.some((s) => normalize(campaign.title).includes(normalize(s)))) {
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

    const allowedStatuses = new Set(["MATCHING", "INVITATION_SENT", "CREATOR_ACCEPTED", "CREATIVE_APPROVED"]);
    if (!allowedStatuses.has(campaign.status)) {
      throw appError("INVALID_TRANSITION", "Matching is available after creative approval");
    }

    const profiles = await prisma.creatorProfile.findMany({
      where: {
        availability: { in: ["AVAILABLE", "BUSY"] },
        user: { role: "CREATOR", deletedAt: null, status: "ACTIVE" }
      },
      include: { user: true }
    });

    const scored: CreatorMatchResult[] = [];
    for (const profile of profiles) {
      const base = baseScore(campaign, profile);
      if (!base) continue;

      const rel = await relationshipDnaService.getMatchingBoost(campaign.brandId, profile.userId);
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

    return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  }
}

export const matchingService = new MatchingService();
