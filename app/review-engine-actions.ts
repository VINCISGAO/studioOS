"use server";

import { revalidatePath } from "next/cache";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { isFrameIoDemoMode } from "@/lib/frameio-config";
import type { Locale } from "@/lib/i18n";
import { approveOrderDelivery, getOrder, requestOrderRevision } from "@/lib/order-service";
import { syncOrderFromReviewSession } from "@/lib/review-engine/order-status-sync";
import {
  createNewReviewVersion,
  ensureReviewSessionForOrder
} from "@/lib/review-engine/review-engine-service";
import {
  appendReviewEvent,
  getReviewSession,
  invalidateReviewEngineStore,
  updateReviewSession
} from "@/lib/review-engine/review-session-store";

function revalidateReviewPaths(orderId: string, projectId?: string | null) {
  revalidatePath(`/creator/orders/${orderId}/review-upload`);
  revalidatePath(`/brand/orders/${orderId}/review`);
  revalidatePath(`/creator/orders/${orderId}`);
  revalidatePath(`/studio/review/${orderId}`);
  if (projectId) {
    revalidatePath(`/brand/projects/${projectId}/review`);
    revalidatePath(`/brand/projects/${projectId}`);
  }
}

export async function ensureReviewSessionAction(orderId: string, locale: Locale) {
  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);

  if (!order || !creatorId || order.creator_id !== creatorId) {
    return { ok: false as const, error: locale === "zh" ? "无权限" : "Unauthorized" };
  }

  try {
    const session = await ensureReviewSessionForOrder({
      orderId,
      creatorId,
      brandId: order.client_email,
      title: order.title
    });
    revalidateReviewPaths(orderId, order.project_id);
    return { ok: true as const, reviewSessionId: session.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return { ok: false as const, error: message };
  }
}

export async function createReviewVersionAction(orderId: string, versionNotes: string, locale: Locale) {
  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);

  if (!order || !creatorId || order.creator_id !== creatorId) {
    return { ok: false as const, error: locale === "zh" ? "无权限" : "Unauthorized" };
  }

  try {
    const session = await createNewReviewVersion({
      orderId,
      creatorId,
      brandId: order.client_email,
      title: order.title,
      versionNotes: versionNotes.trim() || undefined
    });
    revalidateReviewPaths(orderId, order.project_id);
    return { ok: true as const, reviewSessionId: session.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return { ok: false as const, error: message };
  }
}

export async function approveReviewDeliveryAction(reviewSessionId: string, locale: Locale) {
  const clientEmail = await getCurrentClientEmail();
  const session = await getReviewSession(reviewSessionId);
  const order = session ? await getOrder(session.order_id) : null;

  if (!session || !order || !clientEmail || order.client_email.toLowerCase() !== clientEmail.toLowerCase()) {
    return { ok: false as const, error: locale === "zh" ? "无权限" : "Unauthorized" };
  }

  await updateReviewSession(session.id, { status: "approved" });
  await appendReviewEvent({
    review_session_id: session.id,
    frame_event_type: "review.approved",
    frame_payload: { source: "studioos_ui" }
  });

  if (isFrameIoDemoMode()) {
    await approveOrderDelivery(order.id);
  } else {
    await syncOrderFromReviewSession(order.id, "approved", order.project_id);
  }

  invalidateReviewEngineStore();
  revalidateReviewPaths(order.id, order.project_id);
  return { ok: true as const };
}

export async function requestReviewChangesAction(reviewSessionId: string, locale: Locale) {
  const clientEmail = await getCurrentClientEmail();
  const session = await getReviewSession(reviewSessionId);
  const order = session ? await getOrder(session.order_id) : null;

  if (!session || !order || !clientEmail || order.client_email.toLowerCase() !== clientEmail.toLowerCase()) {
    return { ok: false as const, error: locale === "zh" ? "无权限" : "Unauthorized" };
  }

  await updateReviewSession(session.id, { status: "changes_requested" });
  await appendReviewEvent({
    review_session_id: session.id,
    frame_event_type: "review.changes_requested",
    frame_payload: { source: "studioos_ui" }
  });

  if (isFrameIoDemoMode()) {
    await requestOrderRevision(order.id, "Changes requested from StudioOS review room");
  } else {
    await syncOrderFromReviewSession(order.id, "changes_requested", order.project_id);
  }

  invalidateReviewEngineStore();
  revalidateReviewPaths(order.id, order.project_id);
  return { ok: true as const };
}
