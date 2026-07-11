"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { getOrder } from "@/lib/order-service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { deliveryService } from "@/features/delivery/delivery.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { withLocale, type Locale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

export async function downloadFinalDeliveryAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");

  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    redirect(withLocale("/login?role=brand", lang));
  }

  const order = await getOrder(orderId);
  const legacyProjectId = projectId || order?.project_id;
  if (!order || !legacyProjectId || order.client_email !== clientEmail.toLowerCase()) {
    redirect(withLocale("/brand", lang));
  }

  if (hasDatabaseUrl()) {
    const campaign = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (campaign) {
      const result = await deliveryService.recordBrandDownload({
        legacyProjectId,
        brandEmail: clientEmail.toLowerCase(),
        locale: lang
      });

      if (result.ok) {
        revalidatePath("/brand");
        revalidatePath(brandPortalRoutes.project(legacyProjectId));
        revalidatePath(brandPortalRoutes.projectReview(legacyProjectId));
        redirect(result.delivery.downloadUrl);
      }

      redirect(
        withLocale(`${brandPortalRoutes.projectReview(legacyProjectId)}?error=download`, lang)
      );
    }
  }

  redirect(withLocale(`${brandPortalRoutes.projectReview(legacyProjectId)}?error=download`, lang));
}
