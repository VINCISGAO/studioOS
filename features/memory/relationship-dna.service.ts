import { memoryRepository } from "@/features/memory/memory.repository";
import type { RelationshipDnaSnapshot } from "@/features/memory/memory.types";
import { memoryConfig } from "@/lib/core/config/memory";
import { prisma } from "@/lib/core/database/prisma";

function trustLevel(count: number, satisfaction: number | null): RelationshipDnaSnapshot["trustLevel"] {
  if (count >= 8 && (satisfaction ?? 0) >= 4.5) return "strategic";
  if (count >= 5 && (satisfaction ?? 0) >= 4.0) return "preferred";
  if (count >= 2) return "proven";
  return "new";
}

function computePriorityScore(input: {
  collaborationCount: number;
  avgSatisfaction: number | null;
  avgReviewRounds: number | null;
  avgDaysEarly: number | null;
}) {
  let score = 0;
  score += Math.min(input.collaborationCount * 3, 24);
  if (input.avgSatisfaction != null) score += Math.round(input.avgSatisfaction * 4);
  if (input.avgReviewRounds != null) score += Math.max(0, 10 - Math.round(input.avgReviewRounds * 3));
  if (input.avgDaysEarly != null) score += Math.min(Math.round(input.avgDaysEarly * 2), 10);
  return Math.min(memoryConfig.relationshipBoostMax + 15, score);
}

export class RelationshipDnaService {
  async buildSnapshot(brandId: string, creatorId: string): Promise<RelationshipDnaSnapshot | null> {
    const row = await memoryRepository.getRelationship(brandId, creatorId);
    if (!row) return null;

    const satisfaction = row.avgSatisfaction != null ? Number(row.avgSatisfaction) : null;
    const highlights: string[] = [];
    if (row.collaborationCount > 0) highlights.push(`${row.collaborationCount} past collaborations`);
    if (satisfaction != null) highlights.push(`Avg satisfaction ${satisfaction.toFixed(1)}/5`);
    if (row.avgReviewRounds != null) highlights.push(`Avg ${Number(row.avgReviewRounds).toFixed(1)} review rounds`);
    if (row.avgDaysEarly != null && Number(row.avgDaysEarly) > 0) {
      highlights.push(`Delivers ~${Number(row.avgDaysEarly).toFixed(1)} days early`);
    }

    return {
      version: 1,
      collaborationCount: row.collaborationCount,
      avgSatisfaction: satisfaction,
      avgReviewRounds: row.avgReviewRounds != null ? Number(row.avgReviewRounds) : null,
      avgDaysEarly: row.avgDaysEarly != null ? Number(row.avgDaysEarly) : null,
      priorityScore: row.priorityScore,
      trustLevel: trustLevel(row.collaborationCount, satisfaction),
      highlights
    };
  }

  async recordCollaborationOutcome(input: {
    brandId: string;
    creatorId: string;
    satisfaction?: number;
    reviewRounds?: number;
    daysEarly?: number;
  }) {
    const existing = await memoryRepository.getRelationship(input.brandId, input.creatorId);
    const count = (existing?.collaborationCount ?? 0) + 1;

    const prevSat = existing?.avgSatisfaction != null ? Number(existing.avgSatisfaction) : null;
    const prevRounds = existing?.avgReviewRounds != null ? Number(existing.avgReviewRounds) : null;
    const prevEarly = existing?.avgDaysEarly != null ? Number(existing.avgDaysEarly) : null;

    const avgSatisfaction =
      input.satisfaction != null
        ? prevSat != null
          ? (prevSat * (count - 1) + input.satisfaction) / count
          : input.satisfaction
        : prevSat;

    const avgReviewRounds =
      input.reviewRounds != null
        ? prevRounds != null
          ? (prevRounds * (count - 1) + input.reviewRounds) / count
          : input.reviewRounds
        : prevRounds;

    const avgDaysEarly =
      input.daysEarly != null
        ? prevEarly != null
          ? (prevEarly * (count - 1) + input.daysEarly) / count
          : input.daysEarly
        : prevEarly;

    const priorityScore = computePriorityScore({
      collaborationCount: count,
      avgSatisfaction,
      avgReviewRounds,
      avgDaysEarly
    });

    const row = await memoryRepository.upsertRelationship(input.brandId, input.creatorId, {
      collaborationCount: count,
      avgSatisfaction,
      avgReviewRounds,
      avgDaysEarly,
      priorityScore,
      lastCollaborationAt: new Date(),
      dnaJson: {
        trustLevel: trustLevel(count, avgSatisfaction),
        highlights: [
          `${count} collaborations`,
          avgSatisfaction != null ? `satisfaction ${avgSatisfaction.toFixed(1)}` : null,
          avgReviewRounds != null ? `review rounds ${avgReviewRounds.toFixed(1)}` : null
        ].filter((value): value is string => typeof value === "string")
      }
    });

    return row;
  }

  async getMatchingBoost(brandId: string, creatorUserId: string) {
    const rel = await memoryRepository.getRelationship(brandId, creatorUserId);
    if (!rel) return { boost: 0, reasons: [] as string[] };
    const reasons: string[] = [];
    if (rel.collaborationCount >= 2) {
      reasons.push(`Relationship: ${rel.collaborationCount} past projects`);
    }
    if (rel.avgSatisfaction != null && Number(rel.avgSatisfaction) >= 4) {
      reasons.push(`High satisfaction (${Number(rel.avgSatisfaction).toFixed(1)})`);
    }
    const boost = Math.min(rel.priorityScore, memoryConfig.relationshipBoostMax);
    return { boost, reasons };
  }

  formatForPrompt(snapshot: RelationshipDnaSnapshot | null) {
    if (!snapshot || snapshot.collaborationCount === 0) return "";
    return [
      `Trust: ${snapshot.trustLevel}`,
      `Collaborations: ${snapshot.collaborationCount}`,
      ...snapshot.highlights
    ].join("\n");
  }

  async seedDemoRelationship(brandId: string, creatorId: string) {
    return memoryRepository.upsertRelationship(brandId, creatorId, {
      collaborationCount: 8,
      avgSatisfaction: 4.9,
      avgReviewRounds: 0.8,
      avgDaysEarly: 2,
      priorityScore: computePriorityScore({
        collaborationCount: 8,
        avgSatisfaction: 4.9,
        avgReviewRounds: 0.8,
        avgDaysEarly: 2
      }),
      lastCollaborationAt: new Date(),
      dnaJson: { trustLevel: "strategic", note: "Preferred creator partnership" }
    });
  }
}

export const relationshipDnaService = new RelationshipDnaService();
