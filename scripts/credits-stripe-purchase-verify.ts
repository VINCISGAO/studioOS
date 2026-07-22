/**
 * Stripe Credits purchase flow verification (repository + cumulative refund logic)
 * Run: npm run credits:stripe:verify
 */
import { PrismaClient } from "@prisma/client";
import { creditPurchaseService } from "../features/credit-wallet/credit-purchase.service";
import { creditWalletRepository } from "../features/credit-wallet/credit-wallet.repository";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

function report(checks: Check[]) {
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
  }
  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`${failed.length} stripe purchase verification check(s) failed`);
  }
}

async function main() {
  const checks: Check[] = [];

  if (!process.env.DATABASE_URL) {
    checks.push({ name: "stripe.skip", ok: true, detail: "DATABASE_URL not configured" });
    report(checks);
    return;
  }

  const user = await prisma.user.findFirst({
    where: { role: "CREATOR" },
    orderBy: { createdAt: "asc" }
  });
  const pkg = await prisma.creditPackage.findFirst({ where: { enabled: true }, orderBy: { sortOrder: "asc" } });

  if (!user || !pkg) {
    checks.push({ name: "stripe.skip", ok: true, detail: "Missing creator user or credit package" });
    report(checks);
    return;
  }

  const wallet = await creditWalletRepository.getOrCreateWallet(user.id);
  const idempotencyKey = `verify-stripe-${Date.now()}`;
  const order = await creditWalletRepository.createPurchaseOrder({
    userId: user.id,
    walletId: wallet.id,
    packageId: pkg.id,
    credits: pkg.credits,
    bonusCredits: pkg.bonusCredits,
    currency: pkg.currency,
    amountMinor: pkg.amountMinor,
    idempotencyKey
  });

  await creditWalletRepository.markPurchasePaymentCreated(order.id, `cs_verify_${Date.now()}`);

  const first = await creditWalletRepository.creditPurchaseOrderOnce({
    orderId: order.id,
    providerPaymentId: "pi_verify_stripe_1",
    providerChargeId: "ch_verify_stripe_1",
    providerSessionId: order.providerSessionId ?? undefined,
    paidAt: new Date()
  });
  checks.push({
    name: "stripe.credit_once",
    ok: first.duplicate === false && first.order.status === "CREDITED",
    detail: first.order.status
  });

  const duplicate = await creditWalletRepository.creditPurchaseOrderOnce({
    orderId: order.id,
    providerPaymentId: "pi_verify_stripe_1",
    paidAt: new Date()
  });
  checks.push({
    name: "stripe.webhook_idempotent",
    ok: duplicate.duplicate === true,
    detail: String(duplicate.duplicate)
  });

  const txCount = await prisma.creditTransaction.count({
    where: { referenceType: "CreditPurchaseOrder", referenceId: order.id }
  });
  checks.push({
    name: "stripe.ledger_written",
    ok: txCount >= 1,
    detail: String(txCount)
  });

  const partialMinor = Math.floor(order.amountMinor / 2);
  const partialRefund = await creditWalletRepository.refundPurchaseOrderOnce({
    orderId: order.id,
    providerRefundId: "re_verify_partial_1",
    refundAmountMinor: partialMinor,
    cumulativeRefundedMinor: partialMinor,
    refundedAt: new Date()
  });
  checks.push({
    name: "stripe.partial_refund_delta",
    ok:
      partialRefund.duplicate === false &&
      partialRefund.order.status === "PARTIALLY_REFUNDED" &&
      partialRefund.order.totalRefundedMinor === partialMinor,
    detail: `status=${partialRefund.order.status}, clawed=${partialRefund.clawedBack}`
  });

  const partialDuplicate = await creditWalletRepository.refundPurchaseOrderOnce({
    orderId: order.id,
    providerRefundId: "re_verify_partial_1",
    refundAmountMinor: partialMinor,
    cumulativeRefundedMinor: partialMinor,
    refundedAt: new Date()
  });
  checks.push({
    name: "stripe.partial_refund_idempotent",
    ok: partialDuplicate.duplicate === true,
    detail: String(partialDuplicate.duplicate)
  });

  const fullRefund = await creditWalletRepository.refundPurchaseOrderOnce({
    orderId: order.id,
    providerRefundId: "re_verify_full_1",
    refundAmountMinor: order.amountMinor - partialMinor,
    cumulativeRefundedMinor: order.amountMinor,
    refundedAt: new Date()
  });
  checks.push({
    name: "stripe.full_refund_cumulative",
    ok: fullRefund.order.status === "REFUNDED" && fullRefund.order.totalRefundedMinor === order.amountMinor,
    detail: `clawed=${fullRefund.clawedBack}, shortfall=${fullRefund.shortfall}`
  });

  const disputeOrder = await creditWalletRepository.createPurchaseOrder({
    userId: user.id,
    walletId: wallet.id,
    packageId: pkg.id,
    credits: 50,
    bonusCredits: 0,
    currency: pkg.currency,
    amountMinor: 500,
    idempotencyKey: `verify-dispute-${Date.now()}`
  });
  await creditWalletRepository.creditPurchaseOrderOnce({
    orderId: disputeOrder.id,
    providerPaymentId: "pi_verify_dispute",
    providerChargeId: "ch_verify_dispute",
    paidAt: new Date()
  });
  await prisma.creditWallet.update({
    where: { id: wallet.id },
    data: { availableCredits: 200, purchaseBlocked: false }
  });

  const disputeCreated = await creditWalletRepository.handlePurchaseDisputeCreated({
    orderId: disputeOrder.id,
    stripeDisputeId: "dp_verify_1",
    disputeStatus: "needs_response"
  });
  const walletAfterDispute = await creditWalletRepository.findWallet(user.id);
  checks.push({
    name: "stripe.dispute_created_hold",
    ok:
      disputeCreated.order.status === "DISPUTED" &&
      Boolean(walletAfterDispute?.purchaseBlocked) &&
      disputeCreated.heldCredits >= 0,
    detail: `held=${disputeCreated.heldCredits}`
  });

  const disputeClosed = await creditWalletRepository.handlePurchaseDisputeClosed({
    orderId: disputeOrder.id,
    stripeDisputeId: "dp_verify_1",
    disputeStatus: "won",
    merchantWon: true
  });
  checks.push({
    name: "stripe.dispute_closed_release",
    ok: disputeClosed.releasedCredits >= 0 && disputeClosed.order.creditsDisputeHeld === 0,
    detail: `released=${disputeClosed.releasedCredits}`
  });

  const cancelled = await creditWalletRepository.markPurchaseCancelled(`pending_${Date.now()}`);
  checks.push({
    name: "stripe.cancel_safe_noop",
    ok: cancelled.count === 0,
    detail: String(cancelled.count)
  });

  const failedOrder = await creditWalletRepository.createPurchaseOrder({
    userId: user.id,
    walletId: wallet.id,
    packageId: pkg.id,
    credits: pkg.credits,
    bonusCredits: 0,
    currency: pkg.currency,
    amountMinor: pkg.amountMinor,
    idempotencyKey: `verify-fail-${Date.now()}`
  });
  await creditWalletRepository.markPurchasePaymentCreated(failedOrder.id, `cs_fail_${Date.now()}`);
  const failed = await creditWalletRepository.markPurchaseFailed(failedOrder.id);
  const failedRow = await creditWalletRepository.findPurchaseOrderById(failedOrder.id);
  checks.push({
    name: "stripe.failed_transition",
    ok: failed.count === 1 && failedRow?.status === "FAILED",
    detail: failedRow?.status
  });

  void creditPurchaseService;

  report(checks);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
