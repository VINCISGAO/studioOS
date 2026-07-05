import type { OrderStatus, StoredDeliverable } from "@/lib/order-types";
import {
  isReviewVersionPaymentUnlocked,
  maxUploadableReviewVersion
} from "@/features/review/review-round-policy";
import {
  isBundledDemoReviewVideoUrl,
  isLegacyExternalDemoVideoUrl,
  shouldUseDemoPlaybackUrl
} from "@/lib/studioos/review-video-url";

export function isDemoPlaceholderDeliverable(deliverable: StoredDeliverable) {
  return shouldUseDemoPlaybackUrl(deliverable.file_url, deliverable.order_id);
}

export function isUnsubmittedDeliverable(deliverable: StoredDeliverable) {
  const url = deliverable.file_url.trim();
  if (!url) return true;
  if (isDemoPlaceholderDeliverable(deliverable)) return true;
  if (isBundledDemoReviewVideoUrl(url) || isLegacyExternalDemoVideoUrl(url)) return true;
  return false;
}

export function latestSubmittedDeliverableVersion(deliverables: StoredDeliverable[]) {
  return deliverables
    .filter((item) => !isUnsubmittedDeliverable(item))
    .reduce((max, item) => Math.max(max, item.version), 0);
}

export function latestUploadedDeliverableVersion(
  deliverables: ReadonlyArray<Pick<StoredDeliverable, "version">>
) {
  return deliverables.reduce((max, item) => Math.max(max, item.version), 0);
}

export function latestUnsubmittedDeliverableVersion(deliverables: StoredDeliverable[]) {
  return deliverables
    .filter((item) => isUnsubmittedDeliverable(item))
    .reduce((max, item) => Math.max(max, item.version), 0);
}

export function blocksCreatorNewVersionUpload(input: {
  orderStatus: OrderStatus;
  replace: boolean;
  latestSubmitted: number;
}): boolean {
  if (input.replace) return false;
  if (input.orderStatus === "revision") return false;
  return input.latestSubmitted > 0;
}

export function isAwaitingCreatorFirstDraft(input: {
  deliverables: StoredDeliverable[];
  orderStatus: OrderStatus;
}) {
  if (
    input.orderStatus !== "paid" &&
    input.orderStatus !== "in_production" &&
    input.orderStatus !== "review" &&
    input.orderStatus !== "revision"
  ) {
    return false;
  }

  if (latestSubmittedDeliverableVersion(input.deliverables) > 0) {
    return false;
  }

  const latestUploaded = latestUploadedDeliverableVersion(input.deliverables);
  if (latestUploaded === 0) {
    return true;
  }

  const firstDraft = input.deliverables.find((item) => item.version === 1);
  return Boolean(latestUploaded === 1 && firstDraft && isUnsubmittedDeliverable(firstDraft));
}

/** First real upload replaces demo placeholder v1 instead of creating v2. */
export function resolveReviewUploadVersion(
  deliverables: StoredDeliverable[],
  orderStatus: OrderStatus = "in_production",
  paidSlotsUnlocked = 0
): {
  version: number;
  replace: boolean;
} {
  const sorted = [...deliverables].sort((a, b) => b.version - a.version);
  const latest = sorted[0];

  if (!latest) {
    return { version: 1, replace: false };
  }

  if (latest.version === 1 && isUnsubmittedDeliverable(latest)) {
    return { version: 1, replace: true };
  }

  const latestSubmitted = latestSubmittedDeliverableVersion(deliverables);

  if (orderStatus !== "revision") {
    if (latestSubmitted > 0) {
      return { version: latestSubmitted, replace: false };
    }
    return { version: 1, replace: false };
  }

  if (latestSubmitted <= 0) {
    return { version: 1, replace: false };
  }

  const latestDeliverable = deliverables.find((item) => item.version === latestSubmitted);
  if (latestDeliverable && isUnsubmittedDeliverable(latestDeliverable)) {
    return { version: latestSubmitted, replace: true };
  }

  const nextVersion = Math.min(latestSubmitted + 1, maxUploadableReviewVersion(paidSlotsUnlocked));
  return { version: nextVersion, replace: false };
}

/** Highest workflow slot that may be active. Later rounds stay locked until the brand requests revision or approves. */
export function resolveMaxOpenReviewWorkflowSlot(input: {
  deliverables: StoredDeliverable[];
  orderStatus: OrderStatus;
  latestSubmittedVersion: number;
  uploadContext: {
    isReplace: boolean;
    canUpload: boolean;
    uploadVersion: number;
  };
}): number {
  const { orderStatus, latestSubmittedVersion, uploadContext } = input;

  if (uploadContext.isReplace) {
    return uploadContext.uploadVersion;
  }

  if (orderStatus === "revision") {
    if (uploadContext.canUpload) {
      return uploadContext.uploadVersion;
    }
    return Math.max(latestSubmittedVersion + 1, 1);
  }

  if (isAwaitingCreatorFirstDraft({ deliverables: input.deliverables, orderStatus })) {
    return 1;
  }

  if (orderStatus === "review" || orderStatus === "ready_for_completion") {
    return Math.max(latestSubmittedVersion, 1);
  }

  return Math.max(latestSubmittedVersion, 1);
}

export function resolveCreatorUploadContext(input: {
  deliverables: StoredDeliverable[];
  orderStatus: OrderStatus;
  activeVersion: number;
  maxVersions: number;
  role: "brand" | "creator";
  paidSlotsUnlocked?: number;
  /** Latest deliverable slot is missing its on-disk review file. */
  replaceUploadVersion?: number | null;
  /** HTML video element failed to load the current playback URL. */
  videoPlaybackFailed?: boolean;
}) {
  const paidSlotsUnlocked = input.paidSlotsUnlocked ?? 0;
  const maxAllowedVersion = Math.min(input.maxVersions, maxUploadableReviewVersion(paidSlotsUnlocked));
  if (input.role !== "creator") {
    return { canUpload: false, uploadVersion: 1, isFirstDraft: true, isReplace: false };
  }

  const latestUploaded = latestUploadedDeliverableVersion(input.deliverables);
  const latestSubmitted = latestSubmittedDeliverableVersion(input.deliverables);
  const revertedUploadVersion = latestUnsubmittedDeliverableVersion(input.deliverables);
  if (revertedUploadVersion > latestSubmitted) {
    return {
      canUpload: input.activeVersion === revertedUploadVersion,
      uploadVersion: revertedUploadVersion,
      isFirstDraft: revertedUploadVersion === 1,
      isReplace: true
    };
  }

  const revertedFirstDraft = input.deliverables.find(
    (item) => item.version === 1 && isUnsubmittedDeliverable(item)
  );
  if (latestSubmitted === 0 && revertedFirstDraft) {
    return {
      canUpload: input.activeVersion <= 1,
      uploadVersion: 1,
      isFirstDraft: true,
      isReplace: true
    };
  }

  const replaceVersion = input.replaceUploadVersion ?? null;
  if (
    replaceVersion != null &&
    replaceVersion > 0 &&
    input.activeVersion === replaceVersion
  ) {
    return {
      canUpload: true,
      uploadVersion: replaceVersion,
      isFirstDraft: replaceVersion === 1,
      isReplace: true
    };
  }

  if (
    input.videoPlaybackFailed &&
    latestSubmitted > 0 &&
    input.activeVersion === latestSubmitted
  ) {
    return {
      canUpload: true,
      uploadVersion: latestSubmitted,
      isFirstDraft: latestSubmitted === 1,
      isReplace: true
    };
  }

  const latestDeliverable = input.deliverables.find((item) => item.version === latestSubmitted);
  if (
    latestSubmitted > 0 &&
    latestDeliverable &&
    isUnsubmittedDeliverable(latestDeliverable) &&
    input.activeVersion === latestSubmitted
  ) {
    return {
      canUpload: true,
      uploadVersion: latestSubmitted,
      isFirstDraft: latestSubmitted === 1,
      isReplace: true
    };
  }

  if (input.orderStatus === "revision" && latestSubmitted > 0) {
    const nextVersion = Math.min(latestSubmitted + 1, maxAllowedVersion);
    const nextRoundUnlocked = isReviewVersionPaymentUnlocked(nextVersion, paidSlotsUnlocked);
    return {
      canUpload:
        nextRoundUnlocked &&
        input.activeVersion === latestSubmitted &&
        input.deliverables.length < input.maxVersions,
      uploadVersion: nextVersion,
      isFirstDraft: false,
      isReplace: false
    };
  }

  const awaitingFirstDraft = isAwaitingCreatorFirstDraft({
    deliverables: input.deliverables,
    orderStatus: input.orderStatus
  });

  if (awaitingFirstDraft) {
    return {
      canUpload: input.activeVersion <= 1 && input.deliverables.length < input.maxVersions,
      uploadVersion: 1,
      isFirstDraft: true,
      isReplace: false
    };
  }

  return {
    canUpload: false,
    uploadVersion: latestSubmitted || latestUploaded || 1,
    isFirstDraft: latestSubmitted === 0,
    isReplace: false
  };
}
