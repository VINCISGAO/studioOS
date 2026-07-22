import type { Prisma } from "@prisma/client";
import { creditAuditService } from "@/features/credit-wallet/credit-audit.service";
import { creditWalletRepository } from "@/features/credit-wallet/credit-wallet.repository";
import type { AdminAdjustCreditsInput } from "@/features/credit-wallet/credit-pricing.types";
import { appError } from "@/lib/core/errors";

export class CreditLedgerService {
  async reserveCredits(input: {
    userId: string;
    amount: number;
    idempotencyKey: string;
    pricingSnapshot?: Prisma.InputJsonValue;
    generationJobId?: string;
    campaignId?: string | null;
    description?: string;
  }) {
    const reservation = await creditWalletRepository.reserveCredits(input);
    const campaignId = await creditAuditService.resolveCampaignId({
      campaignId: input.campaignId,
      generationJobId: input.generationJobId,
      userId: input.userId
    });

    await creditAuditService.write(
      "credits.reserved",
      {
        userId: input.userId,
        campaignId,
        reservationId: reservation.id,
        generationJobId: input.generationJobId,
        credits: input.amount
      },
      { idempotencyKey: input.idempotencyKey }
    );

    return reservation;
  }

  async captureReservation(
    reservationId: string,
    actualCredits: number,
    context?: { campaignId?: string | null; generationJobId?: string | null }
  ) {
    const reservation = await creditWalletRepository.captureReservation(reservationId, actualCredits);
    const campaignId = await creditAuditService.resolveCampaignId({
      campaignId: context?.campaignId,
      generationJobId: context?.generationJobId ?? reservation.generationJobId,
      userId: reservation.userId
    });

    await creditAuditService.write(
      "credits.captured",
      {
        userId: reservation.userId,
        campaignId,
        reservationId: reservation.id,
        generationJobId: reservation.generationJobId,
        credits: actualCredits
      },
      {
        estimatedCredits: reservation.estimatedCredits,
        releasedCredits: reservation.releasedCredits
      }
    );

    return reservation;
  }

  async releaseReservation(
    reservationId: string,
    context?: { campaignId?: string | null; generationJobId?: string | null; reason?: string }
  ) {
    const reservation = await creditWalletRepository.releaseReservation(reservationId);
    const campaignId = await creditAuditService.resolveCampaignId({
      campaignId: context?.campaignId,
      generationJobId: context?.generationJobId ?? reservation.generationJobId,
      userId: reservation.userId
    });

    await creditAuditService.write(
      "credits.released",
      {
        userId: reservation.userId,
        campaignId,
        reservationId: reservation.id,
        generationJobId: reservation.generationJobId,
        credits: reservation.estimatedCredits,
        reason: context?.reason
      },
      { status: reservation.status }
    );

    return reservation;
  }

  async linkReservationToJob(reservationId: string, generationJobId: string) {
    return creditWalletRepository.linkReservationToJob(reservationId, generationJobId);
  }

  async adminAdjustCredits(input: AdminAdjustCreditsInput) {
    if (!input.reason.trim() || !input.internalNote.trim()) {
      throw appError("VALIDATION_ERROR", "Reason and internal note are required");
    }

    const result = await creditWalletRepository.adminAdjustCredits(input);
    const campaignId = await creditAuditService.resolveCampaignId({ userId: input.userId });

    await creditAuditService.write(
      "credits.admin_adjusted",
      {
        userId: input.userId,
        campaignId,
        actorUserId: input.actorUserId,
        credits: input.amount,
        reason: input.reason,
        internalNote: input.internalNote
      },
      {
        idempotencyKey: input.idempotencyKey,
        balanceAfter: result.wallet.availableCredits
      }
    );

    return result;
  }
}

export const creditLedgerService = new CreditLedgerService();
