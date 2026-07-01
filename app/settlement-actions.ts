"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getOrder, getOrderForProject } from "@/lib/order-service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { settlementService } from "@/features/settlement/settlement.service";
import { userRepository } from "@/features/auth/user.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

function revalidateSettlementPaths(legacyProjectId: string) {
  revalidatePath("/brand");
  revalidatePath("/brand/settlement");
  revalidatePath(brandPortalRoutes.project(legacyProjectId));
  revalidatePath(brandPortalRoutes.projectReview(legacyProjectId));
  revalidatePath("/studio");
  revalidatePath("/studio/income");
  revalidatePath("/studio/projects");
}

export async function releaseSettlementForLegacyProjectAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const orderId = String(formData.get("order_id") ?? "");

  if (!projectId) {
    redirect(withLocale("/brand/settlement?error=invalid", lang));
  }

  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    redirect(withLocale("/login?role=brand", lang));
  }

  const order = orderId ? await getOrder(orderId) : await getOrderForProject(projectId);
  const legacyProjectId = projectId || order?.project_id;
  if (!legacyProjectId) {
    redirect(withLocale("/brand/settlement?error=not-found", lang));
  }

  if (hasDatabaseUrl()) {
    const campaign = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (campaign) {
      const brandUser = await userRepository.ensureBrandPortalUser({
        email: clientEmail.toLowerCase(),
        fullName: clientEmail.split("@")[0],
        companyName: clientEmail.split("@")[0]
      });

      if (!brandUser || brandUser.id !== campaign.brandId) {
        redirect(withLocale(brandPortalRoutes.projectReview(legacyProjectId), lang));
      }

      const result = await settlementService.releaseForLegacyProject({
        legacyProjectId,
        actor: { id: brandUser.id, role: brandUser.role, email: brandUser.email },
        locale: lang,
        orderId: order?.id ?? null
      });

      if (!result.ok) {
        redirect(
          withLocale(`${brandPortalRoutes.projectReview(legacyProjectId)}?error=settlement`, lang)
        );
      }

      revalidateSettlementPaths(legacyProjectId);
      redirect(withLocale(`${brandPortalRoutes.projectReview(legacyProjectId)}?settled=1`, lang));
    }
  }

  redirect(withLocale("/brand/settlement?error=unavailable", lang));
}
