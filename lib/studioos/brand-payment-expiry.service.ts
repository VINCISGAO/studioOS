import "server-only";

import { getCreatorByIdSync } from "@/lib/creator-service";
import { DEMO_USERS } from "@/lib/demo-auth";
import { sendCreatorNotificationEmail } from "@/lib/email/send-creator-notification-email";
import { getAppBaseUrl } from "@/lib/app-url";
import type { Locale } from "@/lib/i18n";
import { createCreatorNotification, findNotification } from "@/lib/notification-service";
import {
  cancelUnpaidOrder,
  getOrderForProject,
  listOrdersForClient,
  listOrdersForCreator
} from "@/lib/order-service";
import type { StoredOrder } from "@/lib/order-types";
import { getProject, transitionProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import { CAMPAIGN_PENDING_CREATOR_ID } from "@/lib/studioos/brand-checkout-utils";
import { isBrandPaymentDeadlineExpired } from "@/lib/studioos/brand-payment-deadline";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

function resolveCreatorEmail(creatorId: string): string | null {
  const creator = getCreatorByIdSync(creatorId);
  if (creator?.email) return creator.email;

  const demoMap: Record<string, string> = {
    creator_01: "creator.nova@studioos.test",
    creator_02: "creator.signal@studioos.test",
    creator_03: "creator.atlas@studioos.test"
  };
  if (demoMap[creatorId]) return demoMap[creatorId];

  return DEMO_USERS.find((user) => user.role === "creator")?.email ?? null;
}

function shouldExpireUnpaidOrder(order: StoredOrder, project: StoredProject | null): boolean {
  if (order.payment_status !== "unpaid") return false;
  if (order.status === "cancelled") return false;
  if (!isBrandPaymentDeadlineExpired(order)) return false;
  if (!project) return false;

  const status = normalizeCampaignStatus(project.status);
  if (status === "cancelled" || status === "completed") return false;
  if (["production", "in_review", "delivered"].includes(status)) return false;

  return true;
}

async function notifyCreatorOrderCancelledUnpaid(input: {
  order: StoredOrder;
  project: StoredProject;
  locale: Locale;
}) {
  if (
    !input.order.creator_id ||
    input.order.creator_id === CAMPAIGN_PENDING_CREATOR_ID
  ) {
    return;
  }

  const existing = await findNotification(
    input.order.creator_id,
    input.order.id,
    "order_cancelled_unpaid"
  );
  if (existing) return;

  const brandName = input.order.company_name || input.order.client_name || "Brand";
  const projectTitle =
    input.project.title || input.project.product_name || input.order.title || brandName;

  const copy =
    input.locale === "zh"
      ? {
          title: `${brandName} 的订单已取消`,
          body: `「${projectTitle}」因品牌方 3 小时内未完成付款已自动取消，你无需继续等待或开始制作。`
        }
      : {
          title: `Order cancelled — ${brandName}`,
          body: `"${projectTitle}" was automatically cancelled because the brand did not pay within 3 hours. No further action is needed on your side.`
        };

  const notification = await createCreatorNotification({
    creator_id: input.order.creator_id,
    type: "order_cancelled_unpaid",
    title: copy.title,
    body: copy.body,
    project_id: input.project.id,
    order_id: input.order.id,
    client_name: input.order.client_name,
    company_name: input.order.company_name,
    requirements_text: ""
  });

  const email = resolveCreatorEmail(input.order.creator_id);
  if (!email) return;

  const creator = getCreatorByIdSync(input.order.creator_id);
  const actionUrl = `${getAppBaseUrl()}/studio/messages?lang=${input.locale}`;
  const result = await sendCreatorNotificationEmail({
    to: email,
    creatorName: creator?.name ?? "Creator",
    locale: input.locale,
    type: "order_cancelled_unpaid",
    brandName,
    projectTitle,
    requirementsText: copy.body,
    actionUrl
  });

  if (result.ok && !result.skipped) {
    const { markNotificationEmailSent } = await import("@/lib/notification-service");
    await markNotificationEmailSent(notification.id);
  }
}

async function expireUnpaidOrder(input: {
  order: StoredOrder;
  project: StoredProject;
}): Promise<boolean> {
  if (!shouldExpireUnpaidOrder(input.order, input.project)) {
    return false;
  }

  const cancelled = await cancelUnpaidOrder(input.order.id);
  if (!cancelled) return false;

  const status = normalizeCampaignStatus(input.project.status);
  if (status !== "cancelled") {
    await transitionProject(input.project.id, "project.cancelled", {
      actor_role: "system",
      skipPreconditions: true
    }).catch(() => undefined);
  }

  const locale: Locale = input.order.client_locale === "zh" ? "zh" : "en";
  await notifyCreatorOrderCancelledUnpaid({
    order: cancelled,
    project: input.project,
    locale
  });

  return true;
}

export async function enforceBrandPaymentDeadlineForProject(projectId: string): Promise<boolean> {
  const [project, order] = await Promise.all([getProject(projectId), getOrderForProject(projectId)]);
  if (!project || !order) return false;
  return expireUnpaidOrder({ order, project });
}

export async function enforceBrandPaymentDeadlinesForClient(clientEmail: string): Promise<number> {
  const normalized = clientEmail.toLowerCase();
  const orders = await listOrdersForClient(normalized);
  let expired = 0;

  for (const order of orders) {
    if (!order.project_id) continue;
    const project = await getProject(order.project_id);
    if (!project || project.client_email.toLowerCase() !== normalized) continue;
    if (await expireUnpaidOrder({ order, project })) {
      expired += 1;
    }
  }

  return expired;
}

export async function enforceBrandPaymentDeadlinesForCreator(creatorId: string): Promise<number> {
  const orders = await listOrdersForCreator(creatorId);
  let expired = 0;

  for (const order of orders) {
    if (!order.project_id) continue;
    const project = await getProject(order.project_id);
    if (!project) continue;
    if (await expireUnpaidOrder({ order, project })) {
      expired += 1;
    }
  }

  return expired;
}
