import type { StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import { isResolvableCampaignCreatorId } from "@/lib/studioos/brand-checkout-utils";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";

export function parseBudgetAmount(raw: string, fallback: number) {
  const match = raw.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

function selectedCreatorInvitation(input: {
  project: StoredProject;
  creatorId: string;
  amount: number;
}): StoredCreatorInvitation {
  const now = input.project.updated_at || input.project.created_at || new Date().toISOString();
  return {
    id: `selected_${input.project.id}_${input.creatorId}`,
    campaignId: input.project.id,
    projectId: input.project.id,
    creatorId: input.creatorId,
    brandEmail: input.project.client_email,
    title: input.project.title || input.project.product_name || input.project.company_name,
    brandName: input.project.company_name || input.project.client_name,
    budget: input.amount,
    currency: "USD",
    deadline: input.project.deadline,
    platform: input.project.target_platform || null,
    matchScore: 100,
    status: "accepted",
    expiresAt: null,
    createdAt: now
  };
}

export function ensureSelectedCreatorInInvitations(input: {
  invitations: StoredCreatorInvitation[];
  accepted: StoredCreatorInvitation[];
  project: StoredProject;
  linkedOrder: StoredOrder | null;
}) {
  const creatorId = [input.project.selected_studio_id, input.linkedOrder?.creator_id].find(
    isResolvableCampaignCreatorId
  );
  if (!creatorId) {
    return { invitations: input.invitations, accepted: input.accepted, selectedCreatorId: null as string | null };
  }

  const existing =
    input.invitations.find((item) => item.creatorId === creatorId) ??
    input.accepted.find((item) => item.creatorId === creatorId);
  const selected: StoredCreatorInvitation =
    existing
      ? { ...existing, status: "accepted" }
      : selectedCreatorInvitation({
          project: input.project,
          creatorId,
          amount:
            input.linkedOrder?.amount ??
            parseBudgetAmount(input.project.budget_range, input.project.budget_max ?? input.project.budget_min ?? 0)
        });

  const mergeByCreator = (items: StoredCreatorInvitation[]) => [
    selected,
    ...items.filter((item) => item.creatorId !== creatorId)
  ];

  return {
    invitations: mergeByCreator(input.invitations),
    accepted: mergeByCreator(input.accepted.filter((item) => item.status === "accepted")),
    selectedCreatorId: creatorId
  };
}
