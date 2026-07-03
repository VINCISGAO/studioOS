import type { Creator, CreatorWork } from "@/lib/types";
import type { CreatorMatch, MatchReason, ProjectMatch, StoredProject } from "@/lib/project-types";
import type { FrozenProductionBrief } from "@/features/ai/creative-direction.types";
import { AI_MATCHING_WEIGHTS, orderRatingMatchPoints } from "@/lib/studioos/ai-matching-policy";
import { projectBudgetMatchesCreatorMin } from "@/lib/studioos/creator-price-preference";

const ACTIVE_CREATOR_STATUSES = new Set(["active", "approved"]);

export type CreatorLearningMatchMemory = {
  minAcceptBudgetUsd?: number | null;
  budgetDeclines?: number;
  declineTotal?: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function tokens(value: string) {
  return normalize(value)
    .split(/[^a-z0-9\u4e00-\u9fff]+/i)
    .filter((token) => token.length > 2);
}

function overlapScore(left: string, right: string) {
  const leftTokens = new Set(tokens(left));
  const rightTokens = tokens(right);
  if (!leftTokens.size || !rightTokens.length) {
    return 0;
  }

  let hits = 0;
  for (const token of rightTokens) {
    if (leftTokens.has(token)) {
      hits += 1;
    }
  }

  return Math.min(AI_MATCHING_WEIGHTS.keywordMax, hits * AI_MATCHING_WEIGHTS.keywordPerHit);
}

function includesAny(haystack: string, needles: string[]) {
  const value = normalize(haystack);
  return needles.some((needle) => needle && value.includes(normalize(needle)));
}

function frozenBriefFromProject(project: StoredProject): FrozenProductionBrief | null {
  const value = project.settings_json?.frozen_production_brief;
  if (!value || typeof value !== "object") {
    return null;
  }
  const brief = value as FrozenProductionBrief;
  return brief.full_text?.trim() ? brief : null;
}

function frozenAspectRatio(brief: FrozenProductionBrief) {
  const delivery = brief.delivery as { aspect_ratios?: string[] } | undefined;
  return delivery?.aspect_ratios?.[0] ?? "";
}

function scoreCreatorForProject(
  project: StoredProject,
  creator: Creator,
  works: CreatorWork[],
  options?: {
    studioPerformanceLift?: Map<string, number>;
    creatorLearningMemory?: Map<string, CreatorLearningMatchMemory>;
  }
): CreatorMatch | null {
  const brief = frozenBriefFromProject(project);
  if (!brief) {
    return null;
  }

  if (!ACTIVE_CREATOR_STATUSES.has(creator.status)) {
    return null;
  }

  if (creator.orders_paused || creator.account_deleted_at) {
    return null;
  }

  if (creator.deposit_status !== "paid" || !creator.profile_completed_at) {
    return null;
  }

  const learningMemory = options?.creatorLearningMemory?.get(creator.id);
  const effectiveMinBudget = learningMemory?.minAcceptBudgetUsd ?? creator.min_project_budget_usd;
  if (!projectBudgetMatchesCreatorMin(brief.budget_range ?? "", effectiveMinBudget)) {
    return null;
  }

  const creatorWorks = works.filter((work) => work.creator_id === creator.id);
  const reasons: MatchReason[] = [];
  let score = 0;

  const category = brief.product?.category ?? "";
  const categoryNeedle = normalize(category);
  const categoryHit =
    Boolean(categoryNeedle) &&
    (creator.specialties.some((item) => normalize(item).includes(categoryNeedle) || categoryNeedle.includes(normalize(item))) ||
      creatorWorks.some((work) => normalize(work.category).includes(categoryNeedle) || categoryNeedle.includes(normalize(work.category))));

  if (categoryHit) {
    score += AI_MATCHING_WEIGHTS.category;
    reasons.push({
      en: `Category fit: ${category}`,
      zh: `品类匹配：${category}`
    });
  }

  const platform = brief.platforms ?? "";
  const platformParts = platform.split(/[,/|]+/).map((item) => item.trim()).filter(Boolean);
  const platformHit =
    includesAny(creator.specialties.join(" "), platformParts) ||
    creatorWorks.some((work) => includesAny(work.platform, platformParts));

  if (platformHit) {
    score += AI_MATCHING_WEIGHTS.platform;
    reasons.push({
      en: `Platform experience: ${platform}`,
      zh: `平台经验：${platform}`
    });
  }

  const aspectRatio = frozenAspectRatio(brief);
  const formatHit = creatorWorks.some(
    (work) =>
      Boolean(aspectRatio) &&
      (normalize(work.format).includes(normalize(aspectRatio)) ||
        normalize(aspectRatio).includes(normalize(work.format)))
  );

  if (formatHit) {
    score += AI_MATCHING_WEIGHTS.format;
    reasons.push({
      en: `Format match: ${aspectRatio}`,
      zh: `画幅匹配：${aspectRatio}`
    });
  }

  const briefText = [
    brief.title,
    brief.hook,
    brief.story,
    brief.tone,
    brief.visual_style,
    brief.shot_list.join(" "),
    brief.cta,
    brief.full_text
  ].join(" ");
  const creatorText = [
    creator.bio ?? "",
    creator.headline ?? "",
    creator.specialties.join(" "),
    ...(creator.expertise_domains ?? []),
    ...(creator.ai_tags ?? []),
    creator.tools.join(" "),
    ...creatorWorks.flatMap((work) => [work.description, ...work.tags])
  ].join(" ");

  const keywordScore = overlapScore(briefText, creatorText);
  if (keywordScore > 0) {
    score += keywordScore;
    reasons.push({
      en: "Brief keywords overlap with portfolio style",
      zh: "简报关键词与作品集风格相近"
    });
  }

  const aiTagScore = overlapScore(briefText, (creator.ai_tags ?? []).join(" "));
  if (aiTagScore > 0) {
    score += Math.min(AI_MATCHING_WEIGHTS.aiTagMax, aiTagScore);
    reasons.push({
      en: "AI tags align with this brief",
      zh: "AI 标签与 Brief 高度匹配"
    });
  }

  const toolHit = creator.tools.some((tool) => includesAny(briefText, [tool]));
  if (toolHit) {
    score += AI_MATCHING_WEIGHTS.toolMatch;
    reasons.push({
      en: "Tool stack matches production needs",
      zh: "制作工具与项目需求匹配"
    });
  }

  const reviewCount = creator.order_rating_count ?? 0;
  const ratingPoints = orderRatingMatchPoints(creator.rating, reviewCount);
  score += ratingPoints;
  reasons.push({
    en: reviewCount
      ? `Order rating ${creator.rating} (${reviewCount} reviews)`
      : `Studio rating ${creator.rating}`,
    zh: reviewCount
      ? `订单评分 ${creator.rating}（${reviewCount} 条评价）`
      : `Studio 评分 ${creator.rating}`
  });

  if (creator.deposit_status === "paid") {
    score += AI_MATCHING_WEIGHTS.certifiedBonus;
    reasons.push({
      en: "Certified service provider",
      zh: "认证服务商"
    });
  }

  if (creator.profile_completed_at) {
    score += AI_MATCHING_WEIGHTS.profileCompleteBonus;
    reasons.push({
      en: "Profile completed with AI tags",
      zh: "已完成主页入驻并生成 AI 标签"
    });
  }

  if (creator.status === "active") {
    score += AI_MATCHING_WEIGHTS.activeStatusBonus;
  }

  const learningPenalty = Math.min(
    12,
    Math.round((learningMemory?.budgetDeclines ?? 0) * 2 + (learningMemory?.declineTotal ?? 0) * 0.5)
  );
  if (learningPenalty > 0) {
    score -= learningPenalty;
    reasons.push({
      en: `AI memory learned recent decline friction -${learningPenalty}`,
      zh: `AI 记忆识别近期拒绝摩擦 -${learningPenalty}`
    });
  }

  const lift = options?.studioPerformanceLift?.get(creator.id);
  if (lift && lift >= AI_MATCHING_WEIGHTS.performanceLiftThreshold) {
    score += Math.min(
      AI_MATCHING_WEIGHTS.performanceLiftMax,
      Math.round(lift / AI_MATCHING_WEIGHTS.performanceLiftDivisor)
    );
    reasons.push({
      en: `Past attributed performance +${lift}% vs baseline`,
      zh: `历史归因表现高于基线 ${lift}%`
    });
  }

  const matchedWorks = creatorWorks
    .filter((work) => {
      const categoryOk =
        !categoryNeedle ||
        normalize(work.category).includes(categoryNeedle) ||
        categoryNeedle.includes(normalize(work.category));
      const platformOk = !platformParts.length || includesAny(work.platform, platformParts);
      return categoryOk || platformOk;
    })
    .slice(0, 3)
    .map((work) => work.id);

  if (!matchedWorks.length && creatorWorks.length) {
    matchedWorks.push(creatorWorks[0].id);
  }

  return {
    creator_id: creator.id,
    score: Math.max(0, Math.min(AI_MATCHING_WEIGHTS.scoreCap, score)),
    reasons,
    matched_work_ids: matchedWorks
  };
}

export function withDemoMatchingEligibility(creator: Creator): Creator {
  return {
    ...creator,
    status: "active",
    deposit_status: "paid",
    orders_paused: false,
    account_deleted_at: undefined,
    profile_completed_at: creator.profile_completed_at ?? "2026-06-01T00:00:00.000Z",
    min_project_budget_usd: 0,
    ai_tags: creator.ai_tags ?? creator.specialties
  };
}

export function matchCreatorsForProjectWithDemoFallback(
  project: StoredProject,
  creators: Creator[],
  works: CreatorWork[],
  options?: {
    studioPerformanceLift?: Map<string, number>;
    creatorLearningMemory?: Map<string, CreatorLearningMatchMemory>;
  }
): CreatorMatch[] {
  const matches = matchCreatorsForProject(project, creators, works, options);
  if (matches.length) {
    return matches;
  }

  return matchCreatorsForProject(
    project,
    creators.map(withDemoMatchingEligibility),
    works,
    options
  );
}

export function matchCreatorsForProject(
  project: StoredProject,
  creators: Creator[],
  works: CreatorWork[],
  options?: {
    studioPerformanceLift?: Map<string, number>;
    creatorLearningMemory?: Map<string, CreatorLearningMatchMemory>;
  }
): CreatorMatch[] {
  return creators
    .map((creator) =>
      scoreCreatorForProject(project, creator, works, options)
    )
    .filter((item): item is CreatorMatch => Boolean(item))
    .sort((a, b) => b.score - a.score);
}

export async function getStudioPerformanceLiftForOrg(orgId: string): Promise<Map<string, number>> {
  const { getInsightsForOrg } = await import("@/lib/studioos/creative-performance-store");
  const insights = await getInsightsForOrg(orgId);
  const map = new Map<string, number>();
  for (const insight of insights) {
    if (insight.category === "studio") {
      map.set(insight.pattern, insight.lift_pct);
    }
  }
  return map;
}

export function matchProjectsForCreator(
  creator: Creator,
  works: CreatorWork[],
  projects: StoredProject[]
): ProjectMatch[] {
  return projects
    .filter((project) => !["completed", "cancelled", "refunded"].includes(project.status))
    .map((project) => {
      const match = scoreCreatorForProject(project, creator, works);
      if (!match) {
        return null;
      }

      return {
        project_id: project.id,
        score: match.score,
        reasons: match.reasons
      };
    })
    .filter((item): item is ProjectMatch => Boolean(item))
    .sort((a, b) => b.score - a.score);
}
