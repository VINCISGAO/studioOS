"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { payOrderAction } from "@/app/order-actions";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { paymentService } from "@/features/payment/payment.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { withLocale, type Locale } from "@/lib/i18n";
import { cancelUnpaidOrder, getOrder, markLegacyOrderPaidForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { getCurrentSession } from "@/lib/session-user";
import { syncBrandOrderPaid } from "@/lib/studioos/brand-checkout-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

function revalidateCheckoutPaths(projectId: string) {
  revalidatePath("/brand");
  revalidatePath(brandPortalRoutes.project(projectId));
  revalidatePath(brandPortalRoutes.projectCheckout(projectId));
}

function brandPaymentSuccessPath(projectId: string) {
  return `${brandPortalRoutes.project(projectId)}?tab=match&matching=1`;
}

export async function payBrandCampaignCheckoutAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const orderId = String(formData.get("order_id") ?? "");

  const session = await getCurrentSession();
  if (!session || session.role !== "client") {
    redirect(withLocale("/login?role=brand", lang));
  }

  if (hasDatabaseUrl() && projectId) {
    const campaign = await campaignRepository.findByLegacyProjectId(projectId);
    if (campaign) {
      const result = await paymentService.payBrandCampaignForLegacyProject({
        legacyProjectId: projectId,
        clientEmail: session.email.toLowerCase(),
        locale: lang
      });

      if (!result.ok) {
        redirect(
          withLocale(
            `${brandPortalRoutes.projectCheckout(projectId)}?error=${result.error}`,
            lang
          )
        );
      }

      if (result.mode === "stripe") {
        redirect(result.checkoutUrl);
      }

      const paidLegacyOrder = await markLegacyOrderPaidForProject(projectId);
      if (paidLegacyOrder) {
        await syncBrandOrderPaid(paidLegacyOrder);
      }

      revalidateCheckoutPaths(projectId);
      redirect(withLocale(brandPaymentSuccessPath(projectId), lang));
    }
  }

  if (!orderId) {
    redirect(withLocale(`${brandPortalRoutes.projectCheckout(projectId)}?error=pay`, lang));
  }

  return payOrderAction(formData);
}

export async function cancelBrandCampaignCheckoutAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const orderId = String(formData.get("order_id") ?? "");
  const reason = String(formData.get("cancel_reason") ?? "").trim();
  const checkoutPath = projectId ? brandPortalRoutes.projectCheckout(projectId) : "/brand";

  const session = await getCurrentSession();
  if (!session || session.role !== "client") {
    redirect(withLocale("/login?role=brand", lang));
  }

  if (!projectId || !orderId) {
    redirect(withLocale(`${checkoutPath}?error=cancel`, lang));
  }

  if (!reason) {
    redirect(withLocale(`${checkoutPath}?error=cancel-reason`, lang));
  }

  const [project, order] = await Promise.all([getProject(projectId), getOrder(orderId)]);
  const sessionEmail = session.email.toLowerCase();
  if (!project || !order || project.client_email !== sessionEmail || order.client_email.toLowerCase() !== sessionEmail) {
    redirect(withLocale("/brand", lang));
  }

  if (order.status === "cancelled") {
    redirect(withLocale(`${checkoutPath}?cancelled=1`, lang));
  }

  const cancelled = await cancelUnpaidOrder(orderId, {
    reason,
    actorRole: "brand",
    projectId
  });

  if (!cancelled) {
    redirect(withLocale(`${checkoutPath}?error=cancel`, lang));
  }

  revalidateCheckoutPaths(projectId);
  redirect(withLocale(`${checkoutPath}?cancelled=1`, lang));
}
