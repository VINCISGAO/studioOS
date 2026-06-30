import { DEMO_PROJECT_ID, findCampaignIdByMvpReviewProjectId } from "@/lib/project-service";
import { getProject as getCampaignProject, updateProject } from "@/lib/project-service";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import {
  DEMO_PROFILES,
  fileAddVersion,
  fileCreateProject,
  fileGetProfileByEmail,
  fileListVersions,
  fileUpdateProjectStatus
} from "@/lib/mvp/store-file";
import {
  getProject as getMvpProject,
  getReviewBundle,
  updateProjectStatus as updateMvpProjectStatus
} from "@/lib/mvp/store";
import type { ProjectStatus } from "@/lib/mvp/types";
import { isPendingSettlement, isSettled, reviewIsLocked } from "@/lib/mvp/review-settlement";
import { getPrismaReviewBundleForLegacyProject } from "@/features/review/prisma-review-bundle";

const MVP_LINK_KEY = "mvp_review_project_id";

/** Known demo campaign → unified review project */
const KNOWN_CAMPAIGN_TO_MVP: Record<string, string> = {
  [DEMO_PROJECT_ID]: "proj_mvp_demo_01"
};

const CREATOR_TO_STUDIO_PROFILE: Record<string, string> = {
  creator_01: DEMO_PROFILES.studio,
  creator_02: DEMO_PROFILES.studio,
  creator_03: DEMO_PROFILES.studio
};

export function readMvpReviewProjectId(campaign: StoredProject): string | null {
  const linked = campaign.settings_json?.[MVP_LINK_KEY];
  if (typeof linked === "string" && linked.trim()) {
    return linked;
  }
  return KNOWN_CAMPAIGN_TO_MVP[campaign.id] ?? null;
}

export async function findCampaignIdForMvpProject(mvpProjectId: string): Promise<string | null> {
  return findCampaignIdByMvpReviewProjectId(mvpProjectId);
}

export async function resolveMvpReviewRedirect(projectId: string, query: string): Promise<string> {
  const campaignId = await findCampaignIdForMvpProject(projectId);
  if (campaignId) {
    return `/brand/projects/${campaignId}/review?${query}`;
  }
  return `/workspace/projects/${projectId}/review?${query}`;
}

function mapOrderStatusToMvp(order?: StoredOrder | null, campaign?: StoredProject): ProjectStatus {
  if (order?.status === "revision") return "revision";
  if (order?.status === "completed") return "pending_settlement";
  if (campaign?.status === "delivered" || campaign?.status === "completed") return "pending_settlement";
  return "in_review";
}

async function resolveBrandProfileId(campaign: StoredProject): Promise<string> {
  const byEmail = await fileGetProfileByEmail(campaign.client_email.toLowerCase());
  if (byEmail) return byEmail.id;
  return DEMO_PROFILES.brand;
}

async function resolveStudioProfileId(
  campaign: StoredProject,
  order?: StoredOrder | null
): Promise<string | null> {
  const creatorId = order?.creator_id ?? campaign.selected_studio_id;
  if (creatorId && CREATOR_TO_STUDIO_PROFILE[creatorId]) {
    return CREATOR_TO_STUDIO_PROFILE[creatorId];
  }
  if (order?.creator_id) {
    const { getCreatorById } = await import("@/lib/creator-service");
    const creator = await getCreatorById(order.creator_id);
    if (creator?.email) {
      const profile = await fileGetProfileByEmail(creator.email.toLowerCase());
      if (profile) return profile.id;
    }
  }
  return DEMO_PROFILES.studio;
}

async function linkCampaignToMvp(campaignId: string, mvpProjectId: string, campaign: StoredProject) {
  await updateProject(campaignId, {
    settings_json: {
      ...campaign.settings_json,
      [MVP_LINK_KEY]: mvpProjectId
    }
  });
}

async function syncDeliverablesToMvp(
  mvpProjectId: string,
  deliverables: StoredDeliverable[],
  studioProfileId: string
) {
  if (!deliverables.length) return;

  const existing = await fileListVersions(mvpProjectId);
  if (existing.length >= deliverables.length) return;

  const sorted = [...deliverables].sort((a, b) => a.version - b.version);
  for (const item of sorted) {
    if (existing.some((v) => v.version_number === item.version)) continue;
    await fileAddVersion({
      project_id: mvpProjectId,
      file_url: item.file_url,
      file_path: item.file_url,
      uploaded_by: studioProfileId
    });
  }
}

async function syncMvpStatus(mvpProjectId: string, order?: StoredOrder | null, campaign?: StoredProject) {
  const current = await getMvpProject(mvpProjectId);
  if (!current || reviewIsLocked(current.status)) return;

  const next = mapOrderStatusToMvp(order, campaign);
  if (current.status !== next && !isPendingSettlement(current.status) && !isSettled(current.status)) {
    await updateMvpProjectStatus(mvpProjectId, next);
  }
}

export async function ensureMvpReviewProjectForCampaign(
  campaignId: string,
  input?: { order?: StoredOrder | null; deliverables?: StoredDeliverable[] }
): Promise<string> {
  const campaign = await getCampaignProject(campaignId);
  if (!campaign) {
    throw new Error("Campaign project not found");
  }

  const order = input?.order ?? null;
  const deliverables = input?.deliverables ?? [];
  const studioProfileId = await resolveStudioProfileId(campaign, order);

  let mvpProjectId = readMvpReviewProjectId(campaign);
  if (mvpProjectId) {
    const existing = await getMvpProject(mvpProjectId);
    if (existing) {
      if (studioProfileId && deliverables.length) {
        await syncDeliverablesToMvp(mvpProjectId, deliverables, studioProfileId);
      }
      await syncMvpStatus(mvpProjectId, order, campaign);
      return mvpProjectId;
    }
  }

  const brandProfileId = await resolveBrandProfileId(campaign);
  const created = await fileCreateProject({
    title: campaign.title,
    description: campaign.campaign_goal || campaign.notes || "",
    brand_name: campaign.company_name || campaign.client_name,
    created_by: brandProfileId,
    assigned_studio_id: studioProfileId
  });

  mvpProjectId = created.id;
  await linkCampaignToMvp(campaignId, mvpProjectId, campaign);

  const targetStatus = mapOrderStatusToMvp(order, campaign);
  if (created.status !== targetStatus) {
    await fileUpdateProjectStatus(mvpProjectId, targetStatus);
  }

  if (studioProfileId && deliverables.length) {
    await syncDeliverablesToMvp(mvpProjectId, deliverables, studioProfileId);
  }

  return mvpProjectId;
}

export async function getUnifiedReviewBundleForCampaign(campaignId: string, input?: {
  order?: StoredOrder | null;
  deliverables?: StoredDeliverable[];
  viewerUserId?: string;
}) {
  const mvpProjectId = await ensureMvpReviewProjectForCampaign(campaignId, input);
  const prismaBundle = await getPrismaReviewBundleForLegacyProject(
    campaignId,
    mvpProjectId,
    input?.viewerUserId
  );
  if (prismaBundle) {
    return { mvpProjectId, bundle: prismaBundle };
  }

  const bundle = await getReviewBundle(mvpProjectId);
  if (!bundle) {
    throw new Error("Review bundle not found");
  }
  return { mvpProjectId, bundle };
}

export async function resolveMvpReviewProjectForOrder(
  order: StoredOrder,
  input?: { deliverables?: StoredDeliverable[] }
): Promise<string> {
  if (!order.project_id) {
    throw new Error("Order has no linked campaign project");
  }
  return ensureMvpReviewProjectForCampaign(order.project_id, {
    order,
    deliverables: input?.deliverables
  });
}

export async function brandCanAccessMvpReview(
  project: { id: string; created_by: string },
  profile: { id: string; email: string; role: string }
): Promise<boolean> {
  if (profile.role === "admin") return true;
  if (project.created_by === profile.id) return true;
  const campaignId = await findCampaignIdForMvpProject(project.id);
  if (!campaignId) return false;
  const campaign = await getCampaignProject(campaignId);
  return campaign?.client_email.toLowerCase() === profile.email.toLowerCase();
}

async function getLinkedOrderForMvp(mvpProjectId: string): Promise<{
  campaignId: string;
  order: StoredOrder | null;
} | null> {
  const campaignId = await findCampaignIdForMvpProject(mvpProjectId);
  if (!campaignId) return null;
  const { getOrderForProject } = await import("@/lib/order-service");
  const order = await getOrderForProject(campaignId);
  return { campaignId, order };
}

export async function syncCampaignAfterMvpApprove(mvpProjectId: string) {
  const linked = await getLinkedOrderForMvp(mvpProjectId);
  if (!linked?.order) return;
  const { approveOrderDelivery } = await import("@/lib/order-service");
  await approveOrderDelivery(linked.order.id);
}

export async function syncCampaignAfterMvpRevision(mvpProjectId: string) {
  const linked = await getLinkedOrderForMvp(mvpProjectId);
  if (!linked?.order) return;
  const { requestOrderRevision } = await import("@/lib/order-service");
  await requestOrderRevision(linked.order.id, "");
}

export async function syncCampaignAfterMvpUpload(mvpProjectId: string, fileUrl: string) {
  const linked = await getLinkedOrderForMvp(mvpProjectId);
  if (!linked?.order) return;
  const { addDeliverable, getDeliverables } = await import("@/lib/order-service");
  const existing = await getDeliverables(linked.order.id);
  const nextVersion = existing.length + 1;
  const mvpVersions = await fileListVersions(mvpProjectId);
  if (existing.some((item) => item.version === nextVersion)) return;
  if (mvpVersions.length <= existing.length) return;

  await addDeliverable(linked.order.id, {
    file_url: fileUrl,
    notes: `Version ${nextVersion}`,
    notes_for_client: `版本 ${nextVersion}`
  });
}
