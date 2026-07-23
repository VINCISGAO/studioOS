import "server-only";

import { depositRepository } from "@/features/deposit/deposit.repository";
import { assertDemoDepositPaymentsAllowed } from "@/lib/deposit/deposit-env";
import { logger } from "@/lib/core/logger";

/**
 * Demo-only deposit auto-confirm. Never statically imported by production payment paths.
 * Call sites must dynamic-import this module.
 */
export async function advanceDemoDepositPayments(accountId: string, legacyCreatorKey: string) {
  assertDemoDepositPaymentsAllowed("advanceDemoDepositPayments");

  const confirmedPaymentId = await depositRepository.advanceDemoPayments(accountId);
  if (!confirmedPaymentId) {
    return null;
  }

  const { ensureCertificationFormAndMessage } = await import(
    "@/lib/studioos/certification-form-notify"
  );
  await ensureCertificationFormAndMessage({
    creatorId: legacyCreatorKey,
    depositPaymentId: confirmedPaymentId
  }).catch(() => undefined);

  logger.info("Demo deposit auto-confirmed", {
    service: "demo-deposit-payments",
    accountId,
    paymentId: confirmedPaymentId
  });

  return confirmedPaymentId;
}
