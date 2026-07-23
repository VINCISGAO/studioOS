import "server-only";

import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import { invitationService } from "@/features/matching/invitation.service";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";
import { createSerializedStoreReader, writeJsonFileAtomic } from "@/lib/json-file-store";
import { getCreatorById, listCreatorsForMatching } from "@/lib/creator-service";
import { resolveCreatorDisplayName } from "@/lib/studioos/creator-display-name.server";
import { dataStorePath, readDataJson } from "@/lib/serverless-store";
import type { InvitationLifecycleStatus } from "@/lib/studioos/campaign-closed-loop";
import { setupBrandCheckout } from "@/lib/studioos/brand-checkout-service";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import {
  isInvitationRecruitmentClosed,
  MAX_CAMPAIGN_INVITATIONS
} from "@/lib/studioos/invitation-lifecycle";
import { getProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import {
  createCreatorNotification,
  findNotificationByProject
} from "@/lib/notification-service";
import { createBrandNotification } from "@/lib/studioos/brand-notification-service";
import { getWorksForCreator } from "@/lib/works-catalog";
import { matchCreatorsForProject } from "@/lib/matching-engine";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";
import { parseBudgetMidpoint } from "@/lib/studioos/brand-checkout-utils";
import type { InvitationDeclineFeedback } from "@/features/matching/invitation-decline-feedback";
import { getOrderForProject } from "@/lib/order-service";
import { isBrandProjectFunded } from "@/lib/studioos/brand-payment-funding";
import {
  canUseLegacyJsonFallback,
  hasPrismaCampaignForProject,
  isLegacyJsonInvitationMode
} from "@/lib/studioos/invitation-data-source";
import { aiLearningEventRepository } from "@/features/ai/ai-learning-event.repository";

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

function invitationNotificationCopy(locale: "zh" | "en", brandName: string, projectTitle: string) {
  if (locale === "zh") {
    return {
      title: "你收到一个新的合作邀请",
      body: `${brandName} 邀请你参与「${projectTitle}」。接受邀请表示你有合作意向，最终是否合作由品牌方决定。`
    };
  }
  return {
    title: "You received a new collaboration invitation",
    body: `${brandName} invited you to "${projectTitle}". Accepting shows interest — the brand makes the final selection.`
  };
}

async function ensureCreatorInvitationNotifications(
  creatorId: string,
  invitations: CreatorPortalInvitationView[],
  locale: "zh" | "en" = "zh"
) {
  await Promise.all(
    invitations
      .filter((invitation) => invitation.status === "pending")
      .map(async (invitation) => {
        try {
          const existing = await findNotificationByProject(
            creatorId,
            invitation.campaignId,
            "invitation_match"
          );
          if (existing) return;

          const project = await getProject(invitation.campaignId);
          const brandName = invitation.brandName || project?.company_name || project?.client_name || "Brand";
          const projectTitle = invitation.title || project?.title || project?.product_name || brandName;
          const requirementsText = project ? getConfirmedBriefText(project, locale) : "";
          const copy = invitationNotificationCopy(locale, brandName, projectTitle);

          await createCreatorNotification({
            creator_id: creatorId,
            type: "invitation_match",
            title: copy.title,
            body: copy.body,
            project_id: invitation.campaignId,
            order_id: null,
            client_name: brandName,
            company_name: brandName,
            requirements_text: requirementsText
          });
        } catch (error) {
          logger.error("Failed to backfill creator invitation notification", {
            service: "creator-invitation-store",
            creatorId,
            invitationId: invitation.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      })
  );
}

async function ensureProjectInvitationNotifications(
  project: StoredProject,
  invitations: StoredCreatorInvitation[],
  locale: "zh" | "en" = "zh"
) {
  const brandName = project.company_name || project.client_name || "Brand";
  const projectTitle = project.title || project.product_name || brandName;
  const requirementsText = getConfirmedBriefText(project, locale);
  const copy = invitationNotificationCopy(locale, brandName, projectTitle);

  await Promise.all(
    invitations
      .filter((invitation) => invitation.status === "pending")
      .map(async (invitation) => {
        try {
          const existing = await findNotificationByProject(
            invitation.creatorId,
            invitation.projectId,
            "invitation_match"
          );
          if (existing) return;

          await createCreatorNotification({
            creator_id: invitation.creatorId,
            type: "invitation_match",
            title: copy.title,
            body: copy.body,
            project_id: invitation.projectId,
            order_id: null,
            client_name: brandName,
            company_name: brandName,
            requirements_text: requirementsText
          });
        } catch (error) {
          logger.error("Failed to ensure project invitation notification", {
            service: "creator-invitation-store",
            projectId: project.id,
            creatorId: invitation.creatorId,
            invitationId: invitation.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      })
  );
}

export async function enrichStoredCreatorInvitations(
  invitations: StoredCreatorInvitation[]
): Promise<StoredCreatorInvitation[]> {
  const uniqueCreatorIds = [...new Set(invitations.map((item) => item.creatorId))];
  const creatorsById = new Map<string, NonNullable<Awaited<ReturnType<typeof getCreatorById>>>>();

  await Promise.all(
    uniqueCreatorIds.map(async (creatorId) => {
      const creator = await getCreatorById(creatorId);
      if (creator) {
        creatorsById.set(creatorId, creator);
      }
    })
  );

  return invitations.map((invitation) => {
    const creator = creatorsById.get(invitation.creatorId);
    if (!creator) return invitation;
    return {
      ...invitation,
      creatorName: creator.name,
      creatorHeadline: creator.headline,
      creatorAvatarUrl: creator.avatar_url ?? invitation.creatorAvatarUrl
    };
  });
}

export async function syncCreatorInvitationNotifications(
  creatorId: string,
  invitations: CreatorPortalInvitationView[],
  locale: "zh" | "en" = "zh"
): Promise<void> {
  await ensureCreatorInvitationNotifications(creatorId, invitations, locale);
}

export async function listInvitationsForCreator(
  creatorId: string,
  locale: "zh" | "en" = "zh",
  options?: { syncNotifications?: boolean }
): Promise<CreatorPortalInvitationView[]> {
  const syncNotifications = options?.syncNotifications !== false;
  if (!isLegacyJsonInvitationMode()) {
    const profileId = await resolveCreatorProfileIdForLegacyId(creatorId);
    if (!profileId) {
      return [];
    }
    try {
      const invitations = await invitationService.listForLegacyCreator(creatorId);
      if (syncNotifications) {
        await ensureCreatorInvitationNotifications(creatorId, invitations, locale);
      }
      return invitations;
    } catch (error) {
      if (!canUseLegacyJsonFallback(error)) {
        logger.error("Prisma creator invitation list failed", {
          service: "creator-invitation-store",
          creatorId,
          error: error instanceof Error ? error.message : String(error)
        });
        return [];
      }
      logger.error("Prisma invitation schema is not migrated; using legacy creator invitations", {
        service: "creator-invitation-store",
        creatorId
      });
    }
  }

  const store = await readStore();
  const invitations = store.invitations
    .filter((item) => item.creatorId === creatorId)
    .map((item) => ({
      id: item.id,
      campaignId: item.campaignId,
      title: item.title,
      brandName: item.brandName,
      budget: item.budget,
      currency: item.currency,
      deadline: item.deadline,
      platform: item.platform,
      matchScore: item.matchScore,
      status: item.status,
      expiresAt: item.expiresAt,
      createdAt: item.createdAt,
      ...(item.declineFeedback ? { declineFeedback: item.declineFeedback } : {})
    }));
  if (syncNotifications) {
    await ensureCreatorInvitationNotifications(creatorId, invitations, locale);
  }
  return invitations;
}

export async function listAcceptedInvitationsForProject(projectId: string) {
  if (await hasPrismaCampaignForProject(projectId)) {
    try {
      return enrichStoredCreatorInvitations(
        await invitationService.listAcceptedForLegacyProject(projectId)
      );
    } catch (error) {
      if (!canUseLegacyJsonFallback(error)) {
        logger.error("Prisma accepted invitation list failed", {
          service: "creator-invitation-store",
          projectId,
          error: error instanceof Error ? error.message : String(error)
        });
        return [];
      }
      logger.error("Prisma invitation schema is not migrated; using legacy accepted invitations", {
        service: "creator-invitation-store",
        projectId
      });
    }
  }

  const store = await readStore();
  return enrichStoredCreatorInvitations(
    store.invitations.filter((item) => item.projectId === projectId && item.status === "accepted")
  );
}

export async function listInvitationsForProject(projectId: string) {
  if (await hasPrismaCampaignForProject(projectId)) {
    try {
      return enrichStoredCreatorInvitations(await invitationService.listForLegacyProject(projectId));
    } catch (error) {
      if (!canUseLegacyJsonFallback(error)) {
        logger.error("Prisma invitation list failed", {
          service: "creator-invitation-store",
          projectId,
          error: error instanceof Error ? error.message : String(error)
        });
        return [];
      }
      logger.error("Prisma invitation schema is not migrated; using legacy project invitations", {
        service: "creator-invitation-store",
        projectId
      });
    }
  }

  const store = await readStore();
  return enrichStoredCreatorInvitations(store.invitations.filter((item) => item.projectId === projectId));
}

export async function getInvitationById(id: string) {
  if (!isLegacyJsonInvitationMode()) {
    try {
      const prismaInvitation = await invitationService.getPortalInvitationById(id);
      if (prismaInvitation) {
        return (await enrichStoredCreatorInvitations([prismaInvitation]))[0] ?? prismaInvitation;
      }
    } catch (error) {
      if (!canUseLegacyJsonFallback(error)) {
        logger.error("Prisma invitation lookup failed", {
          service: "creator-invitation-store",
          invitationId: id,
          error: error instanceof Error ? error.message : String(error)
        });
        return null;
      }
      logger.error("Prisma invitation schema is not migrated; using legacy invitation lookup", {
        service: "creator-invitation-store",
        invitationId: id
      });
    }
  }

  const store = await readStore();
  const invitation = store.invitations.find((item) => item.id === id) ?? null;
  return invitation ? (await enrichStoredCreatorInvitations([invitation]))[0] ?? invitation : null;
}

export async function acceptInvitation(id: string, creatorId: string, locale: "en" | "zh" = "en") {
  if (!isLegacyJsonInvitationMode()) {
    try {
      const prismaInvitation = await invitationService.getPortalInvitationById(id);
      if (prismaInvitation) {
        const profileId = await resolveCreatorProfileIdForLegacyId(creatorId);
        if (!profileId) {
          return { ok: false as const, error: "profile-required" };
        }
        return invitationService.acceptForLegacyCreator(id, creatorId, locale);
      }
    } catch (error) {
      if (!canUseLegacyJsonFallback(error)) {
        logger.error("Prisma invitation accept failed", {
          service: "creator-invitation-store",
          invitationId: id,
          creatorId,
          error: error instanceof Error ? error.message : String(error)
        });
        return { ok: false as const, error: "unavailable" };
      }
    }
  }

  const store = await readStore();
  const item = store.invitations.find((row) => row.id === id && row.creatorId === creatorId);
  if (!item) return { ok: false as const, error: "not-found" };
  if (item.status !== "pending") return { ok: false as const, error: "not-pending" };

  const project = await getProject(item.projectId);
  if (await hasPrismaCampaignForProject(item.projectId)) {
    return { ok: false as const, error: "unavailable" };
  }
  if (isInvitationRecruitmentClosed(store.invitations, item.projectId, project)) {
    return { ok: false as const, error: "recruitment-closed" };
  }

  item.status = "accepted";
  await writeStore(store);
  const campaign = hasDatabaseUrl() ? await campaignRepository.findByLegacyProjectId(item.projectId) : null;
  if (campaign) {
    await aiLearningEventRepository
      .append({
        eventType: "CreatorAccepted",
        entityType: "CreatorInvitation",
        entityId: id,
        payload: {
          legacy_project_id: item.projectId,
          campaignId: campaign.id,
          legacy_creator_id: creatorId,
          matchScore: item.matchScore ?? null
        },
        learningType: "Preference",
        after: {
          legacy_creator_id: creatorId,
          campaignId: campaign.id,
          accepted: true,
          project_created: false
        },
        confidence: 0.8
      })
      .catch(() => undefined);
  }
  if (project) {
    const creatorName = await resolveCreatorDisplayName(creatorId, {
      hint: item.creatorName,
      locale
    });
    await createBrandNotification({
      brand_email: project.client_email,
      type: "invitation_accepted",
      title: locale === "zh" ? "创作者接受了邀约" : "Creator accepted your invitation",
      body:
        locale === "zh"
          ? `${creatorName} 已接受「${project.title || project.product_name}」的合作邀约，请在候选列表中最终选定合作方。`
          : `${creatorName} accepted the invitation for "${project.title || project.product_name}". Review accepted creators and make the final selection.`,
      project_id: item.projectId,
      creator_id: creatorId,
      creator_name: creatorName
    }).catch(() => undefined);
  }
  return { ok: true as const, invitation: item };
}

export async function declineInvitation(
  id: string,
  creatorId: string,
  locale: "en" | "zh" = "en",
  feedback: InvitationDeclineFeedback
) {
  if (!isLegacyJsonInvitationMode()) {
    try {
      const prismaInvitation = await invitationService.getPortalInvitationById(id);
      if (prismaInvitation) {
        const profileId = await resolveCreatorProfileIdForLegacyId(creatorId);
        if (!profileId) {
          return { ok: false as const, error: "profile-required" };
        }
        return invitationService.declineForLegacyCreator(id, creatorId, locale, feedback);
      }
    } catch (error) {
      if (!canUseLegacyJsonFallback(error)) {
        logger.error("Prisma invitation decline failed", {
          service: "creator-invitation-store",
          invitationId: id,
          creatorId,
          error: error instanceof Error ? error.message : String(error)
        });
        return { ok: false as const, error: "unavailable" };
      }
    }
  }

  const store = await readStore();
  const item = store.invitations.find((row) => row.id === id && row.creatorId === creatorId);
  if (!item) return { ok: false as const, error: "not-found" };
  if (item.status !== "pending") return { ok: false as const, error: "not-pending" };

  const project = await getProject(item.projectId);
  if (await hasPrismaCampaignForProject(item.projectId)) {
    return { ok: false as const, error: "unavailable" };
  }
  if (isInvitationRecruitmentClosed(store.invitations, item.projectId, project)) {
    return { ok: false as const, error: "recruitment-closed" };
  }

  item.status = "declined";
  item.declineFeedback = feedback;
  await writeStore(store);
  if (project) {
    const creatorName = await resolveCreatorDisplayName(creatorId, {
      hint: item.creatorName,
      locale
    });
    await createBrandNotification({
      brand_email: project.client_email,
      type: "invitation_declined",
      title: locale === "zh" ? "创作者拒绝了邀约" : "Creator declined your invitation",
      body:
        locale === "zh"
          ? `${creatorName} 已拒绝「${project.title || project.product_name}」的合作邀约。原因：${feedback.reason}。`
          : `${creatorName} declined the invitation for "${project.title || project.product_name}". Reason: ${feedback.reason}.`,
      project_id: item.projectId,
      creator_id: creatorId,
      creator_name: creatorName
    }).catch(() => undefined);
  }
  return { ok: true as const, invitation: item };
}

export async function selectCreatorForProject(input: {
  projectId: string;
  creatorId: string;
  client: { client_name: string; client_email: string; company_name: string };
  locale: "en" | "zh";
}) {
  if (await hasPrismaCampaignForProject(input.projectId)) {
    const profileId = await resolveCreatorProfileIdForLegacyId(input.creatorId);
    if (!profileId) {
      return { ok: false as const, error: "profile-required" };
    }
    const result = await invitationService.selectCreatorForLegacyProject(input);
    if (!result.ok) return result;
    return { ok: true as const, invitation: result.invitation };
  }

  const store = await readStore();
  const project = await getProject(input.projectId);
  if (!project) return { ok: false as const, error: "project-not-found" };
  if (project.client_email.toLowerCase() !== input.client.client_email.toLowerCase()) {
    return { ok: false as const, error: "forbidden" };
  }

  const accepted = store.invitations.filter(
    (item) => item.projectId === input.projectId && item.status === "accepted"
  );
  const winner = accepted.find((item) => item.creatorId === input.creatorId);
  if (!winner) return { ok: false as const, error: "creator-not-accepted" };
  const topRecommended = [...accepted].sort((a, b) => b.matchScore - a.matchScore)[0];
  const selectedNonRecommended = Boolean(topRecommended && topRecommended.creatorId !== input.creatorId);

  if (isInvitationRecruitmentClosed(store.invitations, input.projectId, project)) {
    const alreadySelected = store.invitations.find(
      (item) => item.projectId === input.projectId && item.status === "selected"
    );
    if (alreadySelected?.creatorId === input.creatorId) {
      const { notifyCreatorProjectSelected } = await import("@/lib/studioos/creator-assignment-notify");
      await notifyCreatorProjectSelected({
        creatorId: input.creatorId,
        project,
        order: null,
        locale: input.locale
      }).catch(() => undefined);
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

  const { notifyCreatorProjectSelected } = await import("@/lib/studioos/creator-assignment-notify");
  await notifyCreatorProjectSelected({
    creatorId: input.creatorId,
    project,
    order: null,
    locale: input.locale
  }).catch(() => undefined);

  const checkout = await setupBrandCheckout({
    project,
    creatorId: input.creatorId,
    workId: null,
    client: input.client,
    locale: input.locale
  });

  await aiLearningEventRepository.append({
    eventType: selectedNonRecommended ? "BrandSelectedNonRecommendedCreator" : "BrandSelectedCreator",
    entityType: "Campaign",
    entityId: project.id,
    payload: {
      legacy_project_id: project.id,
      selected_legacy_creator_id: input.creatorId,
      selected_match_score: winner.matchScore,
      recommended_legacy_creator_id: topRecommended?.creatorId ?? input.creatorId,
      recommended_match_score: topRecommended?.matchScore ?? winner.matchScore,
      accepted_creator_count: accepted.length
    },
    learningType: "Preference",
    after: {
      selected_legacy_creator_id: input.creatorId,
      selected_non_recommended: selectedNonRecommended,
      recommended_legacy_creator_id: topRecommended?.creatorId ?? input.creatorId
    },
    confidence: selectedNonRecommended ? 0.85 : 0.8
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
  const existingLegacyStore = await readStore();
  const escrowOrder = await getOrderForProject(project.id);
  const canCreateInvitations = await isBrandProjectFunded(project.id, escrowOrder);

  if (await hasPrismaCampaignForProject(project.id)) {
    try {
      const existing = await invitationService.listForLegacyProject(project.id);
      if (existing.length > 0) {
        const invitations = await enrichStoredCreatorInvitations(existing);
        await ensureProjectInvitationNotifications(project, invitations, locale);
        return invitations;
      }
      if (!canCreateInvitations) {
        return [];
      }
      const invitations = await enrichStoredCreatorInvitations(
        await invitationService.ensureForProject(project, locale)
      );
      await ensureProjectInvitationNotifications(project, invitations, locale);
      return invitations;
    } catch (error) {
      if (!canUseLegacyJsonFallback(error)) {
        logger.error("Prisma invitation ensure failed", {
          service: "creator-invitation-store",
          projectId: project.id,
          error: error instanceof Error ? error.message : String(error)
        });
        return [];
      }
      logger.error("Prisma invitation schema is not migrated; using legacy invitation creation", {
        service: "creator-invitation-store",
        projectId: project.id
      });
    }
  }

  if (hasDatabaseUrl()) {
    return [];
  }

  const store = existingLegacyStore;
  const existing = store.invitations.filter((item) => item.projectId === project.id);
  if (existing.length > 0) {
    const invitations = await enrichStoredCreatorInvitations(existing);
    await ensureProjectInvitationNotifications(project, invitations, locale);
    return invitations;
  }
  if (!canCreateInvitations) {
    return [];
  }

  const enrichedCreators = await listCreatorsForMatching();
  const allWorks = (
    await Promise.all(enrichedCreators.map((creator) => getWorksForCreator(creator.id)))
  ).flat();
  const matches = matchCreatorsForProject(project, enrichedCreators, allWorks, {
    includeColdStartRegisteredCreators: true
  }).slice(0, MAX_CAMPAIGN_INVITATIONS);

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
  const invitations = await enrichStoredCreatorInvitations(
    store.invitations.filter((item) => item.projectId === project.id)
  );
  await ensureProjectInvitationNotifications(project, invitations, locale);
  return invitations;
}

export type { InvitationLifecycleStatus };
