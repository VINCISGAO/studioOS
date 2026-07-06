import { onEvent } from "@/lib/core/event-bus";
import { CampaignEvents, ReviewEvents } from "@/features/shared/types/events";
import type { DomainEvent } from "@/features/shared/types/events";
import { notificationService } from "@/features/notification/notification.service";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { getAppBaseUrl } from "@/lib/app-url";

let registered = false;

async function loadCampaign(campaignId: string) {
  if (!hasDatabaseUrl()) return null;
  return prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      brand: true,
      creator: true
    }
  });
}

function resolveLegacyProjectId(campaign: { productionBrief?: unknown; id: string }) {
  const brief = campaign.productionBrief as { legacy_project_id?: string } | null;
  return brief?.legacy_project_id ?? campaign.id;
}

async function onCreatorAccepted(event: DomainEvent) {
  // Invitation acceptance is only collaboration intent. Final selection
  // notifications are emitted by CampaignSelectionService after brand choice.
  void event;
}

async function onEscrowFunded(event: DomainEvent) {
  const campaignId = event.payload.campaignId as string | undefined ?? event.aggregateId;
  const campaign = await loadCampaign(campaignId);
  if (!campaign?.creatorId) return;

  await notificationService.notify({
    userId: campaign.creatorId,
    campaignId,
    title: "Escrow funded — start production",
    content: `Payment for "${campaign.title}" is secured. You can begin production and upload review versions.`,
    actionUrl: `${getAppBaseUrl()}/studio/delivery`,
    type: "payment.escrow_funded",
    category: "PAYMENT",
    eventName: event.name,
    template: "campaign.escrow_funded",
    priority: "HIGH"
  });
}

async function onRevisionRequested(event: DomainEvent) {
  let campaignId = event.payload.campaignId as string | undefined;
  if (!campaignId) {
    const version = await prisma.campaignVersion.findUnique({ where: { id: event.aggregateId } });
    campaignId = version?.campaignId;
  }
  if (!campaignId) return;

  const campaign = await loadCampaign(campaignId);
  if (!campaign?.creatorId) return;

  await notificationService.notify({
    userId: campaign.creatorId,
    campaignId,
    title: "Revision requested",
    content: `The brand requested changes on "${campaign.title}". Upload a new review version when ready.`,
    actionUrl: `${getAppBaseUrl()}/studio/delivery`,
    type: "review.revision_requested",
    category: "REVISION",
    eventName: event.name,
    template: "review.revision_requested"
  });
}

async function onReviewApproved(event: DomainEvent) {
  const versionId = event.aggregateId;
  const version = await prisma.campaignVersion.findUnique({
    where: { id: versionId },
    include: { campaign: true }
  });
  if (!version?.campaign.creatorId) return;

  await notificationService.notify({
    userId: version.campaign.creatorId,
    campaignId: version.campaignId,
    title: "Review approved",
    content: `"${version.campaign.title}" was approved by the brand.`,
    actionUrl: `${getAppBaseUrl()}/studio/income`,
    type: "review.approved",
    category: "REVIEW",
    eventName: event.name,
    template: "review.approved"
  });
}

async function onCampaignUpdated(event: DomainEvent) {
  const inner = event.payload.event;
  const campaign = await loadCampaign(event.aggregateId);
  if (!campaign) return;
  const legacyProjectId = resolveLegacyProjectId(campaign);

  if (inner === "AI_SUCCESS") {
    await notificationService.notify({
      userId: campaign.brandId,
      campaignId: campaign.id,
      title: "AI creative directions are ready",
      content: `VINCIS finished creative direction generation for "${campaign.title}". Review and approve the direction to continue.`,
      actionUrl: `${getAppBaseUrl()}/brand/projects/new?project=${encodeURIComponent(legacyProjectId)}`,
      type: "ai.creative_generated",
      category: "AI",
      eventName: event.name,
      template: "ai.creative_generated",
      email: false
    });
    return;
  }

  if (inner === "START_MATCHING") {
    await notificationService.notify({
      userId: campaign.brandId,
      campaignId: campaign.id,
      title: "AI matching started",
      content: `VINCIS is matching creators for "${campaign.title}". You will be notified when recommendations are ready.`,
      actionUrl: `${getAppBaseUrl()}/brand/projects/${legacyProjectId}?tab=match`,
      type: "ai.matching_started",
      category: "MATCHING",
      eventName: event.name,
      template: "ai.matching_started",
      email: false
    });
    return;
  }

  if (inner === "CREATOR_ACCEPT") return onCreatorAccepted(event);
  if (inner === "START_PRODUCTION" && campaign.creatorId) {
    await notificationService.notify({
      userId: campaign.creatorId,
      campaignId: campaign.id,
      title: "Collaboration is live",
      content: `"${campaign.title}" is now in production. Upload V1 when the first draft is ready.`,
      actionUrl: `${getAppBaseUrl()}/studio/delivery`,
      type: "collaboration.started",
      category: "COLLABORATION",
      eventName: event.name,
      template: "collaboration.started",
      priority: "HIGH",
      email: false
    });
    return;
  }

  if (inner === "VERSION_UPLOAD") {
    await notificationService.notify({
      userId: campaign.brandId,
      campaignId: campaign.id,
      title: "New review version uploaded",
      content: `A new version is ready for review on "${campaign.title}".`,
      actionUrl: `${getAppBaseUrl()}/brand/projects/${legacyProjectId}/review`,
      type: "delivery.version_uploaded",
      category: "DELIVERY",
      eventName: event.name,
      template: "review.version_uploaded"
    });
    return;
  }

  if (inner === "RELEASE_PAYMENT" && campaign.creatorId) {
    await notificationService.notify({
      userId: campaign.creatorId,
      campaignId: campaign.id,
      title: "Payment release started",
      content: `Settlement has started for "${campaign.title}". Your payout will be updated in income soon.`,
      actionUrl: `${getAppBaseUrl()}/studio/income`,
      type: "settlement.release_started",
      category: "SETTLEMENT",
      eventName: event.name,
      template: "settlement.release_started",
      priority: "HIGH"
    });
  }
}

export function registerNotificationHandlers() {
  if (registered) return;
  registered = true;

  onEvent(CampaignEvents.UPDATED, onCampaignUpdated);
  onEvent(CampaignEvents.CREATOR_ACCEPTED, onCreatorAccepted);
  onEvent(CampaignEvents.ESCROW_FUNDED, onEscrowFunded);
  onEvent(CampaignEvents.REVISION_REQUESTED, onRevisionRequested);
  onEvent(ReviewEvents.APPROVED, onReviewApproved);
  onEvent(ReviewEvents.REVISION_REQUESTED, onRevisionRequested);
}

export function _resetNotificationHandlersForTests() {
  registered = false;
}
