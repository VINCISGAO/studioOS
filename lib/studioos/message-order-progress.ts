import type { Locale } from "@/lib/i18n";
import type { CreatorNotificationType } from "@/lib/notification-types";
import type { StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import type { BrandNotificationType } from "@/lib/studioos/brand-notification-types";
import {
  brandUserPhaseLabels,
  brandUserPhaseSubtitles,
  creatorUserCommercialPhaseLabels,
  creatorUserCommercialPhaseSubtitles,
  creatorUserCommercialPhases,
  mapBrandStepToPhase,
  mapCreatorStepToUserPhase,
  creatorUserCommercialPhaseIndex,
  resolveBrandCommercialStep,
  resolveCreatorCommercialStep,
  userCommercialPhases,
  type BrandCommercialStep,
  type CreatorCommercialStep,
  type CreatorUserCommercialPhase,
  type UserCommercialPhase
} from "@/lib/studioos/commercial-lifecycle";

export type ProgressStep = {
  id: string;
  title: string;
  subtitle: string;
  state: "done" | "current" | "upcoming";
  timestamp?: string;
};

function notificationToCreatorStep(
  notificationType: CreatorNotificationType,
  order: StoredOrder | null
): CreatorCommercialStep {
  if (notificationType === "not_selected") return "waiting_brand_selection";
  if (notificationType === "invitation_match") return "matching_order";
  if (notificationType === "certification_approved") return "matching_order";
  if (notificationType === "creator_selected") return "selected";
  if (notificationType === "order_cancelled_unpaid") return "selected";
  if (notificationType === "project_funded") return "in_production";
  if (notificationType === "review_comment_added") return "pending_review";
  if (notificationType === "revision_requested") return "pending_revision";
  if (notificationType === "delivery_approved") return "completed";
  if (notificationType === "escrow_released") return "completed";

  return resolveCreatorCommercialStep({
    invitationStatus: order ? "selected" : null,
    order,
    deliverableCount: 0
  });
}

function notificationToBrandStep(notificationType: BrandNotificationType): BrandCommercialStep {
  switch (notificationType) {
    case "invitation_accepted":
      return "collecting_candidates";
    case "invitation_declined":
      return "matching";
    case "deliverable_uploaded":
      return "under_review";
    case "comment_resolved":
      return "under_review";
    default:
      return "matching";
  }
}

export function buildBrandMessageProgressSteps(
  project: StoredProject | null,
  order: StoredOrder | null,
  notificationType: BrandNotificationType,
  locale: Locale
): ProgressStep[] {
  const brandStep = project
    ? resolveBrandCommercialStep({
        project,
        order,
        deliverableCount: notificationType === "deliverable_uploaded" ? 1 : 0
      })
    : notificationToBrandStep(notificationType);
  const currentPhase = mapBrandStepToPhase(brandStep);
  const currentIndex = userCommercialPhases.indexOf(currentPhase);
  const zh = locale === "zh";

  return userCommercialPhases.map((phase: UserCommercialPhase, index) => {
    let state: ProgressStep["state"] = "upcoming";
    if (index < currentIndex) state = "done";
    else if (index === currentIndex) state = "current";

    return {
      id: phase,
      title: brandUserPhaseLabels[locale][phase],
      subtitle: brandUserPhaseSubtitles[locale][phase],
      state,
      timestamp:
        phase === "in_production" && state !== "upcoming" && order?.created_at
          ? new Date(order.created_at).toLocaleString(zh ? "zh-CN" : "en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            })
          : undefined
    };
  });
}

export function buildMessageProgressSteps(
  order: StoredOrder | null,
  notificationType: CreatorNotificationType,
  locale: Locale
): ProgressStep[] {
  const creatorStep = notificationToCreatorStep(notificationType, order);
  const commercialContext = order
    ? { order: { payment_status: order.payment_status, status: order.status } }
    : undefined;
  const currentPhase = mapCreatorStepToUserPhase(creatorStep, commercialContext);
  const currentIndex = creatorUserCommercialPhaseIndex(currentPhase);
  const zh = locale === "zh";

  return creatorUserCommercialPhases.map((phase: CreatorUserCommercialPhase, index) => {
    let state: ProgressStep["state"] = "upcoming";
    if (index < currentIndex) state = "done";
    else if (index === currentIndex) state = "current";

    return {
      id: phase,
      title: creatorUserCommercialPhaseLabels[locale][phase],
      subtitle: creatorUserCommercialPhaseSubtitles[locale][phase],
      state,
      timestamp:
        phase === "project_start" && state !== "upcoming" && order?.created_at
          ? new Date(order.created_at).toLocaleString(zh ? "zh-CN" : "en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            })
          : undefined
    };
  });
}
