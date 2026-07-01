import "server-only";

import { getCreatorByIdSync } from "@/lib/creator-service";
import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { createBrandNotification } from "@/lib/studioos/brand-notification-service";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import { getProject } from "@/lib/project-service";

function resolveCreatorName(creatorId: string): string {
  return getCreatorByIdSync(creatorId)?.name ?? creators.find((item) => item.id === creatorId)?.name ?? creatorId;
}

function deliverableCopy(locale: Locale, creatorName: string, projectTitle: string, version: number) {
  if (locale === "zh") {
    if (version === 1) {
      return {
        title: `${creatorName} 已提交审片版`,
        body: `「${projectTitle}」Version 1 已上传，请前往审片页审核。`
      };
    }
    return {
      title: `${creatorName} 已提交新版本`,
      body: `「${projectTitle}」Version ${version} 已提交，请审阅修改版。`
    };
  }

  if (version === 1) {
    return {
      title: `${creatorName} submitted Version 1 for review`,
      body: `"${projectTitle}" — Version 1 is ready. Open the review workspace to approve or request changes.`
    };
  }

  return {
    title: `${creatorName} submitted a new version`,
    body: `"${projectTitle}" — Version ${version} is ready for your review.`
  };
}

export async function notifyBrandDeliverableUploaded(input: {
  order: StoredOrder;
  deliverable: StoredDeliverable;
  locale?: Locale;
}) {
  const brandEmail = input.order.client_email?.trim().toLowerCase();
  const projectId = input.order.project_id;
  if (!brandEmail || !projectId) {
    return null;
  }

  const project = await getProject(projectId);
  const locale = input.locale ?? input.order.client_locale ?? "en";
  const creatorName = resolveCreatorName(input.order.creator_id);
  const projectTitle =
    project?.title ||
    project?.product_name ||
    input.order.title ||
    project?.company_name ||
    input.order.company_name ||
    "Project";
  const copy = deliverableCopy(locale, creatorName, projectTitle, input.deliverable.version);

  return createBrandNotification({
    brand_email: brandEmail,
    type: "deliverable_uploaded",
    title: copy.title,
    body: copy.body,
    project_id: projectId,
    creator_id: input.order.creator_id,
    creator_name: creatorName,
    order_id: input.order.id,
    deliverable_version: input.deliverable.version
  });
}
