/**
 * Review round ↔ version mapping (canonical product rule):
 *
 * - V1 = revision round 1 … V5 = revision round 5 (1:1)
 * - Rounds 1–3 (V1–V3): included in base escrow
 * - Rounds 4–5 (V4–V5): ONE paid add-on (20% of project amount) unlocks BOTH rounds
 * - Entering round 4 triggers payment; round 5 does NOT require a second payment
 * - After round 5 still not approved → platform intervention
 */

/** Free revision rounds / deliverable slots (V1–V3). */
export const INCLUDED_FREE_REVISION_ROUNDS = 3;

/** Hard cap: 5 revision rounds = V1–V5. */
export const MAX_REVISION_ROUNDS = 5;

/** Extra revision rounds covered by the single paid add-on (rounds 4 + 5). */
export const PAID_REVISION_ROUNDS = MAX_REVISION_ROUNDS - INCLUDED_FREE_REVISION_ROUNDS;

/** Separate checkout count — one payment unlocks the whole paid block. */
export const PAID_REVISION_PAYMENTS = 1;

/** Brand add-on surcharge for rounds 4–5 (20% of project amount). */
export const PAID_REVISION_SURCHARGE_RATE = 0.2;

/** @deprecated Use INCLUDED_FREE_REVISION_ROUNDS */
export const INCLUDED_REVIEW_VERSIONS = INCLUDED_FREE_REVISION_ROUNDS;

/** @deprecated Use MAX_REVISION_ROUNDS */
export const MAX_REVIEW_VERSIONS = MAX_REVISION_ROUNDS;

/** @deprecated Use PAID_REVISION_ROUNDS */
export const PAID_REVIEW_VERSIONS = PAID_REVISION_ROUNDS;

/** @deprecated Use MAX_REVISION_ROUNDS */
export const MAX_REVIEW_ROUNDS = MAX_REVISION_ROUNDS;

export type ReviewRoundGateCode = "PAYMENT_REQUIRED" | "REVIEW_LOCKED";

export function revisionRoundForVersion(versionNumber: number): number {
  return versionNumber;
}

export function versionForRevisionRound(revisionRound: number): number {
  return revisionRound;
}

export function isFreeRevisionRound(revisionRound: number): boolean {
  return revisionRound >= 1 && revisionRound <= INCLUDED_FREE_REVISION_ROUNDS;
}

export function isPaidRevisionRound(revisionRound: number): boolean {
  return revisionRound > INCLUDED_FREE_REVISION_ROUNDS && revisionRound <= MAX_REVISION_ROUNDS;
}

/** True after the single 20% add-on has been purchased (unlocks V4 + V5). */
export function hasPaidRevisionPackUnlocked(paidRevisionUnlocked: number): boolean {
  return paidRevisionUnlocked >= 1;
}

export function reviewDraftLabel(locale: "en" | "zh", version: number): string {
  const labels =
    locale === "zh"
      ? ["第一稿", "第二稿", "第三稿", "第四稿", "第五稿"]
      : ["Draft 1", "Draft 2", "Draft 3", "Draft 4", "Draft 5"];
  return labels[version - 1] ?? `V${version}`;
}

/** Secondary label under version-flow slots (payment / lock hint). */
export function reviewSlotSecondaryLabel(
  locale: "en" | "zh",
  versionNumber: number,
  input: { lockReason: ReviewVersionSlotLockReason; paidPackUnlocked: boolean }
): string {
  if (input.lockReason === "payment" && versionNumber === 4) {
    return locale === "zh" ? "付费加购" : "Paid add-on";
  }
  if (input.lockReason === "payment" && versionNumber === 5) {
    return locale === "zh" ? "含于加购" : "In add-on pack";
  }
  if (input.lockReason === "exhausted") {
    return locale === "zh" ? "未解锁" : "Locked";
  }
  if (input.lockReason === "workflow") {
    return locale === "zh" ? "未解锁" : "Locked";
  }
  return locale === "zh" ? "待上传" : "Pending upload";
}

export function revisionRoundLabel(locale: "en" | "zh", revisionRound: number): string {
  if (locale === "zh") {
    return `第${revisionRound}轮修订`;
  }
  return `Revision round ${revisionRound}`;
}

export function paidRevisionPackLabel(locale: "en" | "zh"): string {
  if (locale === "zh") {
    return `第4–5轮修订加购（项目金额 ${PAID_REVISION_SURCHARGE_RATE * 100}%）`;
  }
  return `Rounds 4–5 add-on (${PAID_REVISION_SURCHARGE_RATE * 100}% of project amount)`;
}

/** @deprecated Use isPaidRevisionRound */
export function isPaidReviewVersion(version: number): boolean {
  return isPaidRevisionRound(revisionRoundForVersion(version));
}

/** Always 0 for free rounds, 1 for paid rounds 4–5 (single pack). */
export function requiredPaidSlotsForRevisionRound(revisionRound: number): number {
  if (revisionRound <= INCLUDED_FREE_REVISION_ROUNDS) return 0;
  if (revisionRound > MAX_REVISION_ROUNDS) return PAID_REVISION_PAYMENTS + 1;
  return PAID_REVISION_PAYMENTS;
}

/** @deprecated Use requiredPaidSlotsForRevisionRound */
export function requiredPaidSlotsForVersion(version: number): number {
  return requiredPaidSlotsForRevisionRound(revisionRoundForVersion(version));
}

export function isRevisionRoundPaymentUnlocked(
  revisionRound: number,
  paidRevisionUnlocked: number
): boolean {
  if (revisionRound <= INCLUDED_FREE_REVISION_ROUNDS) return true;
  if (revisionRound > MAX_REVISION_ROUNDS) return false;
  return hasPaidRevisionPackUnlocked(paidRevisionUnlocked);
}

/** @deprecated Use isRevisionRoundPaymentUnlocked */
export function isReviewVersionPaymentUnlocked(version: number, paidRevisionUnlocked: number): boolean {
  return isRevisionRoundPaymentUnlocked(revisionRoundForVersion(version), paidRevisionUnlocked);
}

export function maxUploadableRevisionRound(paidRevisionUnlocked: number): number {
  if (hasPaidRevisionPackUnlocked(paidRevisionUnlocked)) {
    return MAX_REVISION_ROUNDS;
  }
  return INCLUDED_FREE_REVISION_ROUNDS;
}

/** @deprecated Use maxUploadableRevisionRound */
export function maxUploadableReviewVersion(paidRevisionUnlocked: number): number {
  return maxUploadableRevisionRound(paidRevisionUnlocked);
}

/** 0 when pack purchased, 1 when still needs the single add-on payment. */
export function remainingPaidPayments(paidRevisionUnlocked: number): number {
  return hasPaidRevisionPackUnlocked(paidRevisionUnlocked) ? 0 : 1;
}

/** @deprecated Use remainingPaidPayments */
export function remainingPaidSlotsToUnlock(paidRevisionUnlocked: number): number {
  return remainingPaidPayments(paidRevisionUnlocked);
}

/** First paid round is always 4; null once the pack is purchased. */
export function nextPaidRevisionRoundToUnlock(paidRevisionUnlocked: number): number | null {
  if (hasPaidRevisionPackUnlocked(paidRevisionUnlocked)) return null;
  return INCLUDED_FREE_REVISION_ROUNDS + 1;
}

/** @deprecated Use nextPaidRevisionRoundToUnlock */
export function nextPaidVersionToUnlock(paidRevisionUnlocked: number): number | null {
  const round = nextPaidRevisionRoundToUnlock(paidRevisionUnlocked);
  return round == null ? null : versionForRevisionRound(round);
}

export function assertRevisionRequestAllowed(input: {
  currentVersionNumber: number;
  paidSlotsUnlocked: number;
}):
  | { ok: true; nextVersion: number; nextRevisionRound: number }
  | { ok: false; code: ReviewRoundGateCode; nextVersion: number; nextRevisionRound: number } {
  const currentRound = revisionRoundForVersion(input.currentVersionNumber);
  const nextRevisionRound = currentRound + 1;
  const nextVersion = versionForRevisionRound(nextRevisionRound);

  if (nextRevisionRound > MAX_REVISION_ROUNDS) {
    return { ok: false, code: "REVIEW_LOCKED", nextVersion, nextRevisionRound };
  }

  if (!isRevisionRoundPaymentUnlocked(nextRevisionRound, input.paidSlotsUnlocked)) {
    return { ok: false, code: "PAYMENT_REQUIRED", nextVersion, nextRevisionRound };
  }

  return { ok: true, nextVersion, nextRevisionRound };
}

export function assertReviewVersionUploadAllowed(input: {
  targetVersion: number;
  paidSlotsUnlocked: number;
}): { ok: true } | { ok: false; code: ReviewRoundGateCode | "max-versions" } {
  const targetRound = revisionRoundForVersion(input.targetVersion);
  if (targetRound > MAX_REVISION_ROUNDS) {
    return { ok: false, code: "REVIEW_LOCKED" };
  }
  if (!isRevisionRoundPaymentUnlocked(targetRound, input.paidSlotsUnlocked)) {
    return { ok: false, code: "PAYMENT_REQUIRED" };
  }
  return { ok: true };
}

export type ReviewVersionSlotLockReason = "none" | "workflow" | "payment" | "exhausted";

export function resolveReviewVersionSlotLockReason(input: {
  versionNumber: number;
  workflowLocked: boolean;
  paidSlotsUnlocked: number;
}): ReviewVersionSlotLockReason {
  const round = revisionRoundForVersion(input.versionNumber);
  if (round > MAX_REVISION_ROUNDS) {
    return "exhausted";
  }

  if (!isRevisionRoundPaymentUnlocked(round, input.paidSlotsUnlocked)) {
    return "payment";
  }

  return input.workflowLocked ? "workflow" : "none";
}

export function reviewRoundGateMessage(
  code: ReviewRoundGateCode,
  locale: "en" | "zh",
  revisionRound?: number
): string {
  if (code === "PAYMENT_REQUIRED") {
    const round = revisionRound ?? INCLUDED_FREE_REVISION_ROUNDS + 1;
    if (locale === "zh") {
      return `进入第${round}轮修订需先完成一次加购（项目金额 ${PAID_REVISION_SURCHARGE_RATE * 100}%），可再修改第4、5轮（V4–V5）。`;
    }
    return `Revision round ${round} requires a one-time add-on (${PAID_REVISION_SURCHARGE_RATE * 100}% of project amount) to unlock rounds 4 and 5 (V4–V5).`;
  }

  if (locale === "zh") {
    return "第五轮修订（V5）后仍无法过审，如需继续请联系平台介入。";
  }
  return "After revision round 5 (V5), further changes require platform intervention.";
}
