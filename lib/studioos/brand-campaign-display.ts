import type { CampaignProjectStatus } from "@/lib/studioos/project-status";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

export type BrandCampaignPhase = "draft" | "awaiting_payment" | "in_progress" | "waiting_review" | "completed";

export const BRAND_ISSUE_TYPES = ["Logo", "Music", "Ending", "CTA"] as const;
export type BrandIssueType = (typeof BRAND_ISSUE_TYPES)[number];

export function brandCampaignPhase(status: string): BrandCampaignPhase {
  const normalized = normalizeCampaignStatus(status);
  if (["completed", "delivered"].includes(normalized)) return "completed";
  if (normalized === "in_review" || status === "review") return "waiting_review";
  if (["payment_pending", "contract_pending", "studio_selected", "proposal"].includes(normalized)) {
    return "awaiting_payment";
  }
  if (normalized === "draft") return "draft";
  return "in_progress";
}

export function brandCampaignEmoji(phase: BrandCampaignPhase): string {
  if (phase === "completed") return "✅";
  if (phase === "waiting_review") return "🟢";
  if (phase === "awaiting_payment") return "💳";
  if (phase === "draft") return "📝";
  return "🟡";
}

export function brandCampaignLabel(phase: BrandCampaignPhase, locale: "en" | "zh"): string {
  const labels = {
    en: {
      draft: "Draft",
      awaiting_payment: "Awaiting payment",
      in_progress: "In production",
      waiting_review: "Ready to review",
      completed: "Completed"
    },
    zh: {
      draft: "草稿",
      awaiting_payment: "待付款",
      in_progress: "制作中",
      waiting_review: "待审片",
      completed: "已完成"
    }
  };
  return labels[locale][phase];
}

export function brandCampaignStatusLabel(status: string, locale: "en" | "zh"): string {
  return brandCampaignLabel(brandCampaignPhase(status), locale);
}

export function brandCampaignStepIndex(status: string): number {
  const normalized = normalizeCampaignStatus(status);
  const map: Partial<Record<CampaignProjectStatus, number>> = {
    draft: 0,
    payment_pending: 1,
    contract_pending: 1,
    matching: 2,
    studio_selected: 2,
    proposal: 2,
    production: 3,
    in_review: 4,
    delivered: 4,
    completed: 4
  };
  return map[normalized] ?? 1;
}

export function brandCampaignProgress(status: string): number {
  const index = brandCampaignStepIndex(status);
  return Math.round((index / 4) * 100);
}

export function brandCampaignHref(input: {
  id: string;
  kind: "campaign" | "order";
  status: string;
  projectId?: string | null;
  draftHref?: string;
}): string {
  if (input.kind === "campaign") {
    const normalized = normalizeCampaignStatus(input.status);
    if (normalized === "draft" && input.draftHref) return input.draftHref;
    if (normalized === "in_review") return `/brand/projects/${input.id}/review`;
    if (normalized === "matching") return `/brand/projects/${input.id}/studios`;
    if (["payment_pending", "contract_pending", "studio_selected", "proposal"].includes(normalized)) {
      return `/brand/projects/${input.id}/checkout`;
    }
    if (normalized === "production") return `/brand/projects/${input.id}?tab=production`;
    return `/brand/projects/${input.id}`;
  }

  if (input.status === "review" || input.status === "revision") {
    if (input.projectId) return `/brand/projects/${input.projectId}/review`;
    return `/brand/orders/${input.id}/review`;
  }
  if (input.status === "waiting_payment" && input.projectId) {
    return `/brand/projects/${input.projectId}/checkout`;
  }
  if (input.status === "waiting_payment") {
    return `/dashboard/orders/${input.id}?pay=1`;
  }
  if (input.projectId) return `/brand/projects/${input.projectId}/review`;
  return `/dashboard/orders/${input.id}`;
}

export function estimateBudgetRange(budget?: string | null): string {
  if (budget?.trim()) return budget;
  return "$800~1200";
}

export function estimateDeliveryDays(deadline?: string | null, timelineLabel?: string | null): string {
  if (timelineLabel?.trim()) return timelineLabel;
  if (deadline) {
    const days = Math.max(3, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
    return `${Math.min(days, days + 2)}~${days + 2} Days`;
  }
  return "3~5 Days";
}
