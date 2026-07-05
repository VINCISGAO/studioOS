"use server";

import { revalidatePath } from "next/cache";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getCurrentCreatorId } from "@/lib/creator-session";
import type { Locale } from "@/lib/i18n";
import {
  addDeliverable,
  approveOrderDelivery,
  getOrder,
  listDeliverablesForUpload,
  requestOrderRevision,
  resumeReviewFromReadyForCompletion,
  syncOrderToReadyForCompletion,
  upsertJsonDeliverable
} from "@/lib/order-service";
import { getClientPreferredLocale } from "@/lib/studioos/client-locale";
import type { ReviewSettlementPreview } from "@/lib/studioos/reviewer-settlement-ui";
import {
  addReviewComment,
  deleteReviewComment,
  listReviewComments,
  parseReviewCommentAnnotations,
  setReviewCommentStatus,
  upsertReviewCommentStatusOverride,
  type ReviewCommentStatus
} from "@/lib/studioos/review-store";
import { translateForClient } from "@/lib/studioos/translate";
import { hasReviewVideoFileOnDisk, saveReviewVideoUpload } from "@/lib/studioos/video-upload";
import {
  assertRevisionRequestAllowed,
  assertReviewVersionUploadAllowed,
  PAID_REVISION_SURCHARGE_RATE,
} from "@/features/review/review-round-policy";
import {
  paidRevisionErrorMessage,
  paidRevisionService
} from "@/features/review/paid-revision.service";
import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { userRepository } from "@/features/auth/user.repository";
import { creatorRevertUploadService } from "@/features/delivery/creator-revert-upload.service";
import { versionService } from "@/features/delivery/version.service";
import { MAX_CAMPAIGN_VERSIONS, versionRepository } from "@/features/delivery/version.repository";
import { reviewPortalService } from "@/features/review/review-portal.service";
import { settlementService } from "@/features/settlement/settlement.service";
import { SettlementState, type SettlementStateValue } from "@/features/settlement/settlement.state-machine";
import { notificationService } from "@/features/notification/notification.service";
import { getAppBaseUrl } from "@/lib/app-url";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { normalizeReviewCommentTimestampSec } from "@/lib/studioos/review-comment-time";
import { enrichReviewCommentAnnotations } from "@/lib/studioos/review-annotation-json";
import {
  blocksCreatorNewVersionUpload,
  filterPlayableDeliverables,
  isUnsubmittedDeliverable,
  latestSubmittedDeliverableVersion,
  resolveReviewUploadVersionForOrder
} from "@/lib/studioos/review-upload-version";
import { notifyBrandDeliverableUploaded } from "@/lib/studioos/brand-deliverable-notify";
import {
  notifyCreatorDeliveryApproved,
  notifyCreatorEscrowReleased,
  notifyCreatorRevisionRequested,
  notifyCreatorPaidRevisionUnlocked,
  notifyBrandPaymentRequired,
  notifyBrandPaidRevisionUnlocked,
  notifyBrandOrderCompleted
} from "@/lib/studioos/commercial-interaction-notify";
import { hasBrandNotification } from "@/lib/studioos/brand-notification-service";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

function reviewPortalErrorMessage(code: string, lang: Locale): string {
  if (lang === "zh") {
    if (code === "version-not-found") return "找不到对应审片版本";
    if (code === "invalid-status") return "当前审片状态不允许此操作";
    if (code === "invalid-parent") return "只能回复 Brand 批注";
    if (code === "invalid-transition") return "评论状态流转不合法";
    if (code === "already-resolved") return "已解决批注不可修改";
    if (code === "not-found") return "批注不存在";
    if (code === "unauthorized") return "无权限";
    if (code === "PAYMENT_REQUIRED") return paidRevisionErrorMessage("PAYMENT_REQUIRED", lang);
    if (code === "REVIEW_LOCKED") return paidRevisionErrorMessage("REVIEW_LOCKED", lang);
    return "审片操作失败，请稍后重试";
  }
  if (code === "version-not-found") return "Review version not found";
  if (code === "invalid-status") return "This action is not allowed in the current review state";
  if (code === "not-found") return "Comment not found";
  if (code === "unauthorized") return "Unauthorized";
  if (code === "PAYMENT_REQUIRED") return paidRevisionErrorMessage("PAYMENT_REQUIRED", lang);
  if (code === "REVIEW_LOCKED") return paidRevisionErrorMessage("REVIEW_LOCKED", lang);
  return "Review action failed. Please try again.";
}

function revalidateReview(orderId: string, projectId?: string | null) {
  revalidatePath("/brand");
  revalidatePath("/brand/review");
  revalidatePath("/brand/messages");
  revalidatePath("/studio");
  revalidatePath("/studio/review");
  revalidatePath("/studio/messages");
  revalidatePath(`/brand/projects/${orderId}/review`);
  revalidatePath(`/studio/review/${orderId}`);
  revalidatePath(`/studio/projects/${orderId}`);
  revalidatePath(`/creator/orders/${orderId}`);
  revalidatePath(`/creator/orders/${orderId}/review-upload`);
  revalidatePath(`/brand/orders/${orderId}/review`);
  if (projectId) {
    revalidatePath(`/brand/projects/${projectId}`);
    revalidatePath(`/brand/projects/${projectId}/review`);
  }
}

function parseAnnotationsJson(
  raw: FormDataEntryValue | null,
  timestampSec: number,
  fallback?: { x?: number | null; y?: number | null }
) {
  if (!raw || typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = parseReviewCommentAnnotations(JSON.parse(raw) as unknown, `ann_${Date.now()}`);
    return enrichReviewCommentAnnotations(parsed, timestampSec, fallback);
  } catch {
    return [];
  }
}

export async function addReviewCommentAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const version = Number(formData.get("version") ?? 1);
  const timestampSec = normalizeReviewCommentTimestampSec(formData.get("timestamp_sec"));
  const body = String(formData.get("body") ?? "").trim();
  const issueType = String(formData.get("issue_type") ?? "").trim() || null;
  const posXRaw = formData.get("pos_x");
  const posYRaw = formData.get("pos_y");
  const posX = posXRaw != null && posXRaw !== "" ? Number(posXRaw) : null;
  const posY = posYRaw != null && posYRaw !== "" ? Number(posYRaw) : null;
  const annotations = parseAnnotationsJson(formData.get("annotations_json"), timestampSec, {
    x: posX,
    y: posY
  });

  if (!orderId || !body) {
    return { ok: false as const, error: lang === "zh" ? "请输入批注" : "Enter a comment" };
  }

  const clientEmail = (await getCurrentClientEmail())?.toLowerCase() ?? null;
  const order = await getOrder(orderId);
  if (!order || !clientEmail || order.client_email.toLowerCase() !== clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }
  if (order.status !== "review") {
    return {
      ok: false as const,
      error: lang === "zh" ? "当前版本已锁定，不能新增批注" : "This version is locked for new comments"
    };
  }
  const deliverables = await listDeliverablesForUpload(orderId);
  const latestSubmitted = latestSubmittedDeliverableVersion(deliverables);
  const revisionGate = assertRevisionRequestAllowed({
    currentVersionNumber: latestSubmitted,
    paidSlotsUnlocked: order.paid_revision_slots_unlocked ?? 0
  });
  if (
    version === latestSubmitted &&
    latestSubmitted > 0 &&
    !revisionGate.ok &&
    revisionGate.code === "PAYMENT_REQUIRED"
  ) {
    return {
      ok: false as const,
      error: lang === "zh" ? "修改次数已达交付上限" : "Revision limit reached"
    };
  }

  let comment: Awaited<ReturnType<typeof addReviewComment>> | null = null;

  if (hasDatabaseUrl() && order.project_id) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    if (campaign) {
      const result = await reviewPortalService.addCommentForLegacyOrder({
        orderId,
        legacyProjectId: order.project_id,
        brandEmail: clientEmail,
        version,
        timestampSec,
        body,
        posX,
        posY,
        issueType,
        annotations,
        locale: lang
      });

      if (result.ok) {
        comment = result.comment;
      } else {
        return { ok: false as const, error: reviewPortalErrorMessage(result.error, lang) };
      }
    }
  }

  if (!comment) {
    comment = await addReviewComment({
      order_id: orderId,
      version,
      timestamp_sec: timestampSec,
      body,
      pos_x: posX,
      pos_y: posY,
      issue_type: issueType,
      author: "brand",
      created_by: clientEmail,
      author_display_name: order.client_name || order.company_name || clientEmail.split("@")[0],
      annotations
    });
  }

  revalidateReview(orderId, order.project_id);
  return { ok: true as const, comment };
}

export async function addStudioReviewCommentAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const version = Number(formData.get("version") ?? 1);
  const body = String(formData.get("body") ?? "").trim();
  const replyToCommentId = String(formData.get("reply_to_comment_id") ?? "").trim();

  if (!orderId || !body) {
    return { ok: false as const, error: lang === "zh" ? "请输入回复" : "Enter a reply" };
  }
  if (!replyToCommentId) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请通过回复 Brand 批注来留言" : "Reply to a Brand note to comment"
    };
  }

  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);
  if (!order || !creatorId || order.creator_id !== creatorId) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }
  if (!["review", "revision"].includes(order.status)) {
    return { ok: false as const, error: lang === "zh" ? "当前阶段不可回复" : "Replies are not allowed in this phase" };
  }

  const parent = (await listReviewComments(orderId)).find((item) => item.id === replyToCommentId);
  if (!parent || parent.version !== version || parent.author !== "brand") {
    return {
      ok: false as const,
      error: lang === "zh" ? "只能回复 Brand 批注" : "You can only reply to Brand notes"
    };
  }

  if (hasDatabaseUrl() && order.project_id) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    if (campaign) {
      const result = await reviewPortalService.addStudioReplyForLegacyOrder({
        orderId,
        legacyProjectId: order.project_id,
        legacyCreatorId: creatorId,
        version,
        body,
        replyToCommentId
      });
      if (result.ok) {
        revalidateReview(orderId, order.project_id);
        return { ok: true as const, comment: result.comment };
      }
      return { ok: false as const, error: reviewPortalErrorMessage(result.error, lang) };
    }
  }

  const comment = await addReviewComment({
    order_id: orderId,
    version,
    timestamp_sec: parent.timestamp_sec,
    body,
    author: "studio",
    created_by: creatorId,
    author_display_name: "Studio"
  });

  revalidateReview(orderId, order.project_id);
  return { ok: true as const, comment };
}

export async function updateReviewCommentStatusAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const commentId = String(formData.get("comment_id") ?? "");
  const rawStatus = formData.get("status");
  const status: ReviewCommentStatus =
    rawStatus === "resolved" ? "resolved" : rawStatus === "todo" ? "todo" : "todo";

  const clientEmail = await getCurrentClientEmail();
  const order = await getOrder(orderId);
  if (!order || !clientEmail || order.client_email !== clientEmail.toLowerCase()) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  const existing = (await listReviewComments(orderId)).find((item) => item.id === commentId);
  if (!existing) {
    return { ok: false as const, error: lang === "zh" ? "批注不存在" : "Comment not found" };
  }
  if (status === "resolved" && existing.status !== "pending_confirmation") {
    return {
      ok: false as const,
      error: lang === "zh" ? "只有待确认批注可以确认解决" : "Only comments pending confirmation can be resolved"
    };
  }

  if (hasDatabaseUrl() && order.project_id) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    if (campaign) {
      const result = await reviewPortalService.updateCommentStatusForLegacyOrder({
        orderId,
        legacyProjectId: order.project_id,
        brandEmail: clientEmail.toLowerCase(),
        commentId,
        status
      });
      if (result.ok) {
        const comment = await upsertReviewCommentStatusOverride(result.comment, status);
        revalidateReview(orderId, order.project_id);
        return { ok: true as const, comment };
      }
      return { ok: false as const, error: reviewPortalErrorMessage(result.error, lang) };
    }
  }

  const comment = await setReviewCommentStatus(commentId, orderId, status);
  if (!comment) {
    return { ok: false as const, error: lang === "zh" ? "批注不存在" : "Comment not found" };
  }
  revalidateReview(orderId, order.project_id);
  return { ok: true as const, comment };
}

export async function resolveReviewCommentAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const commentId = String(formData.get("comment_id") ?? "");
  const status: ReviewCommentStatus = "resolved";

  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);
  if (!order || !creatorId || order.creator_id !== creatorId) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }
  if (!["review", "revision"].includes(order.status)) {
    return { ok: false as const, error: lang === "zh" ? "当前阶段不可更新批注状态" : "Comment status cannot be updated in this phase" };
  }

  if (hasDatabaseUrl() && order.project_id) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    if (campaign) {
      const comments = await listReviewComments(orderId);
      const existing = comments.find((item) => item.id === commentId);
      if (!existing) {
        return { ok: false as const, error: lang === "zh" ? "批注不存在" : "Comment not found" };
      }
      if (existing.status === "resolved") {
        if (status === "resolved") {
          return { ok: true as const, comment: existing };
        }
        return { ok: false as const, error: lang === "zh" ? "已解决批注不可修改状态" : "Resolved comments cannot be changed" };
      }
      if (!["todo", "in_progress", "pending_confirmation"].includes(existing.status)) {
        return { ok: false as const, error: lang === "zh" ? "评论状态流转不合法" : "Invalid comment status transition" };
      }

      const result =
        status === "resolved"
          ? await reviewPortalService.resolveCommentForLegacyOrder({
              orderId,
              legacyProjectId: order.project_id,
              legacyCreatorId: creatorId,
              commentId
            })
          : await reviewPortalService.updateCreatorCommentWorkflowForLegacyOrder({
              orderId,
              legacyProjectId: order.project_id,
              legacyCreatorId: creatorId,
              commentId,
              status
            });
      if (!result.ok) {
        return { ok: false as const, error: reviewPortalErrorMessage(result.error, lang) };
      }

      const comment = await upsertReviewCommentStatusOverride(result.comment, status);
      revalidateReview(orderId, order.project_id);
      return { ok: true as const, comment };
    }
  }

  const existing = (await listReviewComments(orderId)).find((item) => item.id === commentId);
  if (!existing) {
    return { ok: false as const, error: lang === "zh" ? "批注不存在" : "Comment not found" };
  }
  if (existing.status === "resolved") {
    if (status === "resolved") {
      return { ok: true as const, comment: existing };
    }
    return { ok: false as const, error: lang === "zh" ? "已解决批注不可修改状态" : "Resolved comments cannot be changed" };
  }
  if (!["todo", "in_progress", "pending_confirmation"].includes(existing.status)) {
    return { ok: false as const, error: lang === "zh" ? "评论状态流转不合法" : "Invalid comment status transition" };
  }

  const comment = await setReviewCommentStatus(commentId, orderId, status);
  if (!comment) {
    return { ok: false as const, error: lang === "zh" ? "批注不存在" : "Comment not found" };
  }

  revalidateReview(orderId, order.project_id);
  return { ok: true as const, comment };
}

export async function deleteReviewCommentAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const commentId = String(formData.get("comment_id") ?? "");

  const clientEmail = (await getCurrentClientEmail())?.toLowerCase() ?? null;
  const order = await getOrder(orderId);
  if (!order || !clientEmail || order.client_email.toLowerCase() !== clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  const existing = (await listReviewComments(orderId)).find((item) => item.id === commentId);
  if (!existing) {
    return { ok: false as const, error: lang === "zh" ? "批注不存在" : "Comment not found" };
  }
  if (existing.author !== "brand") {
    return { ok: false as const, error: lang === "zh" ? "不能删除 Studio 回复" : "Studio replies cannot be deleted" };
  }

  if (hasDatabaseUrl() && order.project_id) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    if (campaign) {
      const result = await reviewPortalService.deleteCommentForLegacyOrder({
        orderId,
        legacyProjectId: order.project_id,
        brandEmail: clientEmail,
        commentId
      });

      if (result.ok) {
        await deleteReviewComment(commentId, orderId).catch(() => undefined);
        revalidateReview(orderId, order.project_id);
        return { ok: true as const, commentId: result.commentId };
      }

      return { ok: false as const, error: reviewPortalErrorMessage(result.error, lang) };
    }
  }

  const deleted = await deleteReviewComment(commentId, orderId);
  if (!deleted) {
    return { ok: false as const, error: lang === "zh" ? "批注不存在" : "Comment not found" };
  }

  revalidateReview(orderId, order.project_id);
  return { ok: true as const, commentId: deleted.id };
}

function uploadErrorMessage(code: string, lang: Locale): string {
  if (lang === "zh") {
    if (code === "max-versions") return "已达第 5 轮修订上限（V5），如需继续请联系平台介入";
    if (code === "invalid-status") return "当前订单状态不可上传新版本";
    if (code === "PAYMENT_REQUIRED") return paidRevisionErrorMessage("PAYMENT_REQUIRED", lang);
    if (code === "REVIEW_LOCKED") return paidRevisionErrorMessage("REVIEW_LOCKED", lang);
    if (code === "creator-not-assigned") return "品牌尚未选定 Studio，无法上传";
    if (code === "project-not-found") return "找不到对应项目";
    if (code === "no-database") return "数据库未配置，无法上传";
    return "无权限";
  }
  if (code === "max-versions") return "Revision round 5 (V5) is the limit. Contact platform support to continue.";
  if (code === "invalid-status") return "Cannot upload a new version in the current order status";
  if (code === "PAYMENT_REQUIRED") return paidRevisionErrorMessage("PAYMENT_REQUIRED", lang);
  if (code === "REVIEW_LOCKED") return paidRevisionErrorMessage("REVIEW_LOCKED", lang);
  if (code === "creator-not-assigned") return "Brand has not selected a studio yet";
  if (code === "project-not-found") return "Project not found";
  if (code === "no-database") return "Database is not configured";
  return "Unauthorized";
}

export async function uploadVideoVersionAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const fileUrl = String(formData.get("file_url") ?? "").trim();
  const requestedVersion = Number(formData.get("version") ?? 0);
  const file = formData.get("video_file");

  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);
  if (!order || !creatorId || order.creator_id !== creatorId) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  const deliverables = await listDeliverablesForUpload(orderId);
  const paidPolicy = await paidRevisionService.resolvePolicyForOrder({
    orderId,
    projectId: order.project_id
  });
  const uploadTarget = await resolveReviewUploadVersionForOrder(
    orderId,
    deliverables,
    order.status,
    paidPolicy.paidRevisionSlotsUnlocked
  );
  const latestSubmitted = latestSubmittedDeliverableVersion(deliverables);
  if (
    blocksCreatorNewVersionUpload({
      orderStatus: order.status,
      replace: uploadTarget.replace,
      latestSubmitted
    })
  ) {
    return { ok: false as const, error: uploadErrorMessage("invalid-status", lang) };
  }

  const uploadGate = assertReviewVersionUploadAllowed({
    targetVersion: uploadTarget.version,
    paidSlotsUnlocked: paidPolicy.paidRevisionSlotsUnlocked
  });
  if (!uploadGate.ok) {
    return {
      ok: false as const,
      error: uploadErrorMessage(uploadGate.code === "PAYMENT_REQUIRED" ? "PAYMENT_REQUIRED" : "REVIEW_LOCKED", lang)
    };
  }

  const playableCount = (await filterPlayableDeliverables(orderId, deliverables)).length;
  if (!uploadTarget.replace && playableCount >= MAX_CAMPAIGN_VERSIONS) {
    return { ok: false as const, error: uploadErrorMessage("max-versions", lang) };
  }

  const nextVersion =
    Number.isFinite(requestedVersion) && requestedVersion === uploadTarget.version
      ? requestedVersion
      : uploadTarget.version;

  let resolvedUrl = fileUrl;
  if (file instanceof File && file.size > 0) {
    const saved = await saveReviewVideoUpload(orderId, nextVersion, file, lang);
    if (!saved.ok) {
      return { ok: false as const, error: saved.error };
    }
    resolvedUrl = saved.url;
  }

  if (!resolvedUrl) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请上传 MP4 或填写视频链接" : "Upload an MP4 or provide a video URL"
    };
  }

  if (!(await hasReviewVideoFileOnDisk(orderId, nextVersion))) {
    return {
      ok: false as const,
      error: lang === "zh" ? "视频文件未保存成功，请重新上传" : "Video file was not saved. Please try again."
    };
  }

  const clientLocale = getClientPreferredLocale(order.client_email, order.client_locale);
  const translation = await translateForClient(notes, lang, clientLocale);

  if (hasDatabaseUrl() && order.project_id) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    if (campaign) {
      const prismaResult = await versionService.uploadForLegacyOrder({
        legacyProjectId: order.project_id,
        orderId,
        legacyCreatorId: creatorId,
        videoUrl: resolvedUrl,
        notes,
        notesForClient: translation.text,
        notesClientLocale: clientLocale,
        locale: lang,
        versionNumber: nextVersion,
        replaceExisting: uploadTarget.replace,
        orderStatus: order.status,
        paidRevisionSlotsUnlocked: paidPolicy.paidRevisionSlotsUnlocked
      });

      if (prismaResult.ok) {
        revalidateReview(orderId, order.project_id);
        return {
          ok: true as const,
          deliverable: prismaResult.deliverable,
          translated: prismaResult.translated
        };
      }
      return { ok: false as const, error: uploadErrorMessage(prismaResult.error, lang) };
    }
  }

  const deliverable = uploadTarget.replace
    ? await upsertJsonDeliverable(orderId, {
        id: deliverables.find((item) => item.version === nextVersion)?.id ?? `del_${orderId}_v${nextVersion}`,
        order_id: orderId,
        file_url: resolvedUrl,
        thumbnail_url: resolvedUrl,
        notes,
        notes_for_client: translation.text,
        notes_client_locale: clientLocale,
        version: nextVersion,
        created_at: deliverables.find((item) => item.version === nextVersion)?.created_at ?? new Date().toISOString()
      })
    : await addDeliverable(orderId, {
        file_url: resolvedUrl,
        notes,
        notes_for_client: translation.text,
        notes_client_locale: clientLocale
      });

  if (!deliverable) {
    return {
      ok: false as const,
      error:
        lang === "zh"
          ? "当前订单状态不可上传新版本"
          : "Cannot upload a new version in the current order status"
    };
  }

  revalidateReview(orderId, order.project_id);
  return { ok: true as const, deliverable, translated: translation.translated };
}

export async function requestBrandReviewAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "").trim();
  const requestedVersion = Number(formData.get("version") ?? 0);

  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);
  if (!order || !creatorId || order.creator_id !== creatorId) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  const deliverables = await listDeliverablesForUpload(orderId);
  const latestSubmitted = latestSubmittedDeliverableVersion(deliverables);
  const version =
    Number.isFinite(requestedVersion) && requestedVersion > 0
      ? requestedVersion
      : latestSubmitted;
  const deliverable = deliverables.find((item) => item.version === version) ?? null;

  if (!deliverable || isUnsubmittedDeliverable(deliverable)) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请先上传当前稿件" : "Upload the current draft first"
    };
  }

  if (!(await hasReviewVideoFileOnDisk(orderId, version))) {
    return {
      ok: false as const,
      error: lang === "zh" ? "视频文件未保存成功，请重新上传" : "Video file was not saved. Please upload again."
    };
  }

  if (hasDatabaseUrl() && order.project_id) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    const campaignVersion = campaign
      ? await versionRepository.findByCampaignAndVersionNumber(campaign.id, version)
      : null;
    if (campaignVersion && (campaignVersion.status !== "READY" || campaignVersion.reviewStatus !== "READY")) {
      return {
        ok: true as const,
        message:
          lang === "zh"
            ? `V${version} 正在转码处理中，完成后会自动通知项目方审片`
            : `V${version} is still processing. The brand will be notified automatically when it is ready.`
      };
    }
  }

  if (order.project_id) {
    const alreadySubmitted = await hasBrandNotification({
      brand_email: order.client_email,
      project_id: order.project_id,
      creator_id: order.creator_id,
      type: "deliverable_uploaded",
      order_id: order.id,
      deliverable_version: version
    });
    if (alreadySubmitted) {
      return {
        ok: false as const,
        error: lang === "zh" ? "请勿重复提交" : "Please do not submit repeatedly"
      };
    }
  }

  await notifyBrandDeliverableUploaded({
    order,
    deliverable,
    locale: lang
  });

  if (hasDatabaseUrl() && order.project_id) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    if (campaign) {
      await notificationService
        .notify({
          userId: campaign.brandId,
          campaignId: campaign.id,
          title: lang === "zh" ? "Studio 申请项目方批阅" : "Studio requested brand review",
          content:
            lang === "zh"
              ? `V${version} 已准备好，请前往审片页批阅。`
              : `V${version} is ready. Please open the review workspace.`,
          actionUrl: `${getAppBaseUrl()}/brand/projects/${order.project_id}/review`,
          email: false
        })
        .catch(() => undefined);

      const creatorUser = campaign.creatorId ? await userRepository.findById(campaign.creatorId) : null;
      await activityService.write(
        campaign.id,
        "review.brand_review_requested",
        creatorUser
          ? {
              userId: creatorUser.id,
              email: creatorUser.email,
              role: "creator"
            }
          : {
              email: creatorId,
              role: "creator"
            },
        {
          order_id: orderId,
          version_number: version
        }
      );
    }
  }

  revalidateReview(orderId, order.project_id);
  return {
    ok: true as const,
    message:
      lang === "zh"
        ? `已向项目方发送 V${version} 批阅申请`
        : `Review request for V${version} sent to the brand`
  };
}

export async function revertCreatorReviewUploadAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "").trim();
  const requestedVersion = Number(formData.get("version") ?? 0);

  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);
  if (!order || !creatorId || order.creator_id !== creatorId) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  const result = await creatorRevertUploadService.revertForLegacyOrder({
    orderId,
    legacyCreatorId: creatorId,
    legacyProjectId: order.project_id,
    locale: lang,
    versionNumber: Number.isFinite(requestedVersion) && requestedVersion > 0 ? requestedVersion : undefined
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidateReview(orderId, order.project_id);
  return {
    ok: true as const,
    message: result.message,
    orderStatus: result.orderStatus,
    version: result.version
  };
}

export async function requestReviewRevisionAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "").trim();
  const version = Number(formData.get("version") ?? 1);
  const revisionNotes = String(formData.get("revision_notes") ?? "").trim();

  const clientEmail = (await getCurrentClientEmail())?.toLowerCase() ?? null;
  const order = await getOrder(orderId);
  if (!order || !clientEmail || order.client_email.toLowerCase() !== clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  if (order.status !== "review") {
    return {
      ok: false as const,
      error: lang === "zh" ? "当前版本不可提交修改" : "This version cannot be sent back for changes"
    };
  }

  const comments = await listReviewComments(orderId, version);
  const hasBrandRevisionNote = comments.some(
    (item) =>
      item.author === "brand" &&
      ((item.annotations?.length ?? 0) > 0 || (item.pos_x != null && item.pos_y != null))
  );
  if (!hasBrandRevisionNote) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请至少添加一条修改意见。" : "Please add at least one revision note."
    };
  }

  const legacyProjectId = projectId || order.project_id;
  if (hasDatabaseUrl() && legacyProjectId) {
    const campaign = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (campaign) {
      const result = await reviewPortalService.requestRevisionForLegacyOrder({
        orderId,
        legacyProjectId,
        brandEmail: clientEmail,
        revisionNotes,
        locale: lang
      });

      if (!result.ok) {
        if (result.error === "PAYMENT_REQUIRED") {
          await notifyBrandPaymentRequired({ order, locale: lang, nextRevisionRound: version + 1 }).catch(
            () => undefined
          );
        }
        return { ok: false as const, error: reviewPortalErrorMessage(result.error, lang) };
      }

      await notifyCreatorRevisionRequested({ order, notes: revisionNotes, locale: lang });
      revalidateReview(orderId, legacyProjectId);
      return {
        ok: true as const,
        message:
          lang === "zh"
            ? `V${version} 批注已完成，等待 Studio 上传 V${version + 1}`
            : `V${version} review is complete. Waiting for Studio to upload V${version + 1}.`
      };
    }
  }

  const updated = await requestOrderRevision(orderId, revisionNotes);
  if (!updated) {
    return {
      ok: false as const,
      error: lang === "zh" ? "当前版本不可提交修改" : "This version cannot be sent back for changes"
    };
  }

  revalidateReview(orderId, order.project_id);
  return {
    ok: true as const,
    message:
      lang === "zh"
        ? `V${version} 批注已完成，等待 Studio 上传 V${version + 1}`
        : `V${version} review is complete. Waiting for Studio to upload V${version + 1}.`
  };
}

export async function unlockPaidRevisionSlotAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "").trim();
  const payInvoice = String(formData.get("pay_invoice") ?? "") === "1";

  const clientEmail = (await getCurrentClientEmail())?.toLowerCase() ?? null;
  const order = await getOrder(orderId);
  if (!order || !clientEmail || order.client_email.toLowerCase() !== clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  const result = await paidRevisionService.unlockNextPaidRevisionSlot({
    orderId,
    projectId: projectId || order.project_id,
    brandEmail: clientEmail,
    locale: lang,
    payInvoice
  });

  if (!result.ok) {
    if (result.error === "payment-required") {
      return {
        ok: false as const,
        error:
          lang === "zh"
            ? "商家账户余额不足，已拉起加购付款账单"
            : "Brand account balance is insufficient. Add-on invoice opened.",
        paymentRequired: true as const,
        invoiceId: result.invoiceId,
        addOnAmount: result.addOnAmount,
        shortfallAmount: result.shortfallAmount,
        currency: result.currency ?? "USD"
      };
    }
    return { ok: false as const, error: paidRevisionErrorMessage(result.error, lang) };
  }

  revalidateReview(orderId, order.project_id);
  await notifyCreatorPaidRevisionUnlocked({ order, locale: lang }).catch(() => undefined);
  await notifyBrandPaidRevisionUnlocked({ order, locale: lang }).catch(() => undefined);
  return {
    ok: true as const,
    message: result.message,
    paidRevisionSlotsUnlocked: result.paidRevisionSlotsUnlocked,
    unlockedVersion: result.unlockedVersion,
    addOnAmount: result.addOnAmount,
    currency: result.currency,
    paymentSource: result.paymentSource,
    invoiceId: result.invoiceId,
    availableBefore: result.availableBefore,
    shortfallAmount: result.shortfallAmount,
    balanceAfter: result.balanceAfter
  };
}

function mapSettlementStatus(
  state: SettlementStateValue | null
): ReviewSettlementPreview["settlementStatus"] {
  if (state === SettlementState.READY) return "ready";
  if (state === SettlementState.RELEASED) return "released";
  if (state === SettlementState.COMPLETED) return "completed";
  if (state === SettlementState.BLOCKED) return "blocked";
  return "pending";
}

export async function getReviewSettlementPreviewAction(input: {
  lang: Locale;
  orderId: string;
  projectId?: string;
  version: number;
}) {
  const order = await getOrder(input.orderId);
  const clientEmail = (await getCurrentClientEmail())?.toLowerCase() ?? null;
  if (!order || !clientEmail || order.client_email.toLowerCase() !== clientEmail) {
    return { ok: false as const, error: input.lang === "zh" ? "无权限" : "Unauthorized" };
  }

  const legacyProjectId = input.projectId?.trim() || order.project_id;
  const paidRevisionAddOnAmount =
    (order.paid_revision_slots_unlocked ?? 0) >= 1
      ? Math.round(order.amount * PAID_REVISION_SURCHARGE_RATE * 100) / 100
      : undefined;
  const preview: ReviewSettlementPreview = {
    version: input.version,
    orderAmount: order.amount,
    paidRevisionAddOnAmount,
    platformFee: order.platform_fee,
    creatorPayout: order.creator_payout,
    currency: "USD",
    settlementStatus: order.status === "completed" ? "completed" : "pending"
  };

  if (hasDatabaseUrl() && legacyProjectId) {
    const settlementState = await settlementService.getStateForLegacyProject(legacyProjectId);
    if (settlementState) {
      preview.settlementStatus = mapSettlementStatus(settlementState);
    }
  }

  return { ok: true as const, preview };
}

export async function markReviewReadyForCompletionAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");

  const clientEmail = (await getCurrentClientEmail())?.toLowerCase() ?? null;
  const order = await getOrder(orderId);
  if (!order || !clientEmail || order.client_email.toLowerCase() !== clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  if (!["review", "revision"].includes(order.status)) {
    return {
      ok: false as const,
      error: lang === "zh" ? "当前状态不可标记为待最终确认" : "Cannot mark ready for completion in this state"
    };
  }

  const updated = await syncOrderToReadyForCompletion(orderId);
  if (!updated) {
    return { ok: false as const, error: lang === "zh" ? "操作失败" : "Could not update review state" };
  }

  revalidateReview(orderId, order.project_id);
  return {
    ok: true as const,
    orderStatus: updated.status,
    message:
      lang === "zh"
        ? "已进入等待最终确认。请确认交付或返回继续审批。"
        : "Ready for final confirmation. Confirm delivery or return to review."
  };
}

export async function resumeReviewFromReadyAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");

  const clientEmail = (await getCurrentClientEmail())?.toLowerCase() ?? null;
  const order = await getOrder(orderId);
  if (!order || !clientEmail || order.client_email.toLowerCase() !== clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  if (order.status !== "ready_for_completion") {
    return {
      ok: false as const,
      error: lang === "zh" ? "当前不在等待最终确认阶段" : "Not in ready-for-completion phase"
    };
  }

  const updated = await resumeReviewFromReadyForCompletion(orderId);
  if (!updated) {
    return { ok: false as const, error: lang === "zh" ? "操作失败" : "Could not resume review" };
  }

  revalidateReview(orderId, order.project_id);
  return {
    ok: true as const,
    orderStatus: updated.status,
    message: lang === "zh" ? "已返回继续审批" : "Returned to review"
  };
}

export async function confirmReviewApproveAndSettleAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "").trim();
  const version = Number(formData.get("version") ?? 1);

  const clientEmail = (await getCurrentClientEmail())?.toLowerCase() ?? null;
  const order = await getOrder(orderId);
  if (!order || !clientEmail || order.client_email.toLowerCase() !== clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  if (!["review", "revision", "ready_for_completion", "settling", "completed"].includes(order.status)) {
    return {
      ok: false as const,
      error:
        lang === "zh"
          ? "请先点击「无需修改」进入最终确认，再确认交付"
          : "Mark ready for completion before confirming final delivery"
    };
  }

  const legacyProjectId = projectId || order.project_id;
  if (!legacyProjectId) {
    return { ok: false as const, error: lang === "zh" ? "找不到项目" : "Project not found" };
  }

  const completedOrder = await approveOrderDelivery(orderId);
  if (!completedOrder) {
    return { ok: false as const, error: lang === "zh" ? "审片完成失败" : "Could not complete review" };
  }

  if (hasDatabaseUrl()) {
    const campaign = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (campaign) {
      const approveResult = await reviewPortalService.approveForLegacyOrder({
        orderId,
        legacyProjectId,
        brandEmail: clientEmail,
        locale: lang
      });

      if (!approveResult.ok) {
        revalidateReview(orderId, legacyProjectId);
        return {
          ok: true as const,
          message:
            lang === "zh" ? "交付已确认，原片下载已开放" : "Delivery confirmed. Original download is now available."
        };
      }

      const brandUser = await userRepository.ensureBrandPortalUser({
        email: clientEmail,
        fullName: clientEmail.split("@")[0],
        companyName: clientEmail.split("@")[0]
      });

      if (!brandUser || brandUser.id !== campaign.brandId) {
        return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
      }

      await activityService.write(
        campaign.id,
        "settlement.release_requested",
        {
          userId: brandUser.id,
          email: clientEmail,
          role: "brand"
        },
        {
          order_id: orderId,
          version_number: version
        }
      );

      if (campaign.creatorId) {
        await notificationService
          .notify({
            userId: campaign.creatorId,
            campaignId: campaign.id,
            title: lang === "zh" ? "品牌已确认通过，结算处理中" : "Brand approved — settlement processing",
            content:
              lang === "zh"
                ? `「${campaign.title}」Version ${version} 已通过，托管款结算处理中。`
                : `"${campaign.title}" V${version} approved. Escrow settlement is processing.`,
            actionUrl: `${getAppBaseUrl()}/studio/income`,
            email: false
          })
          .catch(() => undefined);
      }

      const settlementResult = await settlementService.releaseForLegacyProject({
        legacyProjectId,
        actor: { id: brandUser.id, role: brandUser.role, email: brandUser.email },
        locale: lang,
        orderId
      });

      if (!settlementResult.ok) {
        revalidateReview(orderId, legacyProjectId);
        return {
          ok: true as const,
          message:
            lang === "zh" ? "交付已确认，原片下载已开放" : "Delivery confirmed. Original download is now available."
        };
      }

      await notifyCreatorDeliveryApproved({ order, locale: lang });
      await notifyCreatorEscrowReleased({ order, locale: lang });
      await notifyBrandOrderCompleted({ order, locale: lang }).catch(() => undefined);
      revalidateReview(orderId, legacyProjectId);
      return {
        ok: true as const,
        message:
          lang === "zh" ? "交付已确认，原片下载已开放" : "Delivery confirmed. Original download is now available."
      };
    }
  }

  revalidateReview(orderId, legacyProjectId);
  return {
    ok: true as const,
    message: lang === "zh" ? "交付已确认，原片下载已开放" : "Delivery confirmed. Original download is now available."
  };
}
