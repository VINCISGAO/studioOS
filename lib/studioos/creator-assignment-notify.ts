import { getAppBaseUrl } from "@/lib/app-url";
import { DEMO_USERS } from "@/lib/demo-auth";
import { sendCreatorNotificationEmail } from "@/lib/email/send-creator-notification-email";
import { getCreatorByIdSync } from "@/lib/creator-service";
import type { Locale } from "@/lib/i18n";
import {
  createCreatorNotification,
  findNotification,
  findNotificationByProject,
  markNotificationEmailSent,
  patchNotificationRequirements
} from "@/lib/notification-service";
import type { CreatorNotificationType } from "@/lib/notification-types";
import { updateOrderRequirements } from "@/lib/order-service";
import { isOrderPaymentEscrowed, type StoredOrder } from "@/lib/order-types";
import { getProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";
import { buildProjectRequirementsText } from "@/lib/studioos/project-brief-format";

function resolveCreatorEmail(creatorId: string): string | null {
  const creator = getCreatorByIdSync(creatorId);
  if (creator?.email) {
    return creator.email;
  }

  const demoMap: Record<string, string> = {
    creator_01: "creator.nova@studioos.test",
    creator_02: "creator.signal@studioos.test",
    creator_03: "creator.atlas@studioos.test"
  };

  if (demoMap[creatorId]) {
    return demoMap[creatorId];
  }

  const demoUser = DEMO_USERS.find((user) => user.role === "creator");
  return demoUser?.email ?? null;
}

function appBaseUrl() {
  return getAppBaseUrl();
}

function notificationCopy(
  locale: Locale,
  type: CreatorNotificationType,
  brandName: string,
  projectTitle: string
) {
  if (locale === "zh") {
    if (type === "project_funded") {
      return {
        title: `${brandName} 已完成付款`,
        body: `「${projectTitle}」款项已托管，请查看下方完整需求表单，进入审片中心上传 V1。`
      };
    }
    if (type === "invitation_match") {
      return {
        title: "你有匹配订单",
        body: `${brandName} 向你发出了「${projectTitle}」的意向发单。你可以直接接受或拒绝。`
      };
    }
    return {
      title: `🎉 恭喜，你已被品牌选中`,
      body: `「${projectTitle}」— 品牌已确认与你合作。等待品牌完成托管付款后，项目将正式开启，届时可在审片中心上传 V1。`
    };
  }

  if (type === "project_funded") {
    return {
      title: `${brandName} funded the project`,
      body: `"${projectTitle}" is escrow-funded. Review the full brief below and upload V1 in the review center.`
    };
  }

  if (type === "invitation_match") {
    return {
      title: "You have a matching order",
      body: `${brandName} sent you an intent invitation for "${projectTitle}". Accept or decline when ready.`
    };
  }

  return {
    title: `${brandName} selected you for this project`,
    body: `"${projectTitle}" — the brand confirmed you as their creator. Once escrow payment is complete, the project opens and you can upload V1 in the review center.`
  };
}

async function resolveProject(order: StoredOrder, project: StoredProject | null): Promise<StoredProject | null> {
  if (order.project_id) {
    const fresh = await getProject(order.project_id);
    if (fresh) {
      return fresh;
    }
  }
  return project;
}

function resolveRequirementsText(project: StoredProject | null, order: StoredOrder, locale: Locale): string {
  if (project) {
    const confirmed = getConfirmedBriefText(project, locale);
    if (confirmed.trim()) {
      return confirmed;
    }
    return buildProjectRequirementsText(project, locale);
  }

  return order.requirements?.trim() ?? "";
}

export async function notifyCreatorAssignment(input: {
  type: CreatorNotificationType;
  creatorId: string;
  order: StoredOrder;
  project: StoredProject | null;
  locale: Locale;
}) {
  if (!input.order.id) {
    return null;
  }

  const project = await resolveProject(input.order, input.project);
  const requirementsText = resolveRequirementsText(project, input.order, input.locale);

  if (requirementsText.trim()) {
    await updateOrderRequirements(input.order.id, requirementsText);
  }

  const brandName = input.order.company_name || input.order.client_name;
  const projectTitle = project?.title || input.order.title || brandName;
  const copy = notificationCopy(input.locale, input.type, brandName, projectTitle);

  const existing = await findNotification(input.creatorId, input.order.id, input.type);
  if (existing) {
    if (!existing.requirements_text?.trim() && requirementsText.trim()) {
      await patchNotificationRequirements(existing.id, requirementsText);
    }
    return existing;
  }

  const notification = await createCreatorNotification({
    creator_id: input.creatorId,
    type: input.type,
    title: copy.title,
    body: copy.body,
    project_id: input.order.project_id,
    order_id: input.order.id,
    client_name: input.order.client_name,
    company_name: input.order.company_name,
    requirements_text: requirementsText
  });

  const creator = getCreatorByIdSync(input.creatorId);
  const email = resolveCreatorEmail(input.creatorId);
  if (email) {
    const actionUrl = `${appBaseUrl()}/studio/review/${input.order.id}`;
    const result = await sendCreatorNotificationEmail({
      to: email,
      creatorName: creator?.name ?? "Creator",
      locale: input.locale,
      type: input.type,
      brandName,
      projectTitle,
      requirementsText,
      actionUrl
    });

    if (result.ok && !result.skipped) {
      await markNotificationEmailSent(notification.id);
    }
  }

  return notification;
}

export async function notifyCreatorProjectSelected(input: {
  creatorId: string;
  project: StoredProject;
  order?: StoredOrder | null;
  locale: Locale;
}) {
  if (input.order) {
    const existingOrderNotification = await findNotification(
      input.creatorId,
      input.order.id,
      "creator_selected"
    );
    if (existingOrderNotification) return existingOrderNotification;
  }

  const existingProjectNotification = await findNotificationByProject(
    input.creatorId,
    input.project.id,
    "creator_selected"
  );
  if (existingProjectNotification) return existingProjectNotification;

  const brandName = input.project.company_name || input.project.client_name || "Brand";
  const projectTitle = input.project.title || input.project.product_name || brandName;
  const requirementsText = getConfirmedBriefText(input.project, input.locale) || buildProjectRequirementsText(input.project, input.locale);
  const copy = notificationCopy(input.locale, "creator_selected", brandName, projectTitle);

  return createCreatorNotification({
    creator_id: input.creatorId,
    type: "creator_selected",
    title: copy.title,
    body: copy.body,
    project_id: input.project.id,
    order_id: input.order?.id ?? null,
    client_name: input.project.client_name,
    company_name: input.project.company_name,
    requirements_text: requirementsText
  });
}

function assignmentTypeForOrder(order: StoredOrder): CreatorNotificationType | null {
  if (
    isOrderPaymentEscrowed(order.payment_status) ||
    ["paid", "in_production", "review", "revision", "ready_for_completion", "settling"].includes(order.status)
  ) {
    return "project_funded";
  }
  if (order.status === "waiting_payment") return "creator_selected";
  return null;
}

export async function ensureCreatorAssignmentNotificationsForOrders(input: {
  creatorId: string;
  orders: StoredOrder[];
  locale: Locale;
}) {
  await Promise.all(
    input.orders
      .filter((order) => order.creator_id === input.creatorId)
      .map(async (order) => {
        const type = assignmentTypeForOrder(order);
        if (!type) return null;
        const project = order.project_id ? await getProject(order.project_id) : null;
        return notifyCreatorAssignment({
          type,
          creatorId: input.creatorId,
          order,
          project,
          locale: input.locale
        }).catch(() => null);
      })
  );
}
