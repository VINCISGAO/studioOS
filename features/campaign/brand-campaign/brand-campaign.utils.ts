import { deadlineFromTimeline } from "@/lib/studioos/brand-campaign-options";
import type { CampaignStatus } from "@prisma/client";
import type { CampaignProjectStatus } from "@/lib/studioos/project-status";

export function createLegacyProjectId() {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function parseBudget(raw?: string | null): number {
  if (!raw) return 200;
  const digits = raw.replace(/[^\d.]/g, "");
  const value = Number.parseFloat(digits);
  return Number.isFinite(value) && value > 0 ? value : 200;
}

export function parseDeadline(raw?: string | null): Date {
  if (raw) {
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T23:59:59.000Z` : raw;
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 14);
  return fallback;
}

export function deadlineIsoFromTimeline(timelineId?: string | null, fallbackRaw?: string | null) {
  if (fallbackRaw?.trim()) {
    return fallbackRaw.trim().slice(0, 10);
  }
  if (timelineId) {
    return deadlineFromTimeline(timelineId);
  }
  return parseDeadline(null).toISOString().slice(0, 10);
}

export function prismaStatusToProjectStatus(status: CampaignStatus): CampaignProjectStatus {
  const map: Partial<Record<CampaignStatus, CampaignProjectStatus>> = {
    DRAFT: "draft",
    AI_PROCESSING: "draft",
    CREATIVE_READY: "draft",
    CREATIVE_APPROVED: "draft",
    MATCHING: "matching",
    INVITATION_SENT: "matching",
    CREATOR_ACCEPTED: "studio_selected",
    ESCROW_PENDING: "payment_pending",
    ESCROW_FUNDED: "production",
    PRODUCING: "production",
    UNDER_REVIEW: "in_review",
    APPROVED: "in_review",
    MASTER_UPLOADED: "delivered",
    SETTLEMENT: "delivered",
    COMPLETED: "completed",
    CANCELLED: "cancelled"
  };
  return map[status] ?? "draft";
}

export function readProductionBrief(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  return raw as Record<string, unknown>;
}

export function readCampaignMemory(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  return raw as Record<string, unknown>;
}
