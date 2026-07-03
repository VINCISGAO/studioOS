import "server-only";

import type { MemoryFact } from "@prisma/client";
import { memoryRepository } from "@/features/memory/memory.repository";

export type DeclineFeedbackForMemory = {
  reason?: string;
  budgetThreshold?: string;
  customBudgetUsd?: number;
};

export async function updateCreatorLearningMemory(input: {
  creatorUserId: string;
  eventId: string;
  feedback: DeclineFeedbackForMemory;
  confidence: number;
}) {
  const facts = await memoryRepository.listFacts({
    ownerType: "CREATOR",
    creatorId: input.creatorUserId,
    limit: 200
  });
  const declineCounts = incrementJsonCounter(
    factValue(facts, "matching_statistics", "decline_reason_counts"),
    input.feedback.reason!
  );
  const declineTotal = numberFact(facts, "matching_statistics", "decline_total") + 1;
  const budgetDeclines =
    numberFact(facts, "matching_statistics", "budget_declines") +
    (input.feedback.reason === "BUDGET_TOO_LOW" ? 1 : 0);

  await upsertCreatorFact(input, "matching_statistics", "decline_reason_counts", JSON.stringify(declineCounts));
  await upsertCreatorFact(input, "matching_statistics", "decline_total", String(declineTotal));
  await upsertCreatorFact(input, "matching_statistics", "budget_declines", String(budgetDeclines));

  const budget = resolveBudgetTarget(input.feedback);
  if (budget) {
    await upsertCreatorFact(input, "matching_preference", "min_accept_budget_usd", String(budget));
  }
}

export async function updateCampaignLearningStatistics(input: {
  campaignId: string;
  eventId: string;
  feedback: DeclineFeedbackForMemory;
  confidence: number;
}) {
  const facts = await memoryRepository.listFacts({
    ownerType: "CAMPAIGN",
    campaignId: input.campaignId,
    limit: 200
  });
  const declineCounts = incrementJsonCounter(
    factValue(facts, "matching_statistics", "decline_reason_counts"),
    input.feedback.reason!
  );
  const declined = numberFact(facts, "matching_statistics", "declined_count") + 1;

  await upsertCampaignFact(input, "matching_statistics", "decline_reason_counts", JSON.stringify(declineCounts));
  await upsertCampaignFact(input, "matching_statistics", "declined_count", String(declined));

  const budget = resolveBudgetTarget(input.feedback);
  if (budget) {
    await upsertCampaignFact(input, "matching_statistics", "suggested_budget_usd", String(budget));
  }
}

async function upsertCreatorFact(
  input: { creatorUserId: string; eventId: string; confidence: number },
  category: string,
  factKey: string,
  factValue: string
) {
  await memoryRepository.upsertFact({
    ownerType: "CREATOR",
    creatorId: input.creatorUserId,
    category,
    factKey,
    factValue,
    confidence: input.confidence,
    sourceType: "AIEvent",
    sourceRefId: input.eventId
  });
}

async function upsertCampaignFact(
  input: { campaignId: string; eventId: string; confidence: number },
  category: string,
  factKey: string,
  factValue: string
) {
  await memoryRepository.upsertFact({
    ownerType: "CAMPAIGN",
    campaignId: input.campaignId,
    category,
    factKey,
    factValue,
    confidence: input.confidence,
    sourceType: "AIEvent",
    sourceRefId: input.eventId
  });
}

export function resolveBudgetTarget(feedback: DeclineFeedbackForMemory) {
  if (feedback.reason !== "BUDGET_TOO_LOW") return null;
  if (feedback.budgetThreshold === "custom") return feedback.customBudgetUsd ?? null;
  const value = Number(feedback.budgetThreshold);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function incrementJsonCounter(raw: string | null, key: string) {
  const counts = parseCounter(raw);
  counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}

function parseCounter(raw: string | null) {
  if (!raw) return {} as Record<string, number>;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, number] => typeof entry[1] === "number")
    );
  } catch {
    return {} as Record<string, number>;
  }
}

function factValue(facts: MemoryFact[], category: string, key: string) {
  return facts.find((fact) => fact.category === category && fact.factKey === key)?.factValue ?? null;
}

function numberFact(facts: MemoryFact[], category: string, key: string) {
  const value = Number(factValue(facts, category, key) ?? 0);
  return Number.isFinite(value) ? value : 0;
}
