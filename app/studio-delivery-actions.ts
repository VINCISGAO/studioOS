"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getOrder } from "@/lib/order-service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { deliveryService } from "@/features/delivery/delivery.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";

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
    return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
  }

  const legacyProjectId = projectId || order.project_id;
  if (!legacyProjectId || !Number.isFinite(versionNumber) || versionNumber < 1) {
    return { ok: false as const, error: lang === "zh" ? "参数无效" : "Invalid input" };
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
        const message =
          result.error === "invalid-status"
            ? lang === "zh"
              ? "品牌尚未通过审片，无法标记最终版"
              : "Brand must approve review before marking final"
            : result.error === "version-not-found"
              ? lang === "zh"
                ? "所选版本不存在"
                : "Selected version not found"
              : lang === "zh"
                ? "无法标记最终版"
                : "Could not mark as final";
        return { ok: false as const, error: message };
      }

      revalidateDeliveryPaths(legacyProjectId, orderId);
      return { ok: true as const, delivery: result.delivery };
    }
  }

  return { ok: false as const, error: lang === "zh" ? "暂不可用" : "Not available" };
}
