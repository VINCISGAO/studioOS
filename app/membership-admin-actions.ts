"use server";

import { revalidatePath } from "next/cache";
import { commissionRuleSchema } from "@/features/membership/membership.schemas";
import { membershipAdminService } from "@/features/membership/membership-admin.service";
import { getSessionUser } from "@/features/auth/session.service";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import type { Locale } from "@/lib/i18n";

export async function updateCommissionRuleAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const lang = (String(formData.get("lang") ?? "en") === "zh" ? "zh" : "en") as Locale;
  const body = commissionRuleSchema.parse({
    name: String(formData.get("name") ?? "default"),
    clientServiceFeePercentage: Number(formData.get("client_service_fee_percentage")),
    defaultCreatorCommissionPercentage: Number(formData.get("default_creator_commission_percentage")),
    verifiedCreatorCommissionPercentage: Number(formData.get("verified_creator_commission_percentage")),
    upgradeRevenueThreshold: Number(formData.get("upgrade_revenue_threshold")),
    upgradeModalEnabled: formData.get("upgrade_modal_enabled") === "on",
    clientServiceFeeEnabled: formData.get("client_service_fee_enabled") === "on"
  });

  await membershipAdminService.upsertCommissionRule(user, body);
  revalidatePath(`${adminPortalRoutes.membership}?lang=${lang}`);
}
