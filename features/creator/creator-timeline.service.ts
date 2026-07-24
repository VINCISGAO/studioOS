import "server-only";

import type { CreatorVerificationReviewLog } from "@prisma/client";
import type { CreatorTimelineEvent, CreatorTimelineEventKind } from "@/features/creator/creator-eligibility.types";
import { creatorVerificationReviewLogRepository } from "@/features/creator/creator-verification-review-log.repository";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

function reviewActionToTimelineKind(action: string): CreatorTimelineEventKind | null {
  switch (action) {
    case "SUBMIT":
      return "VERIFICATION_APPLIED";
    case "APPROVE":
      return "VERIFICATION_APPROVED";
    case "REJECT":
      return "VERIFICATION_REJECTED";
    case "SUSPEND":
      return "VERIFICATION_SUSPENDED";
    case "REINSTATE":
      return "VERIFICATION_RESTORED";
    case "TOGGLE_MARKETPLACE_VISIBLE":
      return null;
    case "TOGGLE_CAN_ACCEPT":
      return null;
    default:
      return null;
  }
}

function reviewLogToTimelineEvents(log: CreatorVerificationReviewLog): CreatorTimelineEvent[] {
  const events: CreatorTimelineEvent[] = [];
  const base = {
    at: log.createdAt.toISOString(),
    adminId: log.adminId,
    reason: log.reason,
    snapshot: log.snapshotJson
  };

  const kind = reviewActionToTimelineKind(log.action);
  if (kind) {
    events.push({
      ...base,
      kind,
      label: kind.replaceAll("_", " ")
    });
  }

  if (log.action === "TOGGLE_MARKETPLACE_VISIBLE") {
    events.push({
      ...base,
      kind: log.newMarketplaceVisible ? "MARKETPLACE_ENABLED" : "MARKETPLACE_DISABLED",
      label: log.newMarketplaceVisible ? "Marketplace enabled" : "Marketplace disabled"
    });
  }

  if (log.action === "TOGGLE_CAN_ACCEPT") {
    events.push({
      ...base,
      kind: log.newCanAcceptProjects ? "PROJECT_ACCESS_ENABLED" : "PROJECT_ACCESS_DISABLED",
      label: log.newCanAcceptProjects ? "Project access enabled" : "Project access disabled"
    });
  }

  return events;
}

export async function listCreatorTimeline(creatorProfileId: string): Promise<CreatorTimelineEvent[]> {
  if (!hasDatabaseUrl()) return [];

  const profile = await prisma.creatorProfile.findUnique({
    where: { id: creatorProfileId },
    select: {
      createdAt: true,
      verificationAppliedAt: true,
      verificationReviewedAt: true,
      verificationStatus: true
    }
  });

  if (!profile) return [];

  const logs = await creatorVerificationReviewLogRepository.listByCreatorProfileId(creatorProfileId);
  const events: CreatorTimelineEvent[] = [
    {
      at: profile.createdAt.toISOString(),
      kind: "REGISTERED",
      label: "Registered"
    }
  ];

  if (profile.verificationAppliedAt) {
    events.push({
      at: profile.verificationAppliedAt.toISOString(),
      kind: "VERIFICATION_APPLIED",
      label: "Verification applied"
    });
  }

  if (profile.verificationReviewedAt && profile.verificationStatus === "APPROVED") {
    events.push({
      at: profile.verificationReviewedAt.toISOString(),
      kind: "VERIFICATION_APPROVED",
      label: "Verification approved"
    });
  }

  for (const log of logs) {
    events.push(...reviewLogToTimelineEvents(log));
  }

  return events.sort((a, b) => a.at.localeCompare(b.at));
}
