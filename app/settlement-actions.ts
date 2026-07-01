"use server";

import { revalidatePath } from "next/cache";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getOrder, getOrderForProject } from "@/lib/order-service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { settlementService } from "@/features/settlement/settlement.service";
import { userRepository } from "@/features/auth/user.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";
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
    return { ok: false as const, error: lang === "zh" ? "参数无效" : "Invalid input" };
  }

  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    return { ok: false as const, error: lang === "zh" ? "请先登录" : "Sign in required" };
  }

  const order = orderId ? await getOrder(orderId) : await getOrderForProject(projectId);
  const legacyProjectId = projectId || order?.project_id;
  if (!legacyProjectId) {
    return { ok: false as const, error: lang === "zh" ? "未找到项目" : "Project not found" };
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
        return { ok: false as const, error: lang === "zh" ? "无权限" : "Unauthorized" };
      }

      const result = await settlementService.releaseForLegacyProject({
        legacyProjectId,
        actor: { id: brandUser.id, role: brandUser.role, email: brandUser.email },
        locale: lang,
        orderId: order?.id ?? null
      });

      if (!result.ok) {
        const message =
          result.error === "not-ready"
            ? lang === "zh"
              ? "交付尚未锁定或托管未就绪，无法结算"
              : "Delivery must be locked and escrow held before settlement"
            : lang === "zh"
              ? "暂时无法结算"
              : "Could not release settlement";
        return { ok: false as const, error: message };
      }

      revalidateSettlementPaths(legacyProjectId);
      return { ok: true as const, result: result.result };
    }
  }

  return { ok: false as const, error: lang === "zh" ? "暂不可用" : "Not available" };
}
