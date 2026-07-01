import "server-only";

import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import { invitationService } from "@/features/matching/invitation.service";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { createSerializedStoreReader, writeJsonFileAtomic } from "@/lib/json-file-store";
import { listCreatorsForMatching } from "@/lib/creator-service";
import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store";
import type { InvitationLifecycleStatus } from "@/lib/studioos/campaign-closed-loop";
import { setupBrandCheckout } from "@/lib/studioos/brand-checkout-service";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import {
  isInvitationRecruitmentClosed,
  MAX_CAMPAIGN_INVITATIONS
} from "@/lib/studioos/invitation-lifecycle";
import { getProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import { getWorksForCreator } from "@/lib/works-catalog";
import { matchCreatorsForProjectWithDemoFallback } from "@/lib/matching-engine";
import { parseBudgetMidpoint } from "@/lib/studioos/brand-checkout-utils";

export type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
export {
  countAwaitingBrandSelection,
  countInvitationsByTab,
  countPendingInvitationsForCreator,
  creatorInvitationTabLabels,
  creatorInvitationTabs,
  filterInvitationsByTab,
  type CreatorInvitationTab
} from "@/lib/studioos/creator-invitation-utils";

const STORE_PATH = dataStorePath("creator-invitation-store.json");

type CreatorInvitationStore = {
  invitations: StoredCreatorInvitation[];
};

async function readStoreInner(): Promise<CreatorInvitationStore> {
  return readDataJson(STORE_PATH, () => ({ invitations: [] }));
}

const readStore = createSerializedStoreReader(readStoreInner);

async function writeStore(store: CreatorInvitationStore) {
  await writeJsonFileAtomic(STORE_PATH, store);
}

export async function listInvitationsForCreator(creatorId: string): Promise<CreatorPortalInvitationView[]> {
  if (hasDatabaseUrl()) {
    const profileId = await resolveCreatorProfileIdForLegacyId(creatorId);
    if (profileId) {
      return invitationService.listForLegacyCreator(creatorId);
    }
  }

  const store = await readStore();
  return store.invitations
    .filter((item) => item.creatorId === creatorId)
    .map(({ creatorId: _creatorId, projectId: _projectId, brandEmail: _brandEmail, ...view }) => view);
}

export async function listAcceptedInvitationsForProject(projectId: string) {
  if (hasDatabaseUrl()) {
    const campaign = await campaignRepository.findByLegacyProjectId(projectId);
    if (campaign) {
      return invitationService.listAcceptedForLegacyProject(projectId);
    }
  }

  const store = await readStore();
  return store.invitations.filter(
    (item) => item.projectId === projectId && item.status === "accepted"
  );
}

export async function listInvitationsForProject(projectId: string) {
  if (hasDatabaseUrl()) {
    const campaign = await campaignRepository.findByLegacyProjectId(projectId);
    if (campaign) {
      return invitationService.listForLegacyProject(projectId);
    }
  }

  const store = await readStore();
  return store.invitations.filter((item) => item.projectId === projectId);
}

export async function getInvitationById(id: string) {
  if (hasDatabaseUrl()) {
    const prismaInvitation = await invitationService.getPortalInvitationById(id);
    if (prismaInvitation) {
      return prismaInvitation;
    }
  }

  const store = await readStore();
  return store.invitations.find((item) => item.id === id) ?? null;
}

export async function acceptInvitation(id: string, creatorId: string, locale: "en" | "zh" = "en") {
  if (hasDatabaseUrl()) {
    const profileId = await resolveCreatorProfileIdForLegacyId(creatorId);
    if (profileId) {
      return invitationService.acceptForLegacyCreator(id, creatorId, locale);
    }
  }

  const store = await readStore();
  const item = store.invitations.find((row) => row.id === id && row.creatorId === creatorId);
  if (!item) return { ok: false as const, error: "not-found" };
  if (item.status !== "pending") return { ok: false as const, error: "not-pending" };

  const project = await getProject(item.projectId);
  if (isInvitationRecruitmentClosed(store.invitations, item.projectId, project)) {
    return { ok: false as const, error: "recruitment-closed" };
  }

  item.status = "accepted";
  await writeStore(store);
  return { ok: true as const, invitation: item };
}

export async function declineInvitation(id: string, creatorId: string, locale: "en" | "zh" = "en") {
  if (hasDatabaseUrl()) {
    const profileId = await resolveCreatorProfileIdForLegacyId(creatorId);
    if (profileId) {
      return invitationService.declineForLegacyCreator(id, creatorId, locale);
    }
  }

  const store = await readStore();
  const item = store.invitations.find((row) => row.id === id && row.creatorId === creatorId);
  if (!item) return { ok: false as const, error: "not-found" };
  if (item.status !== "pending") return { ok: false as const, error: "not-pending" };

  const project = await getProject(item.projectId);
  if (isInvitationRecruitmentClosed(store.invitations, item.projectId, project)) {
    return { ok: false as const, error: "recruitment-closed" };
  }

  item.status = "declined";
  await writeStore(store);
  return { ok: true as const, invitation: item };
}

export async function selectCreatorForProject(input: {
  projectId: string;
  creatorId: string;
  client: { client_name: string; client_email: string; company_name: string };
  locale: "en" | "zh";
}) {
  if (hasDatabaseUrl()) {
    const campaign = await campaignRepository.findByLegacyProjectId(input.projectId);
    if (campaign) {
      const profileId = await resolveCreatorProfileIdForLegacyId(input.creatorId);
      if (profileId) {
        const result = await invitationService.selectCreatorForLegacyProject(input);
        if (!result.ok) return result;
        return { ok: true as const, invitation: result.invitation };
      }
    }
  }

  const store = await readStore();
  const project = await getProject(input.projectId);
  if (!project) return { ok: false as const, error: "project-not-found" };

  const accepted = store.invitations.filter(
    (item) => item.projectId === input.projectId && item.status === "accepted"
  );
  const winner = accepted.find((item) => item.creatorId === input.creatorId);
  if (!winner) return { ok: false as const, error: "creator-not-accepted" };

  if (isInvitationRecruitmentClosed(store.invitations, input.projectId, project)) {
    const alreadySelected = store.invitations.find(
      (item) => item.projectId === input.projectId && item.status === "selected"
    );
    if (alreadySelected?.creatorId === input.creatorId) {
      const checkout = await setupBrandCheckout({
        project,
        creatorId: input.creatorId,
        workId: null,
        client: input.client,
        locale: input.locale
      });
      return { ok: true as const, order: checkout.order, invitation: winner };
    }
    return { ok: false as const, error: "recruitment-closed" };
  }

  const expiredCreatorIds: string[] = [];
  for (const item of store.invitations) {
    if (item.projectId !== input.projectId) continue;
    if (item.creatorId === input.creatorId) {
      item.status = "selected";
      continue;
    }
    if (item.status === "declined") continue;
    if (item.status !== "expired") {
      expiredCreatorIds.push(item.creatorId);
    }
    item.status = "expired";
  }
  await writeStore(store);

  const checkout = await setupBrandCheckout({
    project,
    creatorId: input.creatorId,
    workId: null,
    client: input.client,
    locale: input.locale
  });

  if (expiredCreatorIds.length) {
    const { notifyCreatorsInvitationExpired } = await import("@/lib/studioos/commercial-interaction-notify");
    await notifyCreatorsInvitationExpired({
      project,
      locale: input.locale,
      expiredCreatorIds
    });
  }

  return { ok: true as const, order: checkout.order, invitation: winner };
}

export async function ensureCampaignInvitationsForProject(project: StoredProject, locale: "en" | "zh" = "en") {
  if (hasDatabaseUrl()) {
    const campaign = await campaignRepository.findByLegacyProjectId(project.id);
    if (campaign) {
      return invitationService.ensureForProject(project, locale);
    }
  }

  const store = await readStore();
  const existing = store.invitations.filter((item) => item.projectId === project.id);
  if (existing.length > 0) {
    return existing;
  }

  const enrichedCreators = await listCreatorsForMatching();
  const allWorks = (
    await Promise.all(enrichedCreators.map((creator) => getWorksForCreator(creator.id)))
  ).flat();
  const matches = matchCreatorsForProjectWithDemoFallback(project, enrichedCreators, allWorks).slice(
    0,
    MAX_CAMPAIGN_INVITATIONS
  );

  const now = Date.now();
  const budget = parseBudgetMidpoint(project.budget_range);
  const platform = project.target_platform?.split(",")[0]?.trim() || "TikTok";

  for (const match of matches) {
    store.invitations.push({
      id: `inv_${project.id}_${match.creator_id}_${now}`,
      creatorId: match.creator_id,
      projectId: project.id,
      campaignId: project.id,
      title: project.title || project.product_name || project.company_name,
      brandName: project.company_name || project.client_name,
      brandEmail: project.client_email.toLowerCase(),
      budget,
      currency: "USD",
      deadline: project.deadline || new Date(now + 14 * 86400000).toISOString(),
      platform,
      matchScore: match.score,
      status: "pending",
      expiresAt: new Date(now + 7 * 86400000).toISOString(),
      createdAt: new Date(now).toISOString()
    });
  }

  await writeStore(store);
  return store.invitations.filter((item) => item.projectId === project.id);
}

export type { InvitationLifecycleStatus };
