/**
 * Campaign project lifecycle — Architect #2 §3
 */
export type CampaignProjectStatus =
  | "draft"
  | "matching"
  | "studio_selected"
  | "proposal"
  | "contract_pending"
  | "payment_pending"
  | "production"
  | "in_review"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

export type ProjectEventName =
  | "project.created"
  | "project.step_completed"
  | "project.publish"
  | "project.match_completed"
  | "project.campaign_funded"
  | "project.creator_assigned"
  | "project.studio_selected"
  | "project.proposal_opened"
  | "project.proposal_accepted"
  | "project.contract_signed"
  | "project.payment_received"
  | "project.deliverable_uploaded"
  | "project.revision_requested"
  | "project.delivery_approved"
  | "project.escrow_released"
  | "project.cancelled"
  | "project.dispute_opened";

export type ProjectActorRole = "brand" | "studio" | "admin" | "system";

export type TransitionResult =
  | { ok: true; status: CampaignProjectStatus }
  | { ok: false; code: "INVALID_TRANSITION" | "PRECONDITION_FAILED"; message: string };

/** Map legacy seed / order-adjacent statuses into the campaign model. */
export function normalizeCampaignStatus(raw: string): CampaignProjectStatus {
  const map: Record<string, CampaignProjectStatus> = {
    submitted: "draft",
    approved: "draft",
    draft: "draft",
    matching: "matching",
    matched: "studio_selected",
    studio_selected: "studio_selected",
    assigned: "studio_selected",
    proposal: "proposal",
    contract_pending: "contract_pending",
    waiting_payment: "payment_pending",
    payment_pending: "payment_pending",
    confirmed: "payment_pending",
    paid: "production",
    production: "production",
    in_production: "production",
    review: "in_review",
    in_review: "in_review",
    revision: "production",
    delivered: "delivered",
    completed: "completed",
    cancelled: "cancelled",
    disputed: "disputed",
    refunded: "cancelled"
  };

  return map[raw] ?? "draft";
}

type TransitionRule = {
  from: CampaignProjectStatus[];
  to: CampaignProjectStatus;
};

export const PROJECT_TRANSITIONS: Partial<Record<ProjectEventName, TransitionRule>> = {
  "project.publish": { from: ["draft"], to: "payment_pending" },
  "project.campaign_funded": { from: ["payment_pending"], to: "matching" },
  "project.creator_assigned": { from: ["matching"], to: "production" },
  "project.studio_selected": { from: ["matching"], to: "studio_selected" },
  "project.proposal_opened": { from: ["studio_selected"], to: "proposal" },
  "project.proposal_accepted": { from: ["proposal"], to: "contract_pending" },
  "project.contract_signed": { from: ["contract_pending"], to: "payment_pending" },
  "project.payment_received": { from: ["payment_pending"], to: "production" },
  "project.deliverable_uploaded": { from: ["production"], to: "in_review" },
  "project.revision_requested": { from: ["in_review"], to: "production" },
  "project.delivery_approved": { from: ["in_review"], to: "delivered" },
  "project.escrow_released": { from: ["delivered"], to: "completed" },
  "project.cancelled": {
    from: [
      "draft",
      "matching",
      "studio_selected",
      "proposal",
      "contract_pending",
      "payment_pending",
      "production",
      "in_review",
      "delivered"
    ],
    to: "cancelled"
  },
  "project.dispute_opened": { from: ["production", "in_review"], to: "disputed" }
};

export function validateProjectTransition(
  current: CampaignProjectStatus,
  event: ProjectEventName
): TransitionResult {
  const rule = PROJECT_TRANSITIONS[event];
  if (!rule) {
    if (event === "project.created" || event === "project.step_completed" || event === "project.match_completed") {
      return { ok: true, status: current };
    }
    return { ok: false, code: "INVALID_TRANSITION", message: `Unknown event: ${event}` };
  }

  if (!rule.from.includes(current)) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: `Cannot apply ${event} from status ${current}`
    };
  }

  return { ok: true, status: rule.to };
}

export function canPublishProject(input: {
  status: CampaignProjectStatus;
  wizard_completed_steps: number[];
}): { ok: boolean; missing: string[] } {
  const required = [1, 2, 3, 4, 5, 6];
  const missing = required.filter((step) => !input.wizard_completed_steps.includes(step));
  if (input.status !== "draft") {
    return { ok: false, missing: ["project_not_draft"] };
  }
  return { ok: missing.length === 0, missing: missing.map((s) => `wizard_step_${s}`) };
}
