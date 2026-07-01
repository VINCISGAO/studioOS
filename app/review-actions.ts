"use server";

import { revalidatePath } from "next/cache";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getCurrentCreatorId } from "@/lib/creator-session";
import type { Locale } from "@/lib/i18n";
import { addDeliverable, getDeliverables, getOrder } from "@/lib/order-service";
import { getClientPreferredLocale } from "@/lib/studioos/client-locale";
import { addReviewComment, deleteReviewComment, resolveReviewComment } from "@/lib/studioos/review-store";
import { translateForClient } from "@/lib/studioos/translate";
import { saveReviewVideoUpload } from "@/lib/studioos/video-upload";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { versionService } from "@/features/delivery/version.service";
import { MAX_CAMPAIGN_VERSIONS } from "@/features/delivery/version.repository";
import { reviewPortalService } from "@/features/review/review-portal.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
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

export async function addReviewCommentAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const version = Number(formData.get("version") ?? 1);
  const timestampSec = Number(formData.get("timestamp_sec") ?? 0);
  const body = String(formData.get("body") ?? "").trim();
  const issueType = String(formData.get("issue_type") ?? "").trim() || null;
  const posXRaw = formData.get("pos_x");
  const posYRaw = formData.get("pos_y");
  const posX = posXRaw != null && posXRaw !== "" ? Number(posXRaw) : null;
  const posY = posYRaw != null && posYRaw !== "" ? Number(posYRaw) : null;

  if (!orderId || !body) {
    return { ok: false as const, error: lang === "zh" ? "请输入批注" : "Enter a comment" };
  }

  const clientEmail = await getCurrentClientEmail();
  const order = await getOrder(orderId);
  if (!order || !clientEmail || order.client_email !== clientEmail.toLowerCase()) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  if (hasDatabaseUrl() && order.project_id) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    if (campaign) {
      const result = await reviewPortalService.addCommentForLegacyOrder({
        orderId,
        legacyProjectId: order.project_id,
        brandEmail: clientEmail.toLowerCase(),
        version,
        timestampSec: timestampSec,
        body,
        posX: posX,
        posY: posY,
        issueType,
        locale: lang
      });

      if (!result.ok) {
        return {
          ok: false as const,
          error:
            result.error === "invalid-status"
              ? lang === "zh"
                ? "当前版本不可添加批注"
                : "Comments are not allowed for this version"
              : lang === "zh"
                ? "无法添加批注"
                : "Could not add comment"
        };
      }

      revalidateReview(orderId, order.project_id);
      return { ok: true as const, comment: result.comment };
    }
  }

  const comment = await addReviewComment({
    order_id: orderId,
    version,
    timestamp_sec: timestampSec,
    body,
    pos_x: posX,
    pos_y: posY,
    issue_type: issueType,
    author: "brand",
    created_by: clientEmail.toLowerCase()
  });

  const { notifyCreatorReviewComment } = await import("@/lib/studioos/commercial-interaction-notify");
  await notifyCreatorReviewComment({ order, comment, locale: lang });

  revalidateReview(orderId, order.project_id);
  return { ok: true as const, comment };
}

export async function resolveReviewCommentAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const commentId = String(formData.get("comment_id") ?? "");

  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);
  if (!order || !creatorId || order.creator_id !== creatorId) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  if (hasDatabaseUrl() && order.project_id) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    if (campaign) {
      const result = await reviewPortalService.resolveCommentForLegacyOrder({
        orderId,
        legacyProjectId: order.project_id,
        legacyCreatorId: creatorId,
        commentId
      });

      if (!result.ok) {
        return {
          ok: false as const,
          error: lang === "zh" ? "批注不存在" : "Comment not found"
        };
      }

      revalidateReview(orderId, order.project_id);
      return { ok: true as const, comment: result.comment };
    }
  }

  const comment = await resolveReviewComment(commentId, orderId);
  if (!comment) {
    return { ok: false as const, error: lang === "zh" ? "批注不存在" : "Comment not found" };
  }

  const { notifyBrandCommentResolved } = await import("@/lib/studioos/commercial-interaction-notify");
  await notifyBrandCommentResolved({ order, comment, locale: lang });

  revalidateReview(orderId, order.project_id);
  return { ok: true as const, comment };
}

export async function deleteReviewCommentAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const commentId = String(formData.get("comment_id") ?? "");

  const clientEmail = await getCurrentClientEmail();
  const order = await getOrder(orderId);
  if (!order || !clientEmail || order.client_email !== clientEmail.toLowerCase()) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  if (hasDatabaseUrl() && order.project_id) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    if (campaign) {
      const result = await reviewPortalService.deleteCommentForLegacyOrder({
        orderId,
        legacyProjectId: order.project_id,
        brandEmail: clientEmail.toLowerCase(),
        commentId
      });

      if (!result.ok) {
        return { ok: false as const, error: lang === "zh" ? "批注不存在" : "Comment not found" };
      }

      revalidateReview(orderId, order.project_id);
      return { ok: true as const, commentId: result.commentId };
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
    if (code === "max-versions") return "最多只能上传 3 个审片版本";
    if (code === "invalid-status") return "当前订单状态不可上传新版本";
    if (code === "creator-not-assigned") return "品牌尚未选定 Studio，无法上传";
    return "无权限";
  }
  if (code === "max-versions") return "You can upload at most 3 review versions";
  if (code === "invalid-status") return "Cannot upload a new version in the current order status";
  if (code === "creator-not-assigned") return "Brand has not selected a studio yet";
  return "Unauthorized";
}

export async function uploadVideoVersionAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const fileUrl = String(formData.get("file_url") ?? "").trim();
  const file = formData.get("video_file");

  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);
  if (!order || !creatorId || order.creator_id !== creatorId) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  const deliverables = await getDeliverables(orderId);
  if (deliverables.length >= MAX_CAMPAIGN_VERSIONS) {
    return { ok: false as const, error: uploadErrorMessage("max-versions", lang) };
  }
  const nextVersion = deliverables.length + 1;

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
        locale: lang
      });

      if (!prismaResult.ok) {
        return { ok: false as const, error: uploadErrorMessage(prismaResult.error, lang) };
      }

      revalidateReview(orderId, order.project_id);
      return {
        ok: true as const,
        deliverable: prismaResult.deliverable,
        translated: prismaResult.translated
      };
    }
  }

  const deliverable = await addDeliverable(orderId, {
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
