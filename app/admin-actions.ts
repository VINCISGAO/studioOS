"use server";

import { revalidatePath } from "next/cache";
import { resolveDisputeSchema } from "@/features/admin/admin.schemas";
import { adminSettlementService } from "@/features/admin/settlement/admin-settlement.service";
import { adminWithdrawalService } from "@/features/admin/withdrawal/admin-withdrawal.service";
import { adminWalletService } from "@/features/admin/wallet/admin-wallet.service";
import { adminNotificationService } from "@/features/admin/notification/admin-notification.service";
import { disputeService } from "@/features/admin/dispute.service";
import { guardAdminServerActionUser } from "@/features/admin/auth/admin-mutation-guard";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import type { Locale } from "@/lib/i18n";
import type { WalletAssetCode } from "@prisma/client";

function localeFrom(formData: FormData): Locale {
  return String(formData.get("lang") ?? "en") === "zh" ? "zh" : "en";
}

export async function resolveDisputeAction(formData: FormData) {
  const user = await guardAdminServerActionUser(formData);
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

export async function releaseSettlementAction(formData: FormData) {
  const user = await guardAdminServerActionUser(formData);
  const campaignId = String(formData.get("campaign_id") ?? "").trim();
  const locale = localeFrom(formData);
  await adminSettlementService.releaseSettlement(user, campaignId, locale);
  revalidatePath(adminPortalRoutes.settlements);
}

export async function retrySettlementAction(formData: FormData) {
  const user = await guardAdminServerActionUser(formData);
  const campaignId = String(formData.get("campaign_id") ?? "").trim();
  const locale = localeFrom(formData);
  await adminSettlementService.retryRelease(user, campaignId, locale);
  revalidatePath(adminPortalRoutes.settlements);
}

export async function freezeSettlementAction(formData: FormData) {
  const user = await guardAdminServerActionUser(formData);
  const campaignId = String(formData.get("campaign_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "Admin freeze").trim();
  await adminSettlementService.freezeSettlement(user, campaignId, reason);
  revalidatePath(adminPortalRoutes.settlements);
}

export async function cancelSettlementAction(formData: FormData) {
  const user = await guardAdminServerActionUser(formData);
  const campaignId = String(formData.get("campaign_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  await adminSettlementService.cancelSettlement(user, campaignId, note);
  revalidatePath(adminPortalRoutes.settlements);
}

export async function approveWithdrawalAction(formData: FormData) {
  const user = await guardAdminServerActionUser(formData);
  const withdrawId = String(formData.get("withdraw_id") ?? "").trim();
  await adminWithdrawalService.approve(user, withdrawId);
  revalidatePath(adminPortalRoutes.withdrawals);
}

export async function rejectWithdrawalAction(formData: FormData) {
  const user = await guardAdminServerActionUser(formData);
  const withdrawId = String(formData.get("withdraw_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "Rejected by admin").trim();
  await adminWithdrawalService.reject(user, withdrawId, reason);
  revalidatePath(adminPortalRoutes.withdrawals);
}

export async function adjustWalletAction(formData: FormData) {
  const user = await guardAdminServerActionUser(formData);
  const userId = String(formData.get("user_id") ?? "").trim();
  const assetCode = String(formData.get("asset_code") ?? "USD").trim() as WalletAssetCode;
  const amount = Number.parseFloat(String(formData.get("amount") ?? "0"));
  const direction = String(formData.get("direction") ?? "CREDIT") as "CREDIT" | "DEBIT";
  const description = String(formData.get("description") ?? "").trim();
  const lang = String(formData.get("lang") ?? "en");

  await adminWalletService.manualAdjust(user, { userId, assetCode, amount, direction, description });

  revalidatePath(adminPortalRoutes.wallets);
  revalidatePath(adminPortalRoutes.walletDetail(userId));
  revalidatePath(`${adminPortalRoutes.walletDetail(userId)}?lang=${lang}`);
}

export async function retryNotificationAction(formData: FormData) {
  const user = await guardAdminServerActionUser(formData);
  const notificationId = String(formData.get("notification_id") ?? "").trim();
  await adminNotificationService.retry(user, notificationId);
  revalidatePath(adminPortalRoutes.notifications);
}
