import type { Locale } from "@/lib/i18n";

/**
 * VINCIS AI matching policy — frozen system rules.
 *
 * Weights are compiled into the product runtime. They are NOT stored in the database,
 * NOT exposed in admin UI, and NOT user-configurable. Change only via code deploy.
 */
export const AI_MATCHING_WEIGHTS = Object.freeze({
  category: 25,
  platform: 25,
  format: 15,
  keywordPerHit: 3,
  keywordMax: 15,
  aiTagMax: 12,
  toolMatch: 5,
  /** Order reviews present — rating has stronger influence on match rank. */
  ratingMultiplierWithReviews: 6,
  /** Portfolio/default rating — lower influence until real order reviews exist. */
  ratingMultiplierDefault: 2,
  certifiedBonus: 5,
  profileCompleteBonus: 8,
  activeStatusBonus: 5,
  performanceLiftThreshold: 15,
  performanceLiftMax: 12,
  performanceLiftDivisor: 3,
  scoreCap: 100
} as const);

export type AiMatchingWeights = typeof AI_MATCHING_WEIGHTS;

export function orderRatingMatchPoints(rating: number, orderReviewCount: number): number {
  const multiplier =
    orderReviewCount > 0
      ? AI_MATCHING_WEIGHTS.ratingMultiplierWithReviews
      : AI_MATCHING_WEIGHTS.ratingMultiplierDefault;
  return Math.round(rating * multiplier);
}

export const aiMatchingPolicyCopy = {
  en: {
    title: "Order rating system",
    body: "Brands rate completed orders. AI ranks studios using fixed rules built into VINCIS — weights cannot be changed in admin or by studios.",
    footnote: "Match weights are AI-applied system rules, not manual settings.",
    currentRating: "Current rating",
    noReviews: "No order reviews yet",
    reviews: (count: number) => `${count} order review${count === 1 ? "" : "s"}`
  },
  zh: {
    title: "订单评分体系",
    body: "历史订单完成后由品牌方打分。智能系统按内置规则综合计算匹配排序，后台与创作者均无法修改权重。",
    footnote: "匹配权重由 AI 自动判定并写入系统，不可人为调整。",
    currentRating: "当前评分",
    noReviews: "暂无订单评价",
    reviews: (count: number) => `${count} 条订单评价`
  }
} as const;

export function getAiMatchingPolicyCopy(locale: Locale) {
  return aiMatchingPolicyCopy[locale];
}
