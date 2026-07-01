"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getOrder } from "@/lib/order-service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { deliveryService } from "@/features/delivery/delivery.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { withLocale, type Locale } from "@/lib/i18n";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

function revalidateDeliveryPaths(projectId: string, orderId: string) {
  revalidatePath("/studio");
  revalidatePath("/studio/projects");
  revalidatePath(`/studio/review/${orderId}`);
  revalidatePath("/brand");
  revalidatePath(`/brand/projects/${projectId}`);
  revalidatePath(`/brand/projects/${projectId}/review`);
}

export async function markAsFinalDeliveryAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const versionNumber = Number(formData.get("version_number") ?? 0);

  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);
  if (!order || !creatorId || order.creator_id !== creatorId) {
    redirect(withLocale(`/studio/review/${orderId}?error=final`, lang));
  }

  const legacyProjectId = projectId || order.project_id;
  if (!legacyProjectId || !Number.isFinite(versionNumber) || versionNumber < 1) {
    redirect(withLocale(`/studio/review/${orderId}?error=final`, lang));
  }

  if (hasDatabaseUrl()) {
    const campaign = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (campaign) {
      const result = await deliveryService.markAsFinalForLegacyOrder({
        legacyProjectId,
        orderId,
        legacyCreatorId: creatorId,
        versionNumber,
        locale: lang
      });

      if (!result.ok) {
        redirect(withLocale(`/studio/review/${orderId}?error=final`, lang));
      }

      revalidateDeliveryPaths(legacyProjectId, orderId);
      redirect(withLocale(`/studio/review/${orderId}?final=1`, lang));
    }
  }

  redirect(withLocale(`/studio/review/${orderId}?error=final`, lang));
}
