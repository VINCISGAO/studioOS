"use server";

import { revalidatePath } from "next/cache";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getCurrentCreatorId } from "@/lib/creator-session";
import type { Locale } from "@/lib/i18n";
import { addDeliverable, getDeliverables, getOrder } from "@/lib/order-service";
import { getClientPreferredLocale } from "@/lib/studioos/client-locale";
import { addReviewComment, resolveReviewComment } from "@/lib/studioos/review-store";
import { translateForClient } from "@/lib/studioos/translate";
import { saveReviewVideoUpload } from "@/lib/studioos/video-upload";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

function revalidateReview(orderId: string, projectId?: string | null) {
  revalidatePath(`/brand/projects/${orderId}/review`);
  revalidatePath(`/studio/review/${orderId}`);
  revalidatePath(`/studio/projects/${orderId}`);
  revalidatePath(`/creator/orders/${orderId}`);
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

  if (!orderId || !body) {
    return { ok: false as const, error: lang === "zh" ? "请输入批注" : "Enter a comment" };
  }

  const clientEmail = await getCurrentClientEmail();
  const order = await getOrder(orderId);
  if (!order || !clientEmail || order.client_email !== clientEmail.toLowerCase()) {
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  const comment = await addReviewComment({
    order_id: orderId,
    version,
    timestamp_sec: timestampSec,
    body,
    issue_type: issueType,
    author: "brand"
  });

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

  const comment = await resolveReviewComment(commentId, orderId);
  if (!comment) {
    return { ok: false as const, error: lang === "zh" ? "批注不存在" : "Comment not found" };
  }

  revalidateReview(orderId, order.project_id);
  return { ok: true as const, comment };
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
  const nextVersion = deliverables.length + 1;

  let resolvedUrl = fileUrl;
  if (file instanceof File && file.size > 0) {
    const saved = await saveReviewVideoUpload(orderId, nextVersion, file);
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
