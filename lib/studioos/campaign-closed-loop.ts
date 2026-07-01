import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import { creatorInvitationCommercialLabel } from "@/lib/studioos/commercial-lifecycle";
import { normalizeCampaignStatus, type CampaignProjectStatus } from "@/lib/studioos/project-status";

const PROJECT_STATUS_STEP: Partial<Record<CampaignProjectStatus, ClosedLoopStep>> = {
  draft: "ad_published",
  matching: "creators_recommended",
  studio_selected: "creator_selected",
  proposal: "creator_selected",
  contract_pending: "creator_selected",
  payment_pending: "creator_selected",
  production: "production_started",
  in_review: "brand_review",
  delivered: "delivered",
  completed: "project_completed"
};

/** Canonical 13-step commercial loop — shared by Brand & Creator UIs */
export type ClosedLoopStep =
  | "ad_published"
  | "creators_recommended"
  | "invitation_received"
  | "invitation_accepted"
  | "creator_selected"
  | "production_started"
  | "v1_uploaded"
  | "brand_review"
  | "revision_round"
  | "brand_approved"
  | "delivered"
  | "escrow_released"
  | "project_completed";

export const closedLoopSteps: ClosedLoopStep[] = [
  "ad_published",
  "creators_recommended",
  "invitation_received",
  "invitation_accepted",
  "creator_selected",
  "production_started",
  "v1_uploaded",
  "brand_review",
  "revision_round",
  "brand_approved",
  "delivered",
  "escrow_released",
  "project_completed"
];

export const closedLoopStepLabels = {
  en: {
    ad_published: "Ad published",
    creators_recommended: "Creators recommended",
    invitation_received: "Invitation sent",
    invitation_accepted: "Creator accepted",
    creator_selected: "Brand selected creator",
    production_started: "Production started",
    v1_uploaded: "V1 uploaded",
    brand_review: "Brand review",
    revision_round: "Revision round",
    brand_approved: "Brand approved",
    delivered: "Delivered",
    escrow_released: "Escrow released",
    project_completed: "Project complete"
  },
  zh: {
    ad_published: "广告主发布广告",
    creators_recommended: "系统推荐 Creator",
    invitation_received: "Creator 收到邀请",
    invitation_accepted: "Creator 接受邀请",
    creator_selected: "Brand 选定 Creator",
    production_started: "项目开始制作",
    v1_uploaded: "Creator 上传 V1",
    brand_review: "Brand 审核",
    revision_round: "修改（可多轮）",
    brand_approved: "Brand 通过",
    delivered: "交付",
    escrow_released: "平台放款",
    project_completed: "项目完成"
  }
} as const;

export type InvitationLifecycleStatus =
  | "pending"
  | "accepted"
  | "selected"
  | "not_selected"
  | "declined"
  | "expired";

export function invitationStatusLabel(status: string, locale: "en" | "zh") {
  return creatorInvitationCommercialLabel(status, locale);
}

export function resolveClosedLoopStep(input: {
  project?: StoredProject | null;
  order?: StoredOrder | null;
  invitationStatus?: InvitationLifecycleStatus | string | null;
  deliverableCount?: number;
  openReviewComments?: number;
}): ClosedLoopStep {
  const projectStatus = input.project ? normalizeCampaignStatus(input.project.status) : null;
  const order = input.order;

  if (!input.project && input.invitationStatus === "pending") {
    return "invitation_received";
  }
  if (input.invitationStatus === "pending") {
    return "creators_recommended";
  }
  if (input.invitationStatus === "accepted") {
    return "invitation_accepted";
  }
  if (input.invitationStatus === "declined" || input.invitationStatus === "expired") {
    return "invitation_received";
  }

  if (projectStatus) {
    if (projectStatus === "production") {
      if ((input.deliverableCount ?? 0) === 0) return "production_started";
      return "v1_uploaded";
    }

    const mapped = PROJECT_STATUS_STEP[projectStatus];
    if (mapped) return mapped;
  }

  if (order) {
    if (order.status === "waiting_payment") return "creator_selected";
    if (order.status === "in_production" && (input.deliverableCount ?? 0) === 0) return "production_started";
    if (order.status === "revision") return "revision_round";
    if (order.status === "review") return "brand_review";
    if (order.status === "completed" && order.payout_status === "paid") return "project_completed";
    if (order.status === "completed" && order.payment_status === "released") return "escrow_released";
    if (order.status === "completed") return "delivered";
    if ((input.deliverableCount ?? 0) > 0 && order.status === "in_production") return "v1_uploaded";
  }

  if (input.invitationStatus === "selected") return "production_started";
  return "ad_published";
}

export function closedLoopProgressIndex(step: ClosedLoopStep) {
  return closedLoopSteps.indexOf(step);
}
