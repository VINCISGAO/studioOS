import "server-only";

import { resolveCreatorDisplayName } from "@/lib/studioos/creator-display-name.server";
import type { Locale } from "@/lib/i18n";
import {
  createCreatorNotification,
  findNotificationByProject,
  hasNotification
} from "@/lib/notification-service";
import type { StoredOrder } from "@/lib/order-types";
import { getProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import { createBrandNotification, hasBrandNotification } from "@/lib/studioos/brand-notification-service";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";
import type { ReviewComment } from "@/lib/studioos/review-store";
import { formatTimestamp } from "@/lib/studioos/review-utils";

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

export async function notifyCreatorPaidRevisionUnlocked(input: {
  order: StoredOrder;
  locale?: Locale;
}) {
  const exists = await hasNotification(input.order.creator_id, input.order.id, "paid_revision_unlocked");
  if (exists) return null;

  const locale = input.locale ?? input.order.client_locale ?? "en";
  const brandName = resolveBrandName(input.order);
  const projectTitle = await resolveProjectTitle(input.order);

  const copy =
    locale === "zh"
      ? {
          title: `${brandName} 已加购第 4–5 轮修订`,
          body: `「${projectTitle}」已完成额外修订服务费支付，第 4 轮修改已开启。请根据品牌批注准备并上传 V4。`
        }
      : {
          title: `${brandName} unlocked rounds 4-5 revisions`,
          body: `"${projectTitle}" paid for the additional revision add-on. Round 4 is now open — please prepare and upload V4 after reviewing the brand notes.`
        };

  return createCreatorNotification({
    creator_id: input.order.creator_id,
    type: "paid_revision_unlocked",
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
  const creatorName = await resolveCreatorDisplayName(input.order.creator_id, { locale });
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

export async function notifyBrandRequirementPublished(input: {
  brandEmail: string;
  projectId: string;
  projectTitle: string;
  locale?: Locale;
}) {
  const brandEmail = input.brandEmail.trim().toLowerCase();
  const locale = input.locale ?? "zh";
  const alreadyNotified = await hasBrandNotification({
    brand_email: brandEmail,
    project_id: input.projectId,
    creator_id: "system",
    type: "requirement_published"
  });
  if (alreadyNotified) return null;

  const copy =
    locale === "zh"
      ? {
          title: "需求发布成功",
          body: `「${input.projectTitle}」已发布，Creator 招募已开始。`
        }
      : {
          title: "Requirement published",
          body: `"${input.projectTitle}" is live — creator matching has started.`
        };

  return createBrandNotification({
    brand_email: brandEmail,
    type: "requirement_published",
    title: copy.title,
    body: copy.body,
    project_id: input.projectId,
    creator_id: "system",
    creator_name: "VINCIS"
  });
}

export async function notifyBrandPaymentRequired(input: {
  order: StoredOrder;
  locale?: Locale;
  nextRevisionRound?: number;
}) {
  const brandEmail = input.order.client_email?.trim().toLowerCase();
  const projectId = input.order.project_id;
  if (!brandEmail || !projectId) return null;

  const locale = input.locale ?? input.order.client_locale ?? "zh";
  const round = input.nextRevisionRound ?? 4;
  const projectTitle = await resolveProjectTitle(input.order);

  const copy =
    locale === "zh"
      ? {
          title: "需要支付才能继续",
          body: `「${projectTitle}」第 3 版已完成。进入第 ${round} 轮修订需先完成加购（项目金额 20%），解锁 V4–V5。`
        }
      : {
          title: "Payment required to continue",
          body: `"${projectTitle}" — V3 is done. A one-time add-on (20% of project amount) unlocks rounds 4–5 (V4–V5).`
        };

  return createBrandNotification({
    brand_email: brandEmail,
    type: "payment_required",
    title: copy.title,
    body: copy.body,
    project_id: projectId,
    creator_id: input.order.creator_id,
    creator_name: await resolveCreatorDisplayName(input.order.creator_id, { locale }),
    order_id: input.order.id
  });
}

export async function notifyBrandPaidRevisionUnlocked(input: {
  order: StoredOrder;
  locale?: Locale;
}) {
  const brandEmail = input.order.client_email?.trim().toLowerCase();
  const projectId = input.order.project_id;
  if (!brandEmail || !projectId) return null;

  const exists = await hasBrandNotification({
    brand_email: brandEmail,
    project_id: projectId,
    creator_id: input.order.creator_id,
    type: "paid_revision_unlocked",
    order_id: input.order.id
  });
  if (exists) return null;

  const locale = input.locale ?? input.order.client_locale ?? "zh";
  const projectTitle = await resolveProjectTitle(input.order);

  const copy =
    locale === "zh"
      ? {
          title: "支付成功，第 4–5 版已解锁",
          body: `「${projectTitle}」加购已完成。第 4 版与第 5 版修订已开启，可继续反馈并要求修改。`
        }
      : {
          title: "Payment successful — V4 and V5 unlocked",
          body: `"${projectTitle}" add-on paid. Revision rounds 4 and 5 (V4–V5) are now open.`
        };

  return createBrandNotification({
    brand_email: brandEmail,
    type: "paid_revision_unlocked",
    title: copy.title,
    body: copy.body,
    project_id: projectId,
    creator_id: input.order.creator_id,
    creator_name: await resolveCreatorDisplayName(input.order.creator_id, { locale }),
    order_id: input.order.id
  });
}

export async function notifyBrandOrderCompleted(input: {
  order: StoredOrder;
  locale?: Locale;
}) {
  const brandEmail = input.order.client_email?.trim().toLowerCase();
  const projectId = input.order.project_id;
  if (!brandEmail || !projectId) return null;

  const exists = await hasBrandNotification({
    brand_email: brandEmail,
    project_id: projectId,
    creator_id: input.order.creator_id,
    type: "order_completed",
    order_id: input.order.id
  });
  if (exists) return null;

  const locale = input.locale ?? input.order.client_locale ?? "zh";
  const projectTitle = await resolveProjectTitle(input.order);

  const copy =
    locale === "zh"
      ? {
          title: "订单已完成",
          body: `「${projectTitle}」最终稿已通过验收，订单已完成。`
        }
      : {
          title: "Order completed",
          body: `"${projectTitle}" final delivery approved — this order is complete.`
        };

  return createBrandNotification({
    brand_email: brandEmail,
    type: "order_completed",
    title: copy.title,
    body: copy.body,
    project_id: projectId,
    creator_id: input.order.creator_id,
    creator_name: await resolveCreatorDisplayName(input.order.creator_id, { locale }),
    order_id: input.order.id
  });
}

export async function notifyBrandFinalDownloadReady(input: {
  order: StoredOrder;
  locale?: Locale;
}) {
  const brandEmail = input.order.client_email?.trim().toLowerCase();
  const projectId = input.order.project_id;
  if (!brandEmail || !projectId) return null;

  const exists = await hasBrandNotification({
    brand_email: brandEmail,
    project_id: projectId,
    creator_id: input.order.creator_id,
    type: "final_download_ready",
    order_id: input.order.id
  });
  if (exists) return null;

  const locale = input.locale ?? input.order.client_locale ?? "zh";
  const projectTitle = await resolveProjectTitle(input.order);

  const copy =
    locale === "zh"
      ? {
          title: "文件已可下载",
          body: `「${projectTitle}」最终成片已就绪，可在项目页下载。`
        }
      : {
          title: "Final file ready to download",
          body: `"${projectTitle}" final delivery is ready — download from the project page.`
        };

  return createBrandNotification({
    brand_email: brandEmail,
    type: "final_download_ready",
    title: copy.title,
    body: copy.body,
    project_id: projectId,
    creator_id: input.order.creator_id,
    creator_name: await resolveCreatorDisplayName(input.order.creator_id, { locale }),
    order_id: input.order.id
  });
}

export async function notifyPlatformInterventionRequired(input: {
  order: StoredOrder;
  locale?: Locale;
  version?: number | null;
}) {
  const locale = input.locale ?? input.order.client_locale ?? "zh";
  const projectId = input.order.project_id;
  const projectTitle = await resolveProjectTitle(input.order);
  const versionLabel = input.version ? `V${input.version}` : "V5";
  const creatorName = await resolveCreatorDisplayName(input.order.creator_id, { locale });

  if (projectId) {
    const brandExists = await hasBrandNotification({
      brand_email: input.order.client_email,
      project_id: projectId,
      creator_id: input.order.creator_id,
      type: "platform_intervention_required",
      order_id: input.order.id
    });
    if (!brandExists) {
      await createBrandNotification({
        brand_email: input.order.client_email,
        type: "platform_intervention_required",
        title: locale === "zh" ? "第五稿后需平台介入" : "Platform intervention required",
        body:
          locale === "zh"
            ? `「${projectTitle}」已到 ${versionLabel}，第五轮后仍未通过请联系平台客服仲裁。`
            : `"${projectTitle}" reached ${versionLabel}. Further changes require support arbitration.`,
        project_id: projectId,
        creator_id: input.order.creator_id,
        creator_name: creatorName,
        order_id: input.order.id,
        deliverable_version: input.version ?? null
      });
    }
  }

  const creatorExists = await hasNotification(
    input.order.creator_id,
    input.order.id,
    "platform_intervention_required"
  );
  if (creatorExists) return null;

  return createCreatorNotification({
    creator_id: input.order.creator_id,
    type: "platform_intervention_required",
    title: locale === "zh" ? "项目进入平台介入" : "Project moved to platform intervention",
    body:
      locale === "zh"
        ? `「${projectTitle}」已完成最多 5 版审片，后续将由平台客服介入仲裁。`
        : `"${projectTitle}" has reached the 5-version review limit. Support will arbitrate next steps.`,
    project_id: projectId,
    order_id: input.order.id,
    client_name: input.order.client_name,
    company_name: input.order.company_name,
    requirements_text: ""
  });
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
