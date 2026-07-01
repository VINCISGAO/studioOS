import type { Locale } from "@/lib/i18n";
import type { CreatorNotificationType } from "@/lib/notification-types";
import type { StoredOrder } from "@/lib/order-types";
import {
  creatorUserPhaseLabels,
  creatorUserPhaseSubtitles,
  mapCreatorStepToPhase,
  resolveCreatorCommercialStep,
  userCommercialPhases,
  type CreatorCommercialStep,
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
  if (notificationType === "creator_selected") return "selected";
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

export function buildMessageProgressSteps(
  order: StoredOrder | null,
  notificationType: CreatorNotificationType,
  locale: Locale
): ProgressStep[] {
  const creatorStep = notificationToCreatorStep(notificationType, order);
  const currentPhase = mapCreatorStepToPhase(creatorStep);
  const currentIndex = userCommercialPhases.indexOf(currentPhase);
  const zh = locale === "zh";

  return userCommercialPhases.map((phase: UserCommercialPhase, index) => {
    let state: ProgressStep["state"] = "upcoming";
    if (index < currentIndex) state = "done";
    else if (index === currentIndex) state = "current";

    return {
      id: phase,
      title: creatorUserPhaseLabels[locale][phase],
      subtitle: creatorUserPhaseSubtitles[locale][phase],
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
