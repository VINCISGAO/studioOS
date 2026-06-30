"use server";

import { featureFlagService } from "@/features/admin/feature-flag.service";
import { featureFlagSchema } from "@/features/admin/admin.schemas";
import { getSessionUser } from "@/features/auth/session.service";
import { revalidatePath } from "next/cache";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

export async function toggleFeatureFlagAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const key = String(formData.get("key") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "") === "true";
  const lang = String(formData.get("lang") ?? "en");

  const parsed = featureFlagSchema.parse({ key, enabled });
  await featureFlagService.upsert(user, parsed);

  revalidatePath(adminPortalRoutes.featureFlags);
  revalidatePath(`${adminPortalRoutes.featureFlags}?lang=${lang}`);
}
