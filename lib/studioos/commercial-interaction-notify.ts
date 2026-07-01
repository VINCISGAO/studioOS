import "server-only";

import { getCreatorByIdSync } from "@/lib/creator-service";
import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import {
  createCreatorNotification,
  findNotificationByProject,
  hasNotification
} from "@/lib/notification-service";
import type { StoredOrder } from "@/lib/order-types";
import { getProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import { createBrandNotification } from "@/lib/studioos/brand-notification-service";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";
import type { ReviewComment } from "@/lib/studioos/review-store";
import { formatTimestamp } from "@/lib/studioos/review-utils";

function resolveCreatorName(creatorId: string): string {
  return getCreatorByIdSync(creatorId)?.name ?? creators.find((item) => item.id === creatorId)?.name ?? creatorId;
}

async function resolveProjectTitle(order: StoredOrder): Promise<string> {
  const project = order.project_id ? await getProject(order.project_id) : null;
  return (
    project?.title ||
    project?.product_name ||
    order.title ||
    project?.company_name ||
    order.company_name ||
    "Project"
  );
}

function resolveBrandName(order: StoredOrder): string {
  return order.company_name || order.client_name || "Brand";
}

export async function notifyCreatorReviewComment(input: {
  order: StoredOrder;
  comment: ReviewComment;
  locale?: Locale;
}) {
  const locale = input.locale ?? input.order.client_locale ?? "en";
  const brandName = resolveBrandName(input.order);
  const projectTitle = await resolveProjectTitle(input.order);
  const timeLabel = formatTimestamp(input.comment.timestamp_sec);
  const issue = input.comment.issue_type ?? (locale === "zh" ? "批注" : "Note");

  const copy =
    locale === "zh"
      ? {
          title: `${brandName} 添加了审片批注`,
          body: `「${projectTitle}」${timeLabel} — ${issue}：${input.comment.body}`
        }
      : {
          title: `${brandName} left a review note`,
          body: `"${projectTitle}" at ${timeLabel} — ${issue}: ${input.comment.body}`
        };

  return createCreatorNotification({
    creator_id: input.order.creator_id,
    type: "review_comment_added",
    title: copy.title,
    body: copy.body,
    project_id: input.order.project_id,
    order_id: input.order.id,
    client_name: input.order.client_name,
    company_name: input.order.company_name,
    requirements_text: ""
  });
}

export async function notifyCreatorRevisionRequested(input: {
  order: StoredOrder;
  notes?: string;
  locale?: Locale;
}) {
  const locale = input.locale ?? input.order.client_locale ?? "en";
  const brandName = resolveBrandName(input.order);
  const projectTitle = await resolveProjectTitle(input.order);
  const notes = input.notes?.trim();

  const copy =
    locale === "zh"
      ? {
          title: `${brandName} 申请修改`,
          body: notes
            ? `「${projectTitle}」— ${notes}`
            : `「${projectTitle}」— 品牌要求你上传修改版，请查看审片批注。`
        }
      : {
          title: `${brandName} requested a revision`,
          body: notes
            ? `"${projectTitle}" — ${notes}`
            : `"${projectTitle}" — upload a new version after reviewing the brand's notes.`
        };

  return createCreatorNotification({
    creator_id: input.order.creator_id,
    type: "revision_requested",
    title: copy.title,
    body: copy.body,
    project_id: input.order.project_id,
    order_id: input.order.id,
    client_name: input.order.client_name,
    company_name: input.order.company_name,
    requirements_text: ""
  });
}

export async function notifyCreatorDeliveryApproved(input: {
  order: StoredOrder;
  locale?: Locale;
}) {
  const exists = await hasNotification(input.order.creator_id, input.order.id, "delivery_approved");
  if (exists) return null;

  const locale = input.locale ?? input.order.client_locale ?? "en";
  const brandName = resolveBrandName(input.order);
  const projectTitle = await resolveProjectTitle(input.order);

  const copy =
    locale === "zh"
      ? {
          title: `${brandName} 已批准交付`,
          body: `「${projectTitle}」已通过验收，项目已完成。`
        }
      : {
          title: `${brandName} approved delivery`,
          body: `"${projectTitle}" is approved — the project is complete.`
        };

  return createCreatorNotification({
    creator_id: input.order.creator_id,
    type: "delivery_approved",
    title: copy.title,
    body: copy.body,
    project_id: input.order.project_id,
    order_id: input.order.id,
    client_name: input.order.client_name,
    company_name: input.order.company_name,
    requirements_text: ""
  });
}

function formatPayoutUsd(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export async function notifyCreatorEscrowReleased(input: {
  order: StoredOrder;
  locale?: Locale;
}) {
  const exists = await hasNotification(input.order.creator_id, input.order.id, "escrow_released");
  if (exists) return null;

  const locale = input.locale ?? input.order.client_locale ?? "en";
  const projectTitle = await resolveProjectTitle(input.order);
  const amount = formatPayoutUsd(input.order.creator_payout);

  const copy =
    locale === "zh"
      ? {
          title: "收款到账",
          body: `「${projectTitle}」托管款 ${amount} 已自动释放至你的收入账户。`
        }
      : {
          title: "Payment received",
          body: `"${projectTitle}" — ${amount} escrow has been released to your income account.`
        };

  return createCreatorNotification({
    creator_id: input.order.creator_id,
    type: "escrow_released",
    title: copy.title,
    body: copy.body,
    project_id: input.order.project_id,
    order_id: input.order.id,
    client_name: input.order.client_name,
    company_name: input.order.company_name,
    requirements_text: ""
  });
}

export async function notifyBrandCommentResolved(input: {
  order: StoredOrder;
  comment: ReviewComment;
  locale?: Locale;
}) {
  const brandEmail = input.order.client_email?.trim().toLowerCase();
  const projectId = input.order.project_id;
  if (!brandEmail || !projectId) return null;

  const locale = input.locale ?? input.order.client_locale ?? "en";
  const creatorName = resolveCreatorName(input.order.creator_id);
  const projectTitle = await resolveProjectTitle(input.order);
  const timeLabel = formatTimestamp(input.comment.timestamp_sec);
  const issue = input.comment.issue_type ?? (locale === "zh" ? "批注" : "Note");

  const copy =
    locale === "zh"
      ? {
          title: `${creatorName} 已处理批注`,
          body: `「${projectTitle}」${timeLabel} — ${issue} 已标记为已解决。`
        }
      : {
          title: `${creatorName} resolved a review note`,
          body: `"${projectTitle}" at ${timeLabel} — ${issue} marked resolved.`
        };

  return createBrandNotification({
    brand_email: brandEmail,
    type: "comment_resolved",
    title: copy.title,
    body: copy.body,
    project_id: projectId,
    creator_id: input.order.creator_id,
    creator_name: creatorName,
    order_id: input.order.id,
    comment_id: input.comment.id
  });
}

export async function notifyCreatorsInvitationExpired(input: {
  project: StoredProject;
  locale: Locale;
  expiredCreatorIds: string[];
}) {
  const brandName = input.project.company_name || input.project.client_name || "Brand";
  const projectTitle = input.project.title || input.project.product_name || brandName;
  const requirementsText = getConfirmedBriefText(input.project, input.locale);

  await Promise.all(
    input.expiredCreatorIds.map(async (creatorId) => {
      const existing = await findNotificationByProject(creatorId, input.project.id, "not_selected");
      if (existing) return null;

      const copy =
        input.locale === "zh"
          ? {
              title: "该 Campaign 已完成选择",
              body: `「${projectTitle}」该Campaign已完成选择，谢谢参与。`
            }
          : {
              title: "Campaign selection complete",
              body: `"${projectTitle}" — selection is complete. Thanks for participating.`
            };

      return createCreatorNotification({
        creator_id: creatorId,
        type: "not_selected",
        title: copy.title,
        body: copy.body,
        project_id: input.project.id,
        order_id: null,
        client_name: input.project.client_name,
        company_name: input.project.company_name,
        requirements_text: requirementsText
      });
    })
  );
}

/** @deprecated Use notifyCreatorsInvitationExpired */
export async function notifyCreatorsNotSelected(input: {
  project: StoredProject;
  locale: Locale;
  notSelectedCreatorIds: string[];
}) {
  return notifyCreatorsInvitationExpired({
    project: input.project,
    locale: input.locale,
    expiredCreatorIds: input.notSelectedCreatorIds
  });
}
