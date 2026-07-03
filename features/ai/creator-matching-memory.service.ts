import "server-only";

import { memoryRepository } from "@/features/memory/memory.repository";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { CreatorLearningMatchMemory } from "@/lib/matching-engine";

export async function buildCreatorLearningMemoryMap(creatorIds: string[]) {
  const map = new Map<string, CreatorLearningMatchMemory>();
  if (!hasDatabaseUrl()) return map;

  for (const creatorId of creatorIds) {
    const creatorUserId = await resolveCreatorUserId(creatorId);
    if (!creatorUserId) continue;

    const facts = await memoryRepository.listFacts({
      ownerType: "CREATOR",
      creatorId: creatorUserId,
      limit: 200
    });
    map.set(creatorId, {
      minAcceptBudgetUsd: numberFact(facts, "matching_preference", "min_accept_budget_usd"),
      budgetDeclines: numberFact(facts, "matching_statistics", "budget_declines") ?? 0,
      declineTotal: numberFact(facts, "matching_statistics", "decline_total") ?? 0
    });
  }

  return map;
}

async function resolveCreatorUserId(legacyCreatorId: string) {
  const profileId = await resolveCreatorProfileIdForLegacyId(legacyCreatorId);
  if (!profileId) return null;
  const profile = await prisma.creatorProfile.findUnique({
    where: { id: profileId },
    select: { userId: true }
  });
  return profile?.userId ?? null;
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
