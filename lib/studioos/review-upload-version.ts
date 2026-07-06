import type { OrderStatus, StoredDeliverable } from "@/lib/order-types";
import {
  normalizeDeliverablePlaybackUrl,
  reviewVideoUrlForVersion
} from "@/lib/studioos/review-video-url";
import {
  blocksCreatorNewVersionUpload,
  isAwaitingCreatorFirstDraft,
  isDemoPlaceholderDeliverable,
  isUnsubmittedDeliverable,
  latestSubmittedDeliverableVersion,
  latestUnsubmittedDeliverableVersion,
  latestUploadedDeliverableVersion,
  resolveCreatorUploadContext,
  resolveMaxOpenReviewWorkflowSlot,
  resolveReviewUploadVersion
} from "@/lib/studioos/review-upload-version-shared";

export {
  reviewVideoUrlForVersion,
  isDemoPlaceholderDeliverable,
  isUnsubmittedDeliverable,
  latestSubmittedDeliverableVersion,
  latestUploadedDeliverableVersion,
  latestUnsubmittedDeliverableVersion,
  blocksCreatorNewVersionUpload,
  isAwaitingCreatorFirstDraft,
  resolveReviewUploadVersion,
  resolveMaxOpenReviewWorkflowSlot,
  resolveCreatorUploadContext
};

async function loadVideoUploadServer() {
  return import("@/lib/studioos/video-upload");
}

async function createReviewVideoExistenceChecker(orderId: string) {
  const { hasReviewVideoFileOnDisk } = await loadVideoUploadServer();
  const cache = new Map<number, Promise<boolean>>();

  return (version: number) => {
    const cached = cache.get(version);
    if (cached) return cached;
    const next = hasReviewVideoFileOnDisk(orderId, version);
    cache.set(version, next);
    return next;
  };
}

export async function filterPlayableDeliverables(
  orderId: string,
  deliverables: StoredDeliverable[]
): Promise<StoredDeliverable[]> {
  const { hasPlayableReviewVideo } = await loadVideoUploadServer();
  const checks = await Promise.all(
    deliverables.map(async (item) => ({
      item,
      playable: await hasPlayableReviewVideo(orderId, item.version)
    }))
  );
  return checks.filter((entry) => entry.playable).map((entry) => entry.item);
}

/** Drop DB rows for vN when the real file lives on a lower slot (legacy upload mismatch). */
export async function prunePhantomReviewDeliverables(
  orderId: string,
  deliverables: StoredDeliverable[]
): Promise<StoredDeliverable[]> {
  const hasExactReviewVideo = await createReviewVideoExistenceChecker(orderId);
  const sorted = [...deliverables].sort((a, b) => a.version - b.version);
  const kept: StoredDeliverable[] = [];

  for (const item of sorted) {
    if (isUnsubmittedDeliverable(item)) {
      kept.push(item);
      continue;
    }

    const hasExactFile = await hasExactReviewVideo(item.version);
    if (hasExactFile) {
      kept.push(item);
      continue;
    }

    const lowerHasExact = await Promise.all(
      kept.map(async (existing) =>
        existing.version < item.version ? hasExactReviewVideo(existing.version) : false
      )
    );
    if (lowerHasExact.some(Boolean)) {
      continue;
    }

    kept.push(item);
  }

  return kept.sort((a, b) => b.version - a.version);
}

export async function resolveActiveReviewPlaybackVersion(
  orderId: string,
  deliverables: StoredDeliverable[]
): Promise<number> {
  const { findReviewVideoFile, readReviewVideoSlotVersion } = await loadVideoUploadServer();
  const pruned = await prunePhantomReviewDeliverables(orderId, deliverables);
  const submittedVersion = latestSubmittedDeliverableVersion(pruned);
  const revertedUploadVersion = latestUnsubmittedDeliverableVersion(pruned);
  if (revertedUploadVersion > submittedVersion) {
    return revertedUploadVersion;
  }

  const submitted = pruned
    .filter((item) => !isUnsubmittedDeliverable(item))
    .sort((a, b) => b.version - a.version);

  for (const item of submitted) {
    const file = await findReviewVideoFile(orderId, item.version);
    if (!file) continue;
    return readReviewVideoSlotVersion(file.path) ?? item.version;
  }

  for (const item of pruned.sort((a, b) => b.version - a.version)) {
    const file = await findReviewVideoFile(orderId, item.version);
    if (file) {
      return readReviewVideoSlotVersion(file.path) ?? item.version;
    }
  }

  return submittedVersion || 1;
}

export async function normalizeReviewDeliverableCatalog(
  orderId: string,
  deliverables: StoredDeliverable[]
): Promise<StoredDeliverable[]> {
  const { findReviewVideoFile, readReviewVideoSlotVersion } = await loadVideoUploadServer();
  const pruned = await prunePhantomReviewDeliverables(orderId, deliverables);

  return Promise.all(
    pruned.map(async (item) => {
      if (isUnsubmittedDeliverable(item)) {
        return item;
      }

      const file = await findReviewVideoFile(orderId, item.version);
      const slotVersion = file ? readReviewVideoSlotVersion(file.path) ?? item.version : item.version;
      return normalizeDeliverablePlaybackUrl(
        {
          ...item,
          file_url: reviewVideoUrlForVersion(orderId, slotVersion)
        },
        orderId
      );
    })
  );
}

export async function resolveReviewUploadVersionForOrder(
  orderId: string,
  deliverables: StoredDeliverable[],
  orderStatus?: OrderStatus,
  paidSlotsUnlocked = 0
): Promise<{ version: number; replace: boolean }> {
  const hasExactReviewVideo = await createReviewVideoExistenceChecker(orderId);
  const catalog = await prunePhantomReviewDeliverables(orderId, deliverables);
  const latestSubmitted = latestSubmittedDeliverableVersion(catalog);
  const revertedUploadVersion = latestUnsubmittedDeliverableVersion(catalog);
  if (revertedUploadVersion > latestSubmitted) {
    return { version: revertedUploadVersion, replace: true };
  }

  const revertedFirstDraft = catalog.find(
    (item) => item.version === 1 && isUnsubmittedDeliverable(item)
  );
  if (latestSubmitted === 0 && revertedFirstDraft) {
    return { version: 1, replace: true };
  }

  const replaceCandidates = [...catalog]
    .filter(
      (item) =>
        !isUnsubmittedDeliverable(item) &&
        item.version <= Math.max(latestSubmitted, 1)
    )
    .sort((a, b) => a.version - b.version);

  for (const item of replaceCandidates) {
    if (!(await hasExactReviewVideo(item.version))) {
      return { version: item.version, replace: true };
    }
  }

  return resolveReviewUploadVersion(
    await filterPlayableDeliverables(orderId, catalog),
    orderStatus,
    paidSlotsUnlocked
  );
}

export async function resolveCreatorReplaceUploadSlot(
  orderId: string,
  deliverables: StoredDeliverable[]
): Promise<number | null> {
  const hasExactReviewVideo = await createReviewVideoExistenceChecker(orderId);
  const catalog = await prunePhantomReviewDeliverables(orderId, deliverables);
  const latestSubmitted = latestSubmittedDeliverableVersion(catalog);
  const revertedUploadVersion = latestUnsubmittedDeliverableVersion(catalog);
  if (revertedUploadVersion > latestSubmitted) {
    return revertedUploadVersion;
  }

  if (latestSubmitted <= 0) return null;

  const sorted = [...catalog]
    .filter((item) => !isUnsubmittedDeliverable(item) && item.version <= latestSubmitted)
    .sort((a, b) => b.version - a.version);

  for (const item of sorted) {
    if (!(await hasExactReviewVideo(item.version))) {
      return item.version;
    }
  }
  return null;
}
