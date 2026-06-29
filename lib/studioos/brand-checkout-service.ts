import { linkInquiryToProject } from "@/lib/project-adapters";
import { getOrCreateOpenInquiry, updateInquiryStatus } from "@/lib/chat-service";
import {
  acceptQuote,
  createQuote,
  getOrderForProject,
  getOrderByInquiry
} from "@/lib/order-service";
import type { StoredOrder } from "@/lib/order-types";
import {
  getProject,
  markProjectMatched,
  transitionProject,
  updateProject
} from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import {
  buildQuoteSummary,
  deliveryDaysFromDeadline,
  parseBudgetMidpoint
} from "@/lib/studioos/brand-checkout-utils";
import { notifyCreatorAssignment } from "@/lib/studioos/creator-assignment-notify";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";
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

export async function setupBrandCheckout(input: {
  project: StoredProject;
  creatorId: string;
  workId: string | null;
  client: { client_name: string; client_email: string; company_name: string };
  locale: "en" | "zh";
}): Promise<{ order: StoredOrder; inquiryId: string }> {
  const existing = await getOrderForProject(input.project.id);
  const project = (await getProject(input.project.id)) ?? input.project;

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

  await markProjectMatched(project.id);
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

export async function syncBrandOrderPaid(order: StoredOrder) {
  if (!order.project_id) return;
  await syncProjectFromOrderEvent(order.project_id, "project.payment_received", "brand");
}
