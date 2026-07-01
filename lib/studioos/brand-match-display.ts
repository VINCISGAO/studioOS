import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import type { Creator } from "@/lib/types";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { projectBudgetMatchesCreatorMin } from "@/lib/studioos/creator-price-preference";

export type BrandMatchInvitationGroups = {
  accepted: StoredCreatorInvitation[];
  pending: StoredCreatorInvitation[];
  declined: StoredCreatorInvitation[];
};

export type BrandMatchReasonKey =
  | "productExperience"
  | "usMarket"
  | "tiktokPerformance"
  | "budgetFit"
  | "deliverySpeed";

export type BrandMatchReason = {
  key: BrandMatchReasonKey;
  label: string;
  matched: boolean;
};

export type BrandMatchRecommendation = {
  invitation: StoredCreatorInvitation;
  creator: Creator;
  creatorName: string;
  compositeScore: number;
  starDisplay: string;
  matchPercent: number;
  reasons: BrandMatchReason[];
  headline: string;
};

const reasonLabels: Record<BrandMatchReasonKey, Record<Locale, string>> = {
  productExperience: { en: "Product experience", zh: "产品经验" },
  usMarket: { en: "US market", zh: "美国市场" },
  tiktokPerformance: { en: "TikTok hit rate", zh: "TikTok爆款率" },
  budgetFit: { en: "Budget fit", zh: "预算匹配" },
  deliverySpeed: { en: "Delivery speed", zh: "交付速度" }
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function includesAny(haystack: string, needles: string[]) {
  const value = normalize(haystack);
  return needles.some((needle) => needle && value.includes(normalize(needle)));
}

export function resolveCreatorForInvitation(creatorId: string): Creator | undefined {
  return creators.find((item) => item.id === creatorId);
}

export function groupBrandMatchInvitations(
  invitations: StoredCreatorInvitation[]
): BrandMatchInvitationGroups {
  const accepted = invitations
    .filter((item) => item.status === "accepted")
    .sort((a, b) => b.matchScore - a.matchScore);
  const pending = invitations.filter((item) => item.status === "pending");
  const declined = invitations.filter((item) => item.status === "declined");
  return { accepted, pending, declined };
}

export function formatStarRating(rating: number): string {
  const full = Math.min(5, Math.max(0, Math.round(rating)));
  return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
}

export function buildCompositeScore(matchScore: number, rating: number): number {
  const ratingBoost = Math.max(0, rating - 4) * 8;
  const raw = Math.min(99.9, matchScore * 0.72 + ratingBoost + rating * 4);
  return Math.round(raw * 10) / 10;
}

export function estimatePendingReplyHours(creatorId: string, invitationId: string): number {
  let hash = 0;
  const seed = `${creatorId}:${invitationId}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return 2 + (hash % 11);
}

export function formatPendingReplyEta(hours: number, locale: Locale): string {
  if (locale === "zh") {
    return `约 ${hours}h`;
  }
  return `~${hours}h`;
}

function buildMatchReasons(
  creator: Creator,
  invitation: StoredCreatorInvitation,
  locale: Locale,
  projectBudgetRange?: string | null
): BrandMatchReason[] {
  const platformParts = (invitation.platform ?? "")
    .split(/[,/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const categoryText = [creator.headline, creator.bio, creator.specialties.join(" ")].join(" ");
  const productHit =
    creator.specialties.length > 0 ||
    Boolean(creator.ai_tags?.length) ||
    includesAny(categoryText, ["product", "cpg", "beauty", "tech", "产品", "美妆"]);

  const usMarketHit =
    normalize(creator.country).includes("united states") ||
    normalize(creator.country) === "us" ||
    normalize(creator.country).includes("america") ||
    creator.specialties.some((item) => normalize(item).includes("us") || normalize(item).includes("dtc"));

  const tiktokHit =
    platformParts.some((part) => normalize(part).includes("tiktok")) ||
    creator.specialties.some((item) => normalize(item).includes("tiktok")) ||
    includesAny(categoryText, ["tiktok", "short-form", "short form", "短视频"]);

  const budgetHit = projectBudgetMatchesCreatorMin(
    projectBudgetRange ?? String(invitation.budget),
    creator.min_project_budget_usd
  );

  const deliveryHit = Boolean(creator.delivery_speed?.trim());

  const checks: Array<{ key: BrandMatchReasonKey; matched: boolean }> = [
    { key: "productExperience", matched: productHit },
    { key: "usMarket", matched: usMarketHit },
    { key: "tiktokPerformance", matched: tiktokHit },
    { key: "budgetFit", matched: budgetHit },
    { key: "deliverySpeed", matched: deliveryHit }
  ];

  return checks.map(({ key, matched }) => ({
    key,
    label: reasonLabels[key][locale],
    matched
  }));
}

export function buildBrandMatchRecommendation(
  accepted: StoredCreatorInvitation[],
  locale: Locale,
  projectBudgetRange?: string | null
): BrandMatchRecommendation | null {
  const top = accepted[0];
  if (!top) return null;

  const creator = resolveCreatorForInvitation(top.creatorId);
  if (!creator) return null;

  const compositeScore = buildCompositeScore(top.matchScore, creator.rating);
  const reasons = buildMatchReasons(creator, top, locale, projectBudgetRange);

  return {
    invitation: top,
    creator,
    creatorName: creator.name,
    compositeScore,
    starDisplay: formatStarRating(creator.rating),
    matchPercent: Math.round(top.matchScore),
    reasons,
    headline: creator.headline ?? ""
  };
}

export function buildAcceptedCreatorRow(
  invitation: StoredCreatorInvitation,
  locale: Locale,
  projectBudgetRange?: string | null
) {
  const creator = resolveCreatorForInvitation(invitation.creatorId);
  const name = creator?.name ?? invitation.creatorId;
  return {
    invitation,
    creator,
    name,
    starDisplay: formatStarRating(creator?.rating ?? 4.5),
    matchPercent: Math.round(invitation.matchScore),
    profileHref: `/creators/${invitation.creatorId}`,
    reasons: creator ? buildMatchReasons(creator, invitation, locale, projectBudgetRange) : []
  };
}
