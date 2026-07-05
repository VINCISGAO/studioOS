import "server-only";

import { memoryRepository } from "@/features/memory/memory.repository";
import type { CreatorInvitationDeclineReason } from "@/features/matching/invitation-decline-feedback";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { isMissingPrismaMigrationError } from "@/lib/core/database/prisma-migration-errors";
import { logger } from "@/lib/core/logger";
import type { AiMatchReportStatistics } from "@/lib/studioos/ai-match-report";

type CampaignLookupRow = {
  id: string;
};

type LearningRow = {
  after: Record<string, unknown>;
};

export async function getAiMatchReportStatisticsForProject(
  projectId: string
): Promise<AiMatchReportStatistics | null> {
  if (!hasDatabaseUrl()) return null;

  try {
    const campaignId = await resolveCampaignIdForProject(projectId);
    if (!campaignId) return null;

    const [facts, learningRows] = await Promise.all([
      memoryRepository.listFacts({
        ownerType: "CAMPAIGN",
        campaignId,
        limit: 200
      }),
      prisma.$queryRaw<LearningRow[]>`
        SELECT l."after"
        FROM "ai_learning" l
        INNER JOIN "ai_events" e ON e."id" = l."source_event_id"
        WHERE e."event_type" = 'CreatorRejected'
          AND e."payload"->>'campaignId' = ${campaignId}
        ORDER BY l."created_at" DESC
        LIMIT 100
      `
    ]);

    const memoryReasonCounts = parseReasonCounts(
      facts.find((fact) => fact.category === "matching_statistics" && fact.factKey === "decline_reason_counts")
        ?.factValue ?? null
    );
    const learningReasonCounts = countLearningReasons(learningRows);
    const declinedCount = Number(
      facts.find((fact) => fact.category === "matching_statistics" && fact.factKey === "declined_count")?.factValue ?? 0
    );
    const suggestedBudgetRaw = facts.find(
      (fact) => fact.category === "matching_statistics" && fact.factKey === "suggested_budget_usd"
    )?.factValue;
    const suggestedBudget = Number(suggestedBudgetRaw ?? 0);

    return {
      declineReasonCounts: mergeCounts(memoryReasonCounts, learningReasonCounts),
      declinedCount: Number.isFinite(declinedCount) ? declinedCount : 0,
      suggestedBudgetUsd: Number.isFinite(suggestedBudget) && suggestedBudget > 0 ? suggestedBudget : null,
      learningDeclineCount: learningRows.length
    };
  } catch (error) {
    if (!isMissingPrismaMigrationError(error)) {
      logger.error("AI match report statistics skipped due to query failure", {
        service: "ai-match-report-statistics",
        projectId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
    logger.error("AI match report statistics skipped because production database schema is not migrated", {
      service: "ai-match-report-statistics",
      projectId
    });
    return null;
  }
}

async function resolveCampaignIdForProject(projectId: string) {
  const rows = await prisma.$queryRaw<CampaignLookupRow[]>`
    SELECT "id"
    FROM "campaigns"
    WHERE "campaign_memory_json"->'legacy'->>'project_id' = ${projectId}
       OR "production_brief"->>'legacy_project_id' = ${projectId}
    ORDER BY "created_at" DESC
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

function countLearningReasons(rows: LearningRow[]) {
  const counts: Partial<Record<CreatorInvitationDeclineReason, number>> = {};
  for (const row of rows) {
    const reason = resolveReason(row.after);
    if (!reason) continue;
    counts[reason] = (counts[reason] ?? 0) + 1;
  }
  return counts;
}

function resolveReason(after: Record<string, unknown>) {
  if (typeof after.declineReason === "string") {
    return after.declineReason as CreatorInvitationDeclineReason;
  }
  const feedback = after.feedback;
  if (typeof feedback === "object" && feedback && "reason" in feedback) {
    const reason = (feedback as { reason?: unknown }).reason;
    return typeof reason === "string" ? (reason as CreatorInvitationDeclineReason) : null;
  }
  return null;
}

function parseReasonCounts(raw: string | null) {
  if (!raw) return {} as Partial<Record<CreatorInvitationDeclineReason, number>>;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const counts: Partial<Record<CreatorInvitationDeclineReason, number>> = {};
    for (const [reason, count] of Object.entries(parsed)) {
      if (typeof count === "number") counts[reason as CreatorInvitationDeclineReason] = count;
    }
    return counts;
  } catch {
    return {} as Partial<Record<CreatorInvitationDeclineReason, number>>;
  }
}

function mergeCounts(
  left: Partial<Record<CreatorInvitationDeclineReason, number>>,
  right: Partial<Record<CreatorInvitationDeclineReason, number>>
) {
  const merged = { ...left };
  for (const [reason, count] of Object.entries(right)) {
    const key = reason as CreatorInvitationDeclineReason;
    merged[key] = Math.max(merged[key] ?? 0, count ?? 0);
  }
  return merged;
}
