import { isOrderPaymentEscrowed, type StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

export type BrandCommercialContext = {
  order?: Pick<Partial<StoredOrder>, "payment_status" | "status"> | null;
  project?: Pick<StoredProject, "status"> | null;
};

export type CreatorCommercialContext = {
  order?: Pick<Partial<StoredOrder>, "payment_status" | "status" | "creator_id"> | null;
};

export function isBrandAwaitingPayment(context: BrandCommercialContext): boolean {
  const projectStatus = context.project ? normalizeCampaignStatus(context.project.status) : null;
  if (projectStatus === "cancelled" || context.order?.status === "cancelled") {
    return false;
  }
  if (projectStatus && ["production", "in_review", "delivered", "completed"].includes(projectStatus)) {
    return false;
  }

  const paymentStatus = context.order?.payment_status;
  if (paymentStatus && isOrderPaymentEscrowed(paymentStatus)) {
    return false;
  }

  if (paymentStatus === "unpaid") return true;
  if (context.order?.status === "waiting_payment") return true;

  if (
    projectStatus &&
    ["payment_pending", "contract_pending", "studio_selected", "proposal"].includes(projectStatus)
  ) {
    return true;
  }

  return false;
}

export function isCreatorAwaitingPayment(context: CreatorCommercialContext): boolean {
  if (context.order?.payment_status === "unpaid") return true;
  if (context.order?.status === "waiting_payment") return true;
  return false;
}

/** Brand-side commercial lifecycle — project owner view */
export type BrandCommercialStep =
  | "publish_requirement"
  | "matching"
  | "invitations_sent"
  | "collecting_candidates"
  | "select_creator"
  | "creator_selected"
  | "in_production"
  | "under_review"
  | "approved"
  | "pending_delivery"
  | "pending_settlement"
  | "completed";

/** Creator-side commercial lifecycle — invitation / order view */
export type CreatorCommercialStep =
  | "matching_order"
  | "intent_declined"
  | "waiting_brand_selection"
  | "selected"
  | "in_production"
  | "pending_review"
  | "pending_revision"
  | "pending_delivery"
  | "pending_settlement"
  | "completed";

export const brandCommercialSteps: BrandCommercialStep[] = [
  "publish_requirement",
  "matching",
  "invitations_sent",
  "collecting_candidates",
  "select_creator",
  "creator_selected",
  "in_production",
  "under_review",
  "approved",
  "pending_delivery",
  "pending_settlement",
  "completed"
];

export const creatorCommercialSteps: CreatorCommercialStep[] = [
  "matching_order",
  "waiting_brand_selection",
  "selected",
  "in_production",
  "pending_review",
  "pending_revision",
  "pending_delivery",
  "pending_settlement",
  "completed"
];

export const brandCommercialStepLabels = {
  en: {
    publish_requirement: "Requirement published",
    matching: "Matching creators",
    invitations_sent: "Intent invitations sent",
    collecting_candidates: "Collecting candidates",
    select_creator: "Select creator",
    creator_selected: "Creator selected",
    in_production: "In production",
    under_review: "Under review",
    approved: "Approved",
    pending_delivery: "Pending delivery",
    pending_settlement: "Pending settlement",
    completed: "Completed"
  },
  zh: {
    publish_requirement: "发布需求",
    matching: "匹配中",
    invitations_sent: "意向邀请已发送",
    collecting_candidates: "候选人收集中",
    select_creator: "选择创作者",
    creator_selected: "已选中创作者",
    in_production: "制作中",
    under_review: "审核中",
    approved: "已通过",
    pending_delivery: "待交付",
    pending_settlement: "待结算",
    completed: "已完成"
  }
} as const;

export const creatorCommercialStepLabels = {
  en: {
    matching_order: "Matching order",
    intent_declined: "Intent declined",
    waiting_brand_selection: "Waiting for brand selection",
    selected: "Selected",
    in_production: "In production",
    pending_review: "Pending review",
    pending_revision: "Pending revision",
    pending_delivery: "Pending delivery",
    pending_settlement: "Pending settlement",
    completed: "Completed"
  },
  zh: {
    matching_order: "匹配订单",
    intent_declined: "已拒绝意向",
    waiting_brand_selection: "等待项目方选择",
    selected: "已被选中",
    in_production: "制作中",
    pending_review: "待审核",
    pending_revision: "待修改",
    pending_delivery: "待交付",
    pending_settlement: "待结算",
    completed: "已完成"
  }
} as const;

export function brandCommercialProgressIndex(step: BrandCommercialStep) {
  return brandCommercialSteps.indexOf(step);
}

export function creatorCommercialProgressIndex(step: CreatorCommercialStep) {
  return creatorCommercialSteps.indexOf(step);
}

function resolvePostSelectionBrandStep(input: {
  project: StoredProject;
  order?: StoredOrder | null;
  deliverableCount?: number;
}): BrandCommercialStep {
  const order = input.order;
  const projectStatus = normalizeCampaignStatus(input.project.status);

  if (order) {
    if (order.payment_status === "unpaid" || order.status === "waiting_payment") {
      return "creator_selected";
    }
    if (order.status === "revision") return "under_review";
    if (order.status === "review") return "under_review";
    if (order.status === "completed" && order.payout_status === "paid") return "completed";
    if (order.status === "completed" && order.payout_status === "approved") return "completed";
    if (order.status === "completed") return "approved";
    if ((input.deliverableCount ?? 0) > 0 && order.status === "in_production") return "under_review";
    if (order.status === "in_production") return "in_production";
  }

  if (projectStatus === "in_review") return "under_review";
  if (projectStatus === "delivered") return "pending_delivery";
  if (projectStatus === "completed") return "completed";
  if (projectStatus === "production") {
    if (order?.payment_status === "unpaid" || order?.status === "waiting_payment") {
      return "creator_selected";
    }
    if ((input.deliverableCount ?? 0) === 0) return "in_production";
    return "under_review";
  }

  return "creator_selected";
}

function resolvePostSelectionCreatorStep(input: {
  order?: StoredOrder | null;
  deliverableCount?: number;
}): CreatorCommercialStep {
  const order = input.order;
  if (!order) return "selected";

  if (order.status === "revision") return "pending_revision";
  if (order.status === "review") return "pending_review";
  if (order.status === "completed" && order.payout_status === "paid") return "completed";
  if (order.status === "completed" && order.payout_status === "approved") return "completed";
  if (order.status === "completed") return "pending_delivery";
  if ((input.deliverableCount ?? 0) > 0 && order.status === "in_production") return "pending_review";
  if (order.status === "in_production") return "in_production";
  if (order.status === "waiting_payment") return "selected";

  return "selected";
}

export function resolveBrandCommercialStep(input: {
  project: StoredProject;
  order?: StoredOrder | null;
  invitations?: StoredCreatorInvitation[];
  deliverableCount?: number;
}): BrandCommercialStep {
  const status = normalizeCampaignStatus(input.project.status);
  const invitations = input.invitations ?? [];
  const acceptedCount = invitations.filter((item) => item.status === "accepted").length;
  const pendingCount = invitations.filter((item) => item.status === "pending").length;
  const hasInvitations = invitations.length > 0;

  if (status === "draft") return "publish_requirement";

  if (input.project.selected_studio_id || ["production", "in_review", "delivered", "completed"].includes(status)) {
    return resolvePostSelectionBrandStep(input);
  }

  if (status === "matching") {
    if (!hasInvitations) return "matching";
    if (acceptedCount > 0 && pendingCount === 0) return "select_creator";
    if (acceptedCount > 0) return "collecting_candidates";
    if (pendingCount > 0) return "invitations_sent";
    return "matching";
  }

  if (["studio_selected", "proposal", "contract_pending", "payment_pending"].includes(status)) {
    return "creator_selected";
  }

  return "publish_requirement";
}

export function resolveCreatorCommercialStep(input: {
  invitationStatus?: string | null;
  order?: StoredOrder | null;
  deliverableCount?: number;
}): CreatorCommercialStep {
  const status = input.invitationStatus;

  if (status === "declined" || status === "expired" || status === "not_selected") return "intent_declined";
  if (status === "pending") return "matching_order";
  if (status === "accepted") return "waiting_brand_selection";

  if (status === "selected" || input.order) {
    return resolvePostSelectionCreatorStep(input);
  }

  return "matching_order";
}

export function brandCommercialStatusLabel(
  step: BrandCommercialStep,
  locale: "en" | "zh"
): string {
  return brandCommercialStepLabels[locale][step];
}

export function creatorCommercialStatusLabel(
  step: CreatorCommercialStep,
  locale: "en" | "zh"
): string {
  return creatorCommercialStepLabels[locale][step];
}

/** User-facing commercial phases — backend keeps granular steps; UI shows four. */
export type UserCommercialPhase = "publish_requirement" | "recruiting" | "in_production" | "completed";

export const userCommercialPhases: UserCommercialPhase[] = [
  "publish_requirement",
  "recruiting",
  "in_production",
  "completed"
];

export const brandUserPhaseLabels = {
  en: {
    publish_requirement: "Publish requirements",
    recruiting: "Recruiting",
    in_production: "In production",
    completed: "Completed"
  },
  zh: {
    publish_requirement: "需求发布",
    recruiting: "项目邀请",
    in_production: "制作中",
    completed: "已完成"
  }
} as const;

export const creatorUserPhaseLabels = {
  en: {
    publish_requirement: "Requirements",
    recruiting: "Project invitation",
    in_production: "In production",
    completed: "Completed"
  },
  zh: {
    publish_requirement: "需求发布",
    recruiting: "项目邀请",
    in_production: "制作中",
    completed: "已完成"
  }
} as const;

export const brandUserPhaseSubtitles = {
  en: {
    publish_requirement: "Brand publishes the project brief",
    recruiting: "Finding the right creator",
    in_production: "Creator is producing",
    completed: "Project successfully completed"
  },
  zh: {
    publish_requirement: "项目方发布需求",
    recruiting: "向创作者发出邀请",
    in_production: "创作者制作中",
    completed: "托管款已自动释放"
  }
} as const;

export const creatorUserPhaseSubtitles = {
  en: {
    publish_requirement: "Brand publishes requirements",
    recruiting: "Brand invitation and shortlist",
    in_production: "You were selected — start producing",
    completed: "Project closed — escrow released to your income"
  },
  zh: {
    publish_requirement: "项目方发布需求",
    recruiting: "收到项目方邀请与候选流程",
    in_production: "已被选中，开始制作",
    completed: "项目结束，托管款已自动释放"
  }
} as const;

/** Creator portal — four user-facing steps (invitation → delivery). */
export type CreatorUserCommercialPhase =
  | "invitation"
  | "cooperation"
  | "project_start"
  | "final_delivery";

export const creatorUserCommercialPhases: CreatorUserCommercialPhase[] = [
  "invitation",
  "cooperation",
  "project_start",
  "final_delivery"
];

export const creatorUserCommercialPhaseLabels = {
  en: {
    invitation: "Project invitation",
    cooperation: "Partnership confirmed",
    project_start: "Project kickoff",
    final_delivery: "Final delivery"
  },
  zh: {
    invitation: "项目邀请",
    cooperation: "达成合作",
    project_start: "项目开始",
    final_delivery: "定稿交付"
  }
} as const;

export const creatorUserCommercialPhaseSubtitles = {
  en: {
    invitation: "Receive invitations and enter the shortlist flow",
    cooperation: "Brand and creator choose each other",
    project_start: "Upload, review, and revise deliverables",
    final_delivery: "Payment released after collaboration completes"
  },
  zh: {
    invitation: "收到项目方邀请与候选流程",
    cooperation: "甲乙双方互相选择",
    project_start: "经过上传，审查，修改",
    final_delivery: "合作完成后发放款项"
  }
} as const;

const creatorStepToUserPhase: Record<CreatorCommercialStep, CreatorUserCommercialPhase> = {
  matching_order: "invitation",
  intent_declined: "invitation",
  waiting_brand_selection: "cooperation",
  selected: "cooperation",
  in_production: "project_start",
  pending_review: "project_start",
  pending_revision: "project_start",
  pending_delivery: "project_start",
  pending_settlement: "final_delivery",
  completed: "final_delivery"
};

export function mapCreatorStepToUserPhase(
  step: CreatorCommercialStep,
  context?: CreatorCommercialContext
): CreatorUserCommercialPhase {
  if (step === "selected" && context?.order?.creator_id) {
    return "project_start";
  }
  if (step === "selected" && context && isCreatorAwaitingPayment(context)) {
    return "cooperation";
  }
  return creatorStepToUserPhase[step];
}

export function creatorUserCommercialPhaseIndex(phase: CreatorUserCommercialPhase) {
  return creatorUserCommercialPhases.indexOf(phase);
}

export function creatorUserCommercialPhaseLabel(
  phase: CreatorUserCommercialPhase,
  locale: "en" | "zh"
): string {
  return creatorUserCommercialPhaseLabels[locale][phase];
}

const brandStepToPhase: Record<BrandCommercialStep, UserCommercialPhase> = {
  publish_requirement: "publish_requirement",
  matching: "recruiting",
  invitations_sent: "recruiting",
  collecting_candidates: "recruiting",
  select_creator: "recruiting",
  creator_selected: "in_production",
  in_production: "in_production",
  under_review: "in_production",
  approved: "in_production",
  pending_delivery: "in_production",
  pending_settlement: "completed",
  completed: "completed"
};

const creatorStepToPhase: Record<CreatorCommercialStep, UserCommercialPhase> = {
  matching_order: "recruiting",
  intent_declined: "recruiting",
  waiting_brand_selection: "recruiting",
  selected: "in_production",
  in_production: "in_production",
  pending_review: "in_production",
  pending_revision: "in_production",
  pending_delivery: "in_production",
  pending_settlement: "completed",
  completed: "completed"
};

export function mapBrandStepToPhase(
  step: BrandCommercialStep,
  context?: BrandCommercialContext
): UserCommercialPhase {
  if (step === "creator_selected" && context && isBrandAwaitingPayment(context)) {
    return "recruiting";
  }
  return brandStepToPhase[step];
}

export function mapCreatorStepToPhase(
  step: CreatorCommercialStep,
  context?: CreatorCommercialContext
): UserCommercialPhase {
  if (step === "selected" && context?.order?.creator_id) {
    return "in_production";
  }
  if (step === "selected" && context && isCreatorAwaitingPayment(context)) {
    return "recruiting";
  }
  return creatorStepToPhase[step];
}

export function userCommercialPhaseIndex(phase: UserCommercialPhase) {
  return userCommercialPhases.indexOf(phase);
}

export function brandUserPhaseLabel(phase: UserCommercialPhase, locale: "en" | "zh"): string {
  return brandUserPhaseLabels[locale][phase];
}

export function creatorUserPhaseLabel(phase: UserCommercialPhase, locale: "en" | "zh"): string {
  return creatorUserPhaseLabels[locale][phase];
}

export function brandCommercialPhaseLabel(
  step: BrandCommercialStep,
  locale: "en" | "zh",
  context?: BrandCommercialContext
): string {
  if (step === "creator_selected" && context && isBrandAwaitingPayment(context)) {
    return locale === "zh" ? "待付款" : "Awaiting payment";
  }
  return brandUserPhaseLabel(mapBrandStepToPhase(step, context), locale);
}

export function creatorCommercialPhaseLabel(
  step: CreatorCommercialStep,
  locale: "en" | "zh",
  context?: CreatorCommercialContext
): string {
  if (step === "selected" && context?.order?.creator_id) {
    return locale === "zh" ? "正式项目" : "Active Project";
  }
  if (step === "selected" && context && isCreatorAwaitingPayment(context)) {
    return locale === "zh" ? "待品牌付款" : "Awaiting brand payment";
  }
  return creatorUserCommercialPhaseLabel(mapCreatorStepToUserPhase(step, context), locale);
}

export function resolveBrandNextActorHint(
  step: BrandCommercialStep,
  locale: "en" | "zh",
  context?: {
    orderStatus?: string | null;
    hasOpenComments?: boolean;
    commercialContext?: BrandCommercialContext;
  }
): string {
  const commercialContext = context?.commercialContext;
  const phase = mapBrandStepToPhase(step, commercialContext);
  const orderStatus = context?.orderStatus ?? null;
  const hasOpenComments = context?.hasOpenComments ?? false;
  const awaitingPayment = commercialContext ? isBrandAwaitingPayment(commercialContext) : false;

  if (phase === "publish_requirement") {
    return locale === "zh" ? "下一步：完善需求并发布招募" : "Next: finalize the brief and start recruiting";
  }

  if (phase === "recruiting") {
    if (step === "creator_selected" && awaitingPayment) {
      return locale === "zh" ? "下一步：完成托管付款" : "Next: complete escrow payment";
    }
    if (step === "select_creator") {
      return locale === "zh" ? "下一步：请选择创作者" : "Next: select a creator";
    }
    if (step === "collecting_candidates" || step === "invitations_sent") {
      return locale === "zh" ? "下一步：等待创作者响应" : "Next: waiting for creator responses";
    }
    return locale === "zh" ? "下一步：向创作者发出邀请" : "Next: invite creators";
  }

  if (phase === "in_production") {
    if (orderStatus === "revision") {
      return locale === "zh" ? "下一步：创作者修改中" : "Next: creator is revising";
    }
    if (hasOpenComments) {
      return locale === "zh" ? "下一步：创作者处理批注" : "Next: creator resolves notes";
    }
    if (step === "under_review") {
      return locale === "zh" ? "下一步：请您审片验收" : "Next: review and approve delivery";
    }
    if (step === "creator_selected") {
      return locale === "zh" ? "下一步：创作者开始制作" : "Next: creator starts production";
    }
    return locale === "zh" ? "下一步：创作者制作中" : "Next: creator is producing";
  }

  if (step === "pending_settlement") {
    return locale === "zh" ? "托管款释放处理中" : "Escrow release in progress";
  }
  if (step === "completed") {
    return locale === "zh" ? "托管款已自动释放" : "Escrow released automatically";
  }
  return locale === "zh" ? "项目已结束" : "Project finished";
}

export function resolveCreatorNextActorHint(
  step: CreatorCommercialStep,
  locale: "en" | "zh",
  context?: { orderStatus?: string | null; commercialContext?: CreatorCommercialContext }
): string {
  const commercialContext = context?.commercialContext;
  const phase = mapCreatorStepToUserPhase(step, commercialContext);
  const orderStatus = context?.orderStatus ?? null;
  const awaitingPayment = commercialContext ? isCreatorAwaitingPayment(commercialContext) : false;

  if (phase === "invitation") {
    if (step === "intent_declined") {
      return locale === "zh" ? "您已拒绝此邀请" : "You declined this invitation";
    }
    return locale === "zh" ? "下一步：查看并接受项目邀请" : "Next: review and accept the invitation";
  }

  if (phase === "cooperation") {
    if (step === "selected" && commercialContext?.order?.creator_id) {
      return locale === "zh"
        ? "下一步：确认创意方向，然后上传 V1"
        : "Next: confirm creative direction, then upload V1";
    }
    if (step === "selected" && awaitingPayment) {
      return locale === "zh"
        ? "下一步：等待品牌完成托管付款后再开始制作"
        : "Next: wait for brand escrow payment before production";
    }
    if (step === "waiting_brand_selection") {
      return locale === "zh" ? "下一步：等待项目方选择" : "Next: waiting for brand selection";
    }
    return locale === "zh" ? "下一步：等待双方确认合作" : "Next: confirm the partnership";
  }

  if (phase === "project_start") {
    if (step === "pending_revision" || orderStatus === "revision") {
      return locale === "zh" ? "下一步：修改并上传新版本" : "Next: revise and upload a new version";
    }
    if (step === "pending_review") {
      return locale === "zh" ? "下一步：等待品牌审片" : "Next: waiting for brand review";
    }
    if (step === "selected") {
      return locale === "zh" ? "下一步：进入项目工作台开始制作" : "Next: open workspace and start producing";
    }
    return locale === "zh" ? "下一步：上传审片版本" : "Next: upload review version";
  }

  if (step === "pending_settlement") {
    return locale === "zh" ? "托管款释放处理中" : "Escrow release in progress";
  }
  if (step === "completed") {
    return locale === "zh" ? "托管款已自动释放至收入账户" : "Escrow released to your income";
  }
  return locale === "zh" ? "项目已结束" : "Project finished";
}

export function creatorInvitationCommercialLabel(status: string, locale: "en" | "zh"): string {
  const map = {
    en: {
      pending: "Awaiting response",
      accepted: "Accepted · waiting for brand",
      selected: "Selected · awaiting payment",
      not_selected: "Assigned to another creator",
      declined: "Declined",
      expired: "Closed"
    },
    zh: {
      pending: "等待回复",
      accepted: "已接受邀请 · 等待品牌确认",
      selected: "🎉 已被选中 · 等待付款",
      not_selected: "已由其他创作者接单",
      declined: "已拒绝",
      expired: "已失效"
    }
  } as const;
  return map[locale][status as keyof typeof map.en] ?? status;
}
