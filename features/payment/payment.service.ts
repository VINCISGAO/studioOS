import { paymentRepository } from "@/features/payment/payment.repository";
import { serializeEscrow } from "@/features/payment/escrow.serializer";
import { stripeCheckoutService } from "@/features/payment/stripe-checkout.service";
import { paymentBridgeService } from "@/features/payment/payment-bridge.service";
import { paymentCollectionService } from "@/features/payment/payment-collection.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import { userRepository } from "@/features/auth/user.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { runTransition } from "@/lib/core/transition-runner";
import { appError } from "@/lib/core/errors";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import {
  escrowStateMachine,
  EscrowState,
  type EscrowStateValue,
  type EscrowEventValue
} from "@/features/shared/state-machines/escrow.state-machine";
import type { EscrowStatus } from "@prisma/client";
import { CampaignEvents } from "@/features/shared/types/events";
import type { Locale } from "@/lib/i18n";

const PAYABLE_CAMPAIGN_STATES = new Set<string>([
  CampaignState.CREATIVE_APPROVED,
  CampaignState.ESCROW_PENDING,
]);

function allowDemoPaymentFallback() {
  if (process.env.VINCIS_ENABLE_DEMO_PAYMENT === "1" || process.env.STUDIOOS_ENABLE_DEMO_PAYMENT === "1") {
    return true;
  }
  return process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1";
}

export type BrandCampaignPaymentResult =
  | { ok: true; mode: "demo"; alreadyFunded: boolean }
  | { ok: true; mode: "stripe"; checkoutUrl: string }
  | { ok: false; error: string };

export class PaymentService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  private async getCampaignForPayment(campaignId: string, user: AuthUser) {
    this.assertDb();
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }
    if (user.role.toUpperCase() === "CREATOR") {
      throw appError("FORBIDDEN", "Creators cannot manage escrow payment");
    }
    return campaign;
  }

  async getEscrow(campaignId: string, user: AuthUser) {
    const campaign = await this.getCampaignForPayment(campaignId, user);
    PermissionService.assert(user, "payment.read");

    const escrow = await paymentRepository.findByCampaignId(campaignId);
    return {
      campaign: {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        budget: Number(campaign.budget),
        currency: campaign.currency
      },
      escrow: escrow ? serializeEscrow(escrow) : null
    };
  }

  private async ensureEscrowRecord(campaignId: string) {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
    const escrowCreatorId = campaign.creatorId ?? campaign.brandId;

    const existing = await paymentRepository.findByCampaignId(campaignId);
    if (existing) return existing;

    return paymentRepository.create({
      campaignId,
      brandId: campaign.brandId,
      creatorId: escrowCreatorId,
      amount: Number(campaign.budget),
      currency: campaign.currency
    });
  }

  private async transitionEscrow(
    campaignId: string,
    event: EscrowEventValue,
    actor?: AuthUser,
    metadata?: Record<string, unknown>
  ) {
    const escrow = await paymentRepository.findByCampaignId(campaignId);
    if (!escrow) throw appError("NOT_FOUND", "Escrow not found");

    const current = escrow.status as EscrowStateValue;

    return runTransition({
      machine: escrowStateMachine,
      current,
      event,
      context: {
        aggregateType: "payment",
        aggregateId: escrow.id,
        campaignId,
        actor,
        metadata
      },
      persist: async (next) => {
        await paymentRepository.updateStatus(campaignId, next as EscrowStatus);
      },
      domainEvent: {
        name: CampaignEvents.ESCROW_FUNDED,
        aggregateType: "payment",
        aggregateId: escrow.id,
        payload: { event, campaignId }
      }
    });
  }

  async startCheckout(
    campaignId: string,
    user: AuthUser & { email?: string },
    options: { portalProjectId?: string } = {}
  ) {
    const campaign = await this.getCampaignForPayment(campaignId, user);
    PermissionService.assert(user, "payment.read");

    if (!PAYABLE_CAMPAIGN_STATES.has(campaign.status)) {
      throw appError("INVALID_TRANSITION", `Cannot start checkout from status ${campaign.status}`);
    }

    await this.ensureEscrowRecord(campaignId);
    const actor = { id: user.id, role: user.role };

    let escrow = await paymentRepository.findByCampaignId(campaignId);
    if (!escrow) throw appError("NOT_FOUND", "Escrow not found");

    if (escrow.status === EscrowState.HELD) {
      throw appError("CAMPAIGN_LOCKED", "Escrow is already funded");
    }

    if (escrow.status === EscrowState.CREATED) {
      await this.transitionEscrow(campaignId, "START_PAYMENT", actor);
      if (campaign.status === CampaignState.CREATIVE_APPROVED) {
        await campaignService.transition(campaignId, CampaignEvent.START_PAYMENT, actor);
      }
      escrow = await paymentRepository.findByCampaignId(campaignId);
    }

    if (!stripeCheckoutService.isConfigured()) {
      if (!allowDemoPaymentFallback()) {
        throw appError("SYSTEM_ERROR", "Stripe checkout is not configured");
      }
      return {
        mode: "demo" as const,
        escrow: serializeEscrow(escrow!),
        message: "Stripe not configured — use POST .../checkout/demo"
      };
    }

    const session = await stripeCheckoutService.createCampaignCheckout({
      campaignId,
      escrowId: escrow!.id,
      amount: Number(campaign.budget),
      currency: campaign.currency.toLowerCase(),
      title: campaign.title,
      brandEmail: user.email,
      portalProjectId: options.portalProjectId
    });

    await paymentRepository.updatePaymentMeta(campaignId, {
      stripeSessionId: session.id
    });

    return {
      mode: "stripe" as const,
      checkoutUrl: session.url,
      sessionId: session.id,
      escrow: serializeEscrow(escrow!)
    };
  }

  async completePayment(input: {
    campaignId: string;
    stripePaymentId?: string;
    stripeSessionId?: string;
    actor?: AuthUser;
  }) {
    this.assertDb();

    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: input.campaignId } });
    let escrow = await paymentRepository.findByCampaignId(input.campaignId);
    if (!escrow) {
      escrow = await this.ensureEscrowRecord(input.campaignId);
    }

    if (escrow.status === EscrowState.HELD) {
      await paymentCollectionService
        .finalizeSuccessfulPayment({
          campaignId: input.campaignId,
          stripePaymentId: input.stripePaymentId,
          stripeSessionId: input.stripeSessionId
        })
        .catch(() => undefined);

      return {
        alreadyFunded: true,
        escrow: serializeEscrow(escrow),
        campaignStatus: campaign.status
      };
    }

    const actor = input.actor ?? { id: campaign.brandId, role: "BRAND" };

    if (escrow.status === EscrowState.CREATED) {
      await this.transitionEscrow(input.campaignId, "START_PAYMENT", actor);
      if (campaign.status === CampaignState.CREATIVE_APPROVED) {
        await campaignService.transition(input.campaignId, CampaignEvent.START_PAYMENT, actor);
      }
      escrow = (await paymentRepository.findByCampaignId(input.campaignId))!;
    }

    if (escrow.status !== EscrowState.PAYING) {
      throw appError("INVALID_TRANSITION", `Cannot complete payment from escrow status ${escrow.status}`);
    }

    await this.transitionEscrow(input.campaignId, "PAYMENT_HELD", actor, {
      stripeSessionId: input.stripeSessionId,
      stripePaymentId: input.stripePaymentId
    });

    if (input.stripePaymentId) {
      await paymentRepository.updateStatus(input.campaignId, EscrowState.HELD, {
        stripePaymentId: input.stripePaymentId
      });
    }

    const afterCreate = await prisma.campaign.findUniqueOrThrow({ where: { id: input.campaignId } });
    if (afterCreate.status === CampaignState.ESCROW_PENDING) {
      await campaignService.transition(input.campaignId, CampaignEvent.PAYMENT_SUCCESS, actor);
    }

    const afterPay = await prisma.campaign.findUniqueOrThrow({ where: { id: input.campaignId } });
    if (afterPay.status === CampaignState.ESCROW_FUNDED) {
      await campaignService.transition(input.campaignId, CampaignEvent.START_MATCHING, actor);
    }

    await paymentBridgeService.syncLegacyAfterEscrowFunded(input.campaignId);

    await paymentCollectionService.finalizeSuccessfulPayment({
      campaignId: input.campaignId,
      stripePaymentId: input.stripePaymentId,
      stripeSessionId: input.stripeSessionId
    });

    const finalEscrow = await paymentRepository.findByCampaignId(input.campaignId);
    const finalCampaign = await prisma.campaign.findUniqueOrThrow({ where: { id: input.campaignId } });

    return {
      alreadyFunded: false,
      escrow: serializeEscrow(finalEscrow!),
      campaignStatus: finalCampaign.status
    };
  }

  async demoPay(campaignId: string, user: AuthUser) {
    if (!allowDemoPaymentFallback()) {
      throw appError("FORBIDDEN", "Demo payment is disabled in production");
    }
    const campaign = await this.getCampaignForPayment(campaignId, user);
    PermissionService.assert(user, "payment.read");

    if (!PAYABLE_CAMPAIGN_STATES.has(campaign.status)) {
      const refreshed = await campaignRepository.findById(campaignId);
      if (
        refreshed?.status === CampaignState.PRODUCING ||
        refreshed?.status === CampaignState.ESCROW_FUNDED
      ) {
        const escrow = await paymentRepository.findByCampaignId(campaignId);
        return {
          alreadyFunded: true,
          escrow: escrow ? serializeEscrow(escrow) : null,
          campaignStatus: refreshed.status
        };
      }
      throw appError("INVALID_TRANSITION", `Cannot demo pay from status ${campaign.status}`);
    }

    return this.completePayment({
      campaignId,
      stripePaymentId: `demo_${campaignId}_${Date.now()}`,
      actor: { id: user.id, role: user.role }
    });
  }

  /** Brand portal checkout — resolve legacy project id → Prisma campaign payment. */
  async payBrandCampaignForLegacyProject(input: {
    legacyProjectId: string;
    clientEmail: string;
    locale: Locale;
  }): Promise<BrandCampaignPaymentResult> {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const campaign = await campaignRepository.findByLegacyProjectId(input.legacyProjectId);
    if (!campaign) {
      return { ok: false, error: "project-not-found" };
    }

    const brandUser = await userRepository.findByEmail(input.clientEmail.toLowerCase());
    if (!brandUser) {
      return { ok: false, error: "brand-not-found" };
    }

    if (campaign.brandId !== brandUser.id) {
      return { ok: false, error: "forbidden" };
    }

    const actor: AuthUser & { email?: string } = {
      id: brandUser.id,
      role: brandUser.role,
      email: brandUser.email
    };

    try {
      if (stripeCheckoutService.isConfigured()) {
        const checkout = await this.startCheckout(campaign.id, actor, {
          portalProjectId: input.legacyProjectId
        });
        if (checkout.mode === "stripe" && checkout.checkoutUrl) {
          return { ok: true, mode: "stripe", checkoutUrl: checkout.checkoutUrl };
        }
      }

      const paid = await this.demoPay(campaign.id, actor);
      return {
        ok: true,
        mode: "demo",
        alreadyFunded: Boolean(paid.alreadyFunded)
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "payment-failed";
      if (message.includes("no assigned creator")) {
        return { ok: false, error: "creator-not-selected" };
      }
      if (message.includes("INVALID_TRANSITION") || message.includes("Cannot demo pay")) {
        return { ok: false, error: "invalid-status" };
      }
      return { ok: false, error: "payment-failed" };
    }
  }
}

export const paymentService = new PaymentService();
