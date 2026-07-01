import "server-only";

import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import { createSerializedStoreReader, writeJsonFileAtomic } from "@/lib/json-file-store";
import { listCreatorsForMatching } from "@/lib/creator-service";
import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store";
import type { InvitationLifecycleStatus } from "@/lib/studioos/campaign-closed-loop";
import { startProductionWithSelectedCreator } from "@/lib/studioos/brand-checkout-service";
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

function seedInvitations(): CreatorInvitationStore {
  const now = Date.now();
  return {
    invitations: [
      {
        id: "inv_demo_pending_01",
        creatorId: "creator_01",
        projectId: "proj_demo_arc_nova",
        campaignId: "proj_demo_arc_nova",
        title: "我的产品 Campaign",
        brandName: "Arc & Alloy",
        brandEmail: "client.arc@studioos.test",
        budget: 1800,
        currency: "USD",
        deadline: "2026-07-15T00:00:00.000Z",
        platform: "TikTok",
        matchScore: 92,
        status: "pending",
        expiresAt: new Date(now + 5 * 86400000).toISOString(),
        createdAt: new Date(now - 2 * 86400000).toISOString()
      },
      {
        id: "inv_demo_pending_03",
        creatorId: "creator_01",
        projectId: "proj_demo_arc_brand_300",
        campaignId: "proj_demo_arc_brand_300",
        title: "我的产品 Campaign",
        brandName: "Arc & Alloy (BRAND)",
        brandEmail: "client.arc@studioos.test",
        budget: 300,
        currency: "USD",
        deadline: "2026-07-08T00:00:00.000Z",
        platform: "Meta",
        matchScore: 89,
        status: "pending",
        expiresAt: new Date(now + 4 * 86400000).toISOString(),
        createdAt: new Date(now - 1 * 86400000).toISOString()
      },
      {
        id: "inv_demo_pending_02",
        creatorId: "creator_02",
        projectId: "proj_demo_arc_nova",
        campaignId: "proj_demo_arc_nova",
        title: "我的产品 Campaign",
        brandName: "Arc & Alloy",
        brandEmail: "client.arc@studioos.test",
        budget: 1800,
        currency: "USD",
        deadline: new Date(now + 14 * 86400000).toISOString(),
        platform: "TikTok",
        matchScore: 85,
        status: "pending",
        expiresAt: new Date(now + 5 * 86400000).toISOString(),
        createdAt: new Date(now - 2 * 86400000).toISOString()
      },
      {
        id: "inv_demo_accepted_01",
        creatorId: "creator_01",
        projectId: "proj_1002",
        campaignId: "proj_1002",
        title: "Product Demo Batch",
        brandName: "BrightSip",
        budget: 620,
        currency: "USD",
        deadline: new Date(now + 10 * 86400000).toISOString(),
        platform: "Amazon",
        matchScore: 86,
        status: "accepted",
        expiresAt: null,
        createdAt: new Date(now - 8 * 86400000).toISOString()
      },
      {
        id: "inv_demo_accepted_02",
        creatorId: "creator_03",
        projectId: "proj_1002",
        campaignId: "proj_1002",
        title: "Product Demo Batch",
        brandName: "BrightSip",
        budget: 620,
        currency: "USD",
        deadline: new Date(now + 10 * 86400000).toISOString(),
        platform: "Amazon",
        matchScore: 81,
        status: "accepted",
        expiresAt: null,
        createdAt: new Date(now - 7 * 86400000).toISOString()
      },
      {
        id: "inv_demo_declined_01",
        creatorId: "creator_01",
        projectId: "proj_declined",
        campaignId: "proj_declined",
        title: "Holiday UGC Pack",
        brandName: "Northline Skincare",
        budget: 450,
        currency: "USD",
        deadline: new Date(now + 7 * 86400000).toISOString(),
        platform: "Meta",
        matchScore: 74,
        status: "declined",
        expiresAt: null,
        createdAt: new Date(now - 12 * 86400000).toISOString()
      },
      {
        id: "inv_demo_expired_01",
        creatorId: "creator_01",
        projectId: "proj_expired",
        campaignId: "proj_expired",
        title: "Summer Glow Cutdowns",
        brandName: "Arc & Alloy",
        budget: 900,
        currency: "USD",
        deadline: new Date(now - 2 * 86400000).toISOString(),
        platform: "TikTok",
        matchScore: 88,
        status: "expired",
        expiresAt: new Date(now - 1 * 86400000).toISOString(),
        createdAt: new Date(now - 20 * 86400000).toISOString()
      }
    ]
  };
}

async function readStoreInner(): Promise<CreatorInvitationStore> {
  const fromStore = await readDataJson(STORE_PATH, seedInvitations);
  const store =
    fromStore.invitations.length > 0
      ? fromStore
      : (() => {
          const seeded = seedInvitations();
          void writeDataJson(STORE_PATH, seeded);
          return seeded;
        })();

  const patched = patchDemoInvitations(store);
  if (patched.changed) {
    await writeStore(patched.store);
  }
  return patched.store;
}

function patchDemoInvitations(store: CreatorInvitationStore) {
  const seeded = seedInvitations();
  const demoIds = [
    "inv_demo_pending_01",
    "inv_demo_pending_03",
    "inv_demo_accepted_01",
    "inv_demo_declined_01",
    "inv_demo_expired_01"
  ];
  let changed = false;
  const next = { invitations: [...store.invitations] };

  for (const id of demoIds) {
    const seedRow = seeded.invitations.find((item) => item.id === id);
    if (!seedRow) continue;
    const index = next.invitations.findIndex((item) => item.id === id);
    if (index >= 0) {
      next.invitations[index] = { ...next.invitations[index], ...seedRow };
      changed = true;
    } else {
      next.invitations.push(seedRow);
      changed = true;
    }
  }

  const legacyDemoIds = ["inv_demo_pending_nike", "inv_demo_pending_apple"];
  const filtered = next.invitations.filter(
    (item) => !(item.creatorId === "creator_01" && legacyDemoIds.includes(item.id))
  );
  if (filtered.length !== next.invitations.length) {
    next.invitations = filtered;
    changed = true;
  }

  return { store: next, changed };
}

const readStore = createSerializedStoreReader(readStoreInner);

async function writeStore(store: CreatorInvitationStore) {
  await writeJsonFileAtomic(STORE_PATH, store);
}

export async function listInvitationsForCreator(creatorId: string): Promise<CreatorPortalInvitationView[]> {
  const store = await readStore();
  return store.invitations
    .filter((item) => item.creatorId === creatorId)
    .map(({ creatorId: _creatorId, projectId: _projectId, brandEmail: _brandEmail, ...view }) => view);
}

export async function listAcceptedInvitationsForProject(projectId: string) {
  const store = await readStore();
  return store.invitations.filter(
    (item) => item.projectId === projectId && item.status === "accepted"
  );
}

export async function listInvitationsForProject(projectId: string) {
  const store = await readStore();
  return store.invitations.filter((item) => item.projectId === projectId);
}

export async function getInvitationById(id: string) {
  const store = await readStore();
  return store.invitations.find((item) => item.id === id) ?? null;
}

export async function acceptInvitation(id: string, creatorId: string) {
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

export async function declineInvitation(id: string, creatorId: string) {
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
      const checkout = await startProductionWithSelectedCreator({
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

  const checkout = await startProductionWithSelectedCreator({
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

export async function ensureCampaignInvitationsForProject(project: StoredProject) {
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
