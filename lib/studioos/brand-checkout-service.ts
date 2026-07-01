import { linkInquiryToProject } from "@/lib/project-adapters";
import { createInquiry, getOrCreateOpenInquiry, updateInquiryStatus } from "@/lib/chat-service";
import {
  acceptQuote,
  beginOrderProduction,
  assignOrderCreator,
  createCampaignEscrowOrder,
  createQuote,
  getOrderByInquiry,
  getOrderForProject
} from "@/lib/order-service";
import { isOrderPaymentEscrowed, type StoredOrder } from "@/lib/order-types";
import {
  getProject,
  transitionProject,
  updateProject
} from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import {
  buildQuoteSummary,
  CAMPAIGN_PENDING_CREATOR_ID,
  deliveryDaysFromDeadline,
  parseBudgetMidpoint
} from "@/lib/studioos/brand-checkout-utils";
import { notifyCreatorAssignment } from "@/lib/studioos/creator-assignment-notify";
import { ensureCampaignInvitationsForProject } from "@/lib/studioos/creator-invitation-store";
import { publishCampaignIntentInvitations } from "@/lib/studioos/campaign-invitation-notify";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import { syncProjectFromOrderEvent } from "@/lib/studioos/project-order-sync";

async function advanceProjectToPaymentPending(projectId: string) {
  const chain: Array<Parameters<typeof transitionProject>[1]> = [
    "project.studio_selected",
    "project.proposal_opened",
    "project.proposal_accepted",
    "project.contract_signed"
  ];

  for (const event of chain) {
    const current = await getProject(projectId);
    if (!current || current.status === "payment_pending") break;
    await transitionProject(projectId, event, { actor_role: "brand", skipPreconditions: true });
  }
}

/** After wizard publish — escrow order + payment_pending before checkout UI. */
export async function preparePublishedCampaignCheckout(input: {
  project: StoredProject;
  client: { client_name: string; client_email: string; company_name: string };
  locale: "en" | "zh";
}): Promise<StoredOrder> {
  await advanceProjectToPaymentPending(input.project.id);
  return setupBrandCampaignPayment(input);
}

/** Creates campaign escrow order right after publish — pay first, match creators later. */
export async function setupBrandCampaignPayment(input: {
  project: StoredProject;
  client: { client_name: string; client_email: string; company_name: string };
  locale: "en" | "zh";
}): Promise<StoredOrder> {
  const existing = await getOrderForProject(input.project.id);
  if (existing) {
    return existing;
  }

  const briefText = getConfirmedBriefText(input.project, input.locale);
  const requirements = [
    input.locale === "zh" ? "【Campaign 托管】" : "[Campaign escrow]",
    input.project.title || input.project.product_name || input.project.company_name,
    "",
    briefText
  ]
    .filter(Boolean)
    .join("\n");

  return createCampaignEscrowOrder({
    project: input.project,
    client: input.client,
    locale: input.locale,
    requirements
  });
}

/** Brand selects creator from accepted shortlist — starts production and messaging. */
export async function startProductionWithSelectedCreator(input: {
  project: StoredProject;
  creatorId: string;
  workId: string | null;
  client: { client_name: string; client_email: string; company_name: string };
  locale: "en" | "zh";
}): Promise<{ order: StoredOrder; inquiryId: string }> {
  const project = (await getProject(input.project.id)) ?? input.project;
  const existing = await getOrderForProject(project.id);

  if (existing?.creator_id === input.creatorId && project.status === "production") {
    const order = (await beginOrderProduction(existing.id)) ?? existing;
    return { order, inquiryId: existing.inquiry_id };
  }

  const briefText = getConfirmedBriefText(project, input.locale);
  const message = [
    input.locale === "zh" ? "【Campaign 选定】" : "[Campaign selected]",
    project.title || project.product_name || project.company_name,
    "",
    briefText
  ]
    .filter(Boolean)
    .join("\n");

  const { inquiry } = await getOrCreateOpenInquiry({
    creator_id: input.creatorId,
    work_id: input.workId,
    project_id: project.id,
    client_name: input.client.client_name,
    client_email: input.client.client_email,
    company_name: project.company_name || input.client.company_name,
    budget_range: project.budget_range,
    message
  });

  await linkInquiryToProject(inquiry.id, project.id);

  let order = await getOrderByInquiry(inquiry.id);
  if (!order) {
    const amount = parseBudgetMidpoint(project.budget_range);
    const quote = await createQuote({
      inquiry_id: inquiry.id,
      creator_id: input.creatorId,
      client_email: input.client.client_email,
      amount,
      summary: buildQuoteSummary({
        title: project.title || project.product_name || project.company_name,
        videoCount: project.video_count ?? project.output_quantity,
        targetPlatform: project.target_platform,
        locale: input.locale
      }),
      delivery_days: deliveryDaysFromDeadline(project.deadline)
    });

    order = await acceptQuote(quote.id, {
      ...inquiry,
      project_id: project.id
    });

    if (!order) {
      throw new Error("Failed to create production order");
    }

    await updateInquiryStatus(inquiry.id, "quoted");
  }

  order = (await beginOrderProduction(order.id)) ?? order;

  await updateProject(project.id, { selected_studio_id: input.creatorId });
  await transitionProject(project.id, "project.creator_assigned", {
    actor_role: "brand",
    actor_id: input.client.client_email,
    skipPreconditions: true
  });

  const refreshed = (await getProject(project.id)) ?? project;
  await notifyCreatorAssignment({
    type: "creator_selected",
    creatorId: input.creatorId,
    order,
    project: refreshed,
    locale: input.locale
  });

  return { order, inquiryId: inquiry.id };
}

export async function setupBrandCheckout(input: {
  project: StoredProject;
  creatorId: string;
  workId: string | null;
  client: { client_name: string; client_email: string; company_name: string };
  locale: "en" | "zh";
}): Promise<{ order: StoredOrder; inquiryId: string }> {
  const existing = await getOrderForProject(input.project.id);
  const project = (await getProject(input.project.id)) ?? input.project;

  if (existing && isOrderPaymentEscrowed(existing.payment_status)) {
    return assignCreatorToFundedCampaign({
      project,
      order: existing,
      creatorId: input.creatorId,
      workId: input.workId,
      client: input.client,
      locale: input.locale
    });
  }

  if (existing) {
    await updateProject(project.id, { selected_studio_id: input.creatorId });
    if (existing.payment_status === "unpaid") {
      await advanceProjectToPaymentPending(project.id);
    }
    await notifyCreatorAssignment({
      type: "creator_selected",
      creatorId: input.creatorId,
      order: existing,
      project,
      locale: input.locale
    });
    return { order: existing, inquiryId: existing.inquiry_id };
  }

  const briefText = getConfirmedBriefText(project, input.locale);
  const message = [
    input.locale === "zh" ? "【Campaign 匹配】" : "[Campaign match]",
    project.title || project.product_name || project.company_name,
    "",
    briefText
  ]
    .filter(Boolean)
    .join("\n");

  const { inquiry } = await getOrCreateOpenInquiry({
    creator_id: input.creatorId,
    work_id: input.workId,
    project_id: project.id,
    client_name: input.client.client_name,
    client_email: input.client.client_email,
    company_name: project.company_name || input.client.company_name,
    budget_range: project.budget_range,
    message
  });

  await linkInquiryToProject(inquiry.id, project.id);

  let order = await getOrderByInquiry(inquiry.id);
  if (!order) {
    const amount = parseBudgetMidpoint(project.budget_range);
    const quote = await createQuote({
      inquiry_id: inquiry.id,
      creator_id: input.creatorId,
      client_email: input.client.client_email,
      amount,
      summary: buildQuoteSummary({
        title: project.title || project.product_name || project.company_name,
        videoCount: project.video_count ?? project.output_quantity,
        targetPlatform: project.target_platform,
        locale: input.locale
      }),
      delivery_days: deliveryDaysFromDeadline(project.deadline)
    });

    order = await acceptQuote(quote.id, {
      ...inquiry,
      project_id: project.id
    });

    if (!order) {
      throw new Error("Failed to create brand checkout order");
    }

    await updateInquiryStatus(inquiry.id, "escrow_pending");
  }

  await transitionProject(project.id, "project.studio_selected", {
    actor_role: "brand",
    skipPreconditions: true
  });
  await updateProject(project.id, { selected_studio_id: input.creatorId });
  await advanceProjectToPaymentPending(project.id);

  await notifyCreatorAssignment({
    type: "creator_selected",
    creatorId: input.creatorId,
    order,
    project,
    locale: input.locale
  });

  return { order, inquiryId: inquiry.id };
}

async function assignCreatorToFundedCampaign(input: {
  project: StoredProject;
  order: StoredOrder;
  creatorId: string;
  workId: string | null;
  client: { client_name: string; client_email: string; company_name: string };
  locale: "en" | "zh";
}): Promise<{ order: StoredOrder; inquiryId: string }> {
  const briefText = getConfirmedBriefText(input.project, input.locale);
  const message = [
    input.locale === "zh" ? "【Campaign 匹配】" : "[Campaign match]",
    input.project.title || input.project.product_name || input.project.company_name,
    "",
    briefText
  ]
    .filter(Boolean)
    .join("\n");

  const inquiry = await createInquiry({
    creator_id: input.creatorId,
    work_id: input.workId,
    project_id: input.project.id,
    client_name: input.client.client_name,
    client_email: input.client.client_email,
    company_name: input.project.company_name || input.client.company_name,
    budget_range: input.project.budget_range,
    message
  });

  await linkInquiryToProject(inquiry.id, input.project.id);
  await updateInquiryStatus(inquiry.id, "escrow_pending");

  const order = await assignOrderCreator({
    orderId: input.order.id,
    creatorId: input.creatorId,
    inquiryId: inquiry.id,
    workId: input.workId
  });

  if (!order) {
    throw new Error("Failed to assign creator to funded campaign");
  }

  await updateProject(input.project.id, { selected_studio_id: input.creatorId });
  await transitionProject(input.project.id, "project.creator_assigned", {
    actor_role: "brand",
    actor_id: input.client.client_email,
    skipPreconditions: true
  });

  const project = (await getProject(input.project.id)) ?? input.project;
  await notifyCreatorAssignment({
    type: "creator_selected",
    creatorId: input.creatorId,
    order,
    project,
    locale: input.locale
  });

  return { order, inquiryId: inquiry.id };
}

export async function syncBrandOrderPaid(order: StoredOrder) {
  if (!order.project_id) return;

  const project = await getProject(order.project_id);
  if (!project) return;

  const status = normalizeCampaignStatus(project.status);
  const isCampaignEscrow =
    order.creator_id === CAMPAIGN_PENDING_CREATOR_ID ||
    (!project.selected_studio_id && status === "payment_pending");

  if (isCampaignEscrow) {
    await transitionProject(order.project_id, "project.campaign_funded", {
      actor_role: "brand",
      actor_id: order.client_email,
      skipPreconditions: true
    });
    const refreshed = (await getProject(order.project_id)) ?? project;
    await ensureCampaignInvitationsForProject(refreshed);
    await publishCampaignIntentInvitations({
      project: refreshed,
      locale: order.client_locale === "zh" ? "zh" : "en"
    });
    return;
  }

  await syncProjectFromOrderEvent(order.project_id, "project.payment_received", "brand");
}
