"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { payOrderAction } from "@/app/order-actions";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-auth";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { paymentService } from "@/features/payment/payment.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { withLocale, type Locale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

function revalidateCheckoutPaths(projectId: string) {
  revalidatePath("/brand");
  revalidatePath(brandPortalRoutes.project(projectId));
  revalidatePath(brandPortalRoutes.projectCheckout(projectId));
}

export async function payBrandCampaignCheckoutAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const orderId = String(formData.get("order_id") ?? "");

  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
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

      revalidateCheckoutPaths(projectId);
      redirect(withLocale(`${brandPortalRoutes.projectCheckout(projectId)}?paid=1`, lang));
    }
  }

  if (!orderId) {
    redirect(withLocale(`${brandPortalRoutes.projectCheckout(projectId)}?error=pay`, lang));
  }

  return payOrderAction(formData);
}
