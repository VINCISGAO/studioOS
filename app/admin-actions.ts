"use server";

import { revalidatePath } from "next/cache";
import { resolveDisputeSchema } from "@/features/admin/admin.schemas";
import { disputeService } from "@/features/admin/dispute.service";
import { getSessionUser } from "@/features/auth/session.service";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

export async function resolveDisputeAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const disputeId = String(formData.get("dispute_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const result = String(formData.get("result") ?? "").trim();
  const lang = String(formData.get("lang") ?? "en");

  const parsed = resolveDisputeSchema.parse({ status, result });
  await disputeService.resolve(user, disputeId, parsed);

  revalidatePath(adminPortalRoutes.disputes);
  revalidatePath(`${adminPortalRoutes.disputes}?lang=${lang}`);
  revalidatePath(adminPortalRoutes.disputeDetail(disputeId));
}
