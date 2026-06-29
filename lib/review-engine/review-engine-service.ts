import { createFrameProject, uploadFrameAsset } from "@/lib/frameio";
import { isFrameIoDemoMode } from "@/lib/frameio-config";
import { addDeliverable, getOrder } from "@/lib/order-service";
import { syncOrderFromReviewSession } from "@/lib/review-engine/order-status-sync";
import {
  appendReviewEvent,
  createReviewSessionRecord,
  getLatestReviewSession,
  getReviewSession,
  getReviewSessionByAssetId,
  listReviewEvents,
  listReviewSessionsForOrder,
  updateReviewSession
} from "@/lib/review-engine/review-session-store";
import type { ReviewSession, ReviewSessionStatus } from "@/lib/review-engine/types";
import { reviewVideoPublicUrl, saveReviewVideoUpload } from "@/lib/studioos/video-upload";

export type CreateReviewSessionInput = {
  campaignId: string;
  orderId: string;
  creatorId: string;
  brandId: string;
  title: string;
  versionNotes?: string;
};

export async function createReviewSession(input: CreateReviewSessionInput): Promise<ReviewSession> {
  const order = await getOrder(input.orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const existing = await listReviewSessionsForOrder(input.orderId);
  const versionNumber = existing.length + 1;

  const frame = await createFrameProject({
    title: `${input.title} — V${versionNumber}`
  });

  return createReviewSessionRecord({
    campaign_id: input.campaignId,
    order_id: input.orderId,
    creator_id: input.creatorId,
    brand_id: input.brandId,
    title: input.title,
    version_notes: input.versionNotes,
    frame_project_id: frame.projectId,
    frame_folder_id: frame.folderId,
    frame_asset_id: null,
    frame_review_link: null,
    version_number: versionNumber,
    status: "pending_upload"
  });
}

export async function ensureReviewSessionForOrder(input: {
  orderId: string;
  creatorId: string;
  brandId: string;
  title: string;
}): Promise<ReviewSession> {
  const latest = await getLatestReviewSession(input.orderId);
  if (latest && ["pending_upload", "uploading", "transcoding", "ready_for_review"].includes(latest.status)) {
    return latest;
  }

  const order = await getOrder(input.orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  return createReviewSession({
    campaignId: order.project_id ?? order.id,
    orderId: input.orderId,
    creatorId: input.creatorId,
    brandId: input.brandId,
    title: input.title,
    versionNotes: latest ? `Version ${latest.version_number + 1}` : undefined
  });
}

export async function uploadReviewVideoFile(input: {
  reviewSessionId: string;
  file: File;
  versionNotes?: string;
}): Promise<ReviewSession> {
  const session = await getReviewSession(input.reviewSessionId);
  if (!session) {
    throw new Error("Review session not found");
  }

  if (!session.frame_folder_id) {
    throw new Error("Review session missing Frame.io folder");
  }

  await updateReviewSession(session.id, {
    status: "uploading",
    version_notes: input.versionNotes ?? session.version_notes
  });

  const order = await getOrder(session.order_id);
  if (!order) {
    throw new Error("Order not found");
  }

  const version = session.version_number;
  const saved = await saveReviewVideoUpload(session.order_id, version, input.file);
  if (!saved.ok) {
    await updateReviewSession(session.id, { status: "failed" });
    throw new Error(saved.error);
  }

  const buffer = Buffer.from(await input.file.arrayBuffer());

  const frame = await uploadFrameAsset({
    folderId: session.frame_folder_id,
    fileName: input.file.name,
    fileSize: input.file.size,
    mimeType: input.file.type || "video/mp4",
    fileBuffer: buffer
  });

  await addDeliverable(session.order_id, {
    file_url: reviewVideoPublicUrl(session.order_id, version),
    notes: input.versionNotes ?? `Review version ${version}`,
    notes_for_client: input.versionNotes ?? `Review version ${version}`
  });

  const status: ReviewSessionStatus = isFrameIoDemoMode() ? "ready_for_review" : "transcoding";

  const updated = await updateReviewSession(session.id, {
    frame_asset_id: frame.assetId,
    frame_review_link: frame.reviewLink,
    status
  });

  if (isFrameIoDemoMode() && updated) {
    await syncOrderFromReviewSession(updated.order_id, "ready_for_review", order.project_id);
  }

  return updated!;
}

export async function getReviewSessionPayload(reviewSessionId: string) {
  const session = await getReviewSession(reviewSessionId);
  if (!session) {
    return null;
  }

  const events = await listReviewEvents(reviewSessionId);

  return {
    id: session.id,
    orderId: session.order_id,
    status: session.status,
    version: session.version_number,
    reviewLink: session.frame_review_link,
    title: session.title,
    versionNotes: session.version_notes,
    events: events.map((event) => ({
      id: event.id,
      type: event.frame_event_type,
      createdAt: event.created_at
    })),
    demoMode: isFrameIoDemoMode()
  };
}

export async function handleFrameIoWebhookEvent(payload: Record<string, unknown>) {
  const eventType = String(payload.type ?? payload.event_type ?? "unknown");
  const resource = (payload.resource ?? payload.data ?? payload) as Record<string, unknown>;
  const assetId = String(resource.asset_id ?? resource.id ?? "");

  let session = assetId ? await getReviewSessionByAssetId(assetId) : null;

  if (!session && payload.review_session_id) {
    session = await getReviewSession(String(payload.review_session_id));
  }

  if (!session) {
    return { ok: false as const, reason: "session_not_found" };
  }

  await appendReviewEvent({
    review_session_id: session.id,
    frame_event_type: eventType,
    frame_payload: payload
  });

  let nextStatus: ReviewSessionStatus | null = null;

  switch (eventType) {
    case "asset.created":
      nextStatus = "transcoding";
      break;
    case "asset.ready":
      nextStatus = "ready_for_review";
      break;
    case "comment.created":
      break;
    case "review.approved":
      nextStatus = "approved";
      break;
    case "review.changes_requested":
      nextStatus = "changes_requested";
      break;
    case "version.created":
      break;
    default:
      break;
  }

  if (nextStatus) {
    const order = await getOrder(session.order_id);
    await updateReviewSession(session.id, { status: nextStatus });
    await syncOrderFromReviewSession(session.order_id, nextStatus, order?.project_id);
    session = (await getReviewSession(session.id))!;
  }

  return { ok: true as const, session, eventType };
}

export async function createNewReviewVersion(input: {
  orderId: string;
  creatorId: string;
  brandId: string;
  title: string;
  versionNotes?: string;
}): Promise<ReviewSession> {
  const latest = await getLatestReviewSession(input.orderId);
  if (latest && !["approved", "changes_requested", "failed"].includes(latest.status)) {
    throw new Error("Current review version is still active");
  }

  return createReviewSession({
    campaignId: input.orderId,
    orderId: input.orderId,
    creatorId: input.creatorId,
    brandId: input.brandId,
    title: input.title,
    versionNotes: input.versionNotes
  });
}

export { listReviewSessionsForOrder, getLatestReviewSession, listReviewEvents, getReviewSession };
