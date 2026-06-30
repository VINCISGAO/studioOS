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

async function onCreatorAccepted(event: DomainEvent) {
  const campaignId = event.aggregateId;
  const campaign = await loadCampaign(campaignId);
  if (!campaign?.creatorId) return;

  await notificationService.notify({
    userId: campaign.creatorId,
    campaignId,
    title: "New campaign invitation accepted",
    content: `You were selected for "${campaign.title}". Review the brief and prepare for production.`,
    actionUrl: `${getAppBaseUrl()}/creator/orders`,
    template: "campaign.creator_accepted",
    email: true
  });
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
    actionUrl: notificationService.campaignActionUrl(version.campaignId, "/review"),
    template: "review.approved"
  });
}

async function onCampaignUpdated(event: DomainEvent) {
  const inner = event.payload.event;
  if (inner === "CREATOR_ACCEPT") return onCreatorAccepted(event);
  if (inner === "VERSION_UPLOAD") {
    const campaign = await loadCampaign(event.aggregateId);
    if (!campaign) return;
    await notificationService.notify({
      userId: campaign.brandId,
      campaignId: campaign.id,
      title: "New review version uploaded",
      content: `A new version is ready for review on "${campaign.title}".`,
      actionUrl: notificationService.campaignActionUrl(campaign.id, "/review"),
      template: "review.version_uploaded"
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
