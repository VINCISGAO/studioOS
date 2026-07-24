import type { GenerationJob, Prisma } from "@prisma/client";
import { creditLedgerService } from "@/features/credit-wallet/credit-ledger.service";
import { creditPricingService } from "@/features/credit-wallet/credit-pricing.service";
import { creditWalletRepository } from "@/features/credit-wallet/credit-wallet.repository";
import { appError } from "@/lib/core/errors";

export class CreditGenerationBillingService {
  async quoteGeneration(input: {
    type: "IMAGE" | "VIDEO" | "MUSIC";
    model: string;
    parameters: Record<string, unknown>;
  }) {
    const quote = await creditPricingService.quoteGeneration({
      type: input.type,
      model: input.model,
      parameters: input.parameters
    });
    return quote.credits;
  }

  async quoteGenerationDetailed(input: {
    type: "IMAGE" | "VIDEO" | "MUSIC";
    model: string;
    parameters: Record<string, unknown>;
  }) {
    return creditPricingService.quoteGeneration({
      type: input.type,
      model: input.model,
      parameters: input.parameters
    });
  }

  async reserveForGeneration(input: {
    userId: string;
    type: "IMAGE" | "VIDEO" | "MUSIC";
    model: string;
    parameters: Record<string, unknown>;
    idempotencyKey: string;
    generationJobId?: string;
    campaignId?: string | null;
  }) {
    const quote = await creditPricingService.quoteGeneration({
      type: input.type,
      model: input.model,
      parameters: input.parameters
    });

    const wallet = await creditWalletRepository.getOrCreateWallet(input.userId);
    if (wallet.availableCredits < quote.minimumBalance) {
      throw appError("VALIDATION_ERROR", "Insufficient Token for this model");
    }
    if (wallet.availableCredits < quote.credits) {
      throw appError("VALIDATION_ERROR", "Insufficient Token");
    }

    const pricingSnapshot: Prisma.InputJsonValue = {
      ...quote,
      type: input.type,
      parameters: JSON.parse(JSON.stringify(input.parameters)) as Prisma.InputJsonValue,
      ruleVersion: quote.ruleVersion,
      creditsQuoted: quote.credits,
      providerCostSnapshot: {
        providerCostMinor: quote.providerCostMinor,
        outputCount: quote.outputCount
      }
    };

    const reservation = await creditLedgerService.reserveCredits({
      userId: input.userId,
      amount: quote.credits,
      idempotencyKey: input.idempotencyKey,
      pricingSnapshot,
      generationJobId: input.generationJobId,
      campaignId: input.campaignId,
      description: `${input.type} generation reservation`
    });

    return { reservation, estimatedCredits: quote.credits, pricingSnapshot, quote };
  }

  async finalizeSuccess(
    reservationId: string,
    actualCredits: number,
    context?: { campaignId?: string | null; generationJobId?: string | null }
  ) {
    if (!Number.isInteger(actualCredits) || actualCredits <= 0) {
      throw appError("VALIDATION_ERROR", "Invalid capture amount");
    }
    return creditLedgerService.captureReservation(reservationId, actualCredits, context);
  }

  async finalizeFailure(
    reservationId: string,
    context?: { campaignId?: string | null; generationJobId?: string | null; reason?: string }
  ) {
    return creditLedgerService.releaseReservation(reservationId, context);
  }

  async syncJobBilling(job: GenerationJob) {
    if (!job.creditReservationId) return null;
    const reservation = await creditWalletRepository.findReservationById(job.creditReservationId);
    if (!reservation || reservation.status !== "ACTIVE") return reservation;

    const context = {
      campaignId: job.campaignId,
      generationJobId: job.id
    };

    if (job.status === "SUCCEEDED") {
      const actualCredits = job.actualCredits ?? job.estimatedCredits;
      return creditLedgerService.captureReservation(job.creditReservationId, actualCredits, context);
    }

    if (job.status === "FAILED" || job.status === "CANCELLED") {
      return creditLedgerService.releaseReservation(job.creditReservationId, {
        ...context,
        reason: job.errorCode ?? job.status
      });
    }

    return reservation;
  }
}

export const creditGenerationBillingService = new CreditGenerationBillingService();
