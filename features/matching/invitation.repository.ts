import type { InvitationStatus } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import type {
  CreatorInvitationDeclineReason,
  InvitationDeclineFeedback
} from "@/features/matching/invitation-decline-feedback";
import {
  InvitationEvent,
  invitationStateMachine,
  type InvitationEventValue,
  type InvitationStateValue
} from "@/features/shared/state-machines/invitation.state-machine";
import { appError } from "@/lib/core/errors";

export class InvitationRepository {
  async listForCampaign(campaignId: string) {
    if (!hasDatabaseUrl()) return [];
    return prisma.creatorInvitation.findMany({
      where: { campaignId },
      include: {
        creator: { include: { user: true } },
        campaign: {
          include: {
            brand: { include: { brandProfile: true } }
          }
        }
      },
      orderBy: { matchScore: "desc" }
    });
  }

  async listForCreatorProfile(creatorProfileId: string) {
    if (!hasDatabaseUrl()) return [];
    return prisma.creatorInvitation.findMany({
      where: { creatorId: creatorProfileId },
      include: {
        creator: { include: { user: true } },
        campaign: {
          include: {
            brand: { include: { brandProfile: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async findById(id: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.creatorInvitation.findUnique({
      where: { id },
      include: {
        campaign: {
          include: {
            brand: { include: { brandProfile: true } }
          }
        },
        creator: { include: { user: true } }
      }
    });
  }

  async findExisting(campaignId: string, creatorProfileId: string) {
    return prisma.creatorInvitation.findFirst({
      where: { campaignId, creatorId: creatorProfileId }
    });
  }

  async create(input: {
    campaignId: string;
    creatorProfileId: string;
    matchScore: number;
    expiresAt?: Date;
  }) {
    return prisma.creatorInvitation.create({
      data: {
        campaignId: input.campaignId,
        creatorId: input.creatorProfileId,
        matchScore: input.matchScore,
        status: "SENT",
        expiresAt: input.expiresAt ?? new Date(Date.now() + 7 * 86400000)
      },
      include: {
        creator: { include: { user: true } },
        campaign: {
          include: {
            brand: { include: { brandProfile: true } }
          }
        }
      }
    });
  }

  async updateStatus(id: string, status: InvitationStatus, respondedAt = new Date()) {
    return prisma.creatorInvitation.update({
      where: { id },
      data: { status, respondedAt }
    });
  }

  async transitionInvitation(id: string, event: InvitationEventValue, respondedAt = new Date()) {
    const current = await prisma.creatorInvitation.findUnique({
      where: { id },
      select: { status: true }
    });
    if (!current) {
      throw appError("NOT_FOUND", "Invitation not found");
    }

    const next = invitationStateMachine.transition(current.status as InvitationStateValue, event);
    return prisma.creatorInvitation.update({
      where: { id },
      data: {
        status: next as InvitationStatus,
        ...(event === InvitationEvent.VIEW
          ? {}
          : { respondedAt })
      }
    });
  }

  async declineWithFeedback(id: string, feedback: InvitationDeclineFeedback, respondedAt = new Date()) {
    const current = await prisma.creatorInvitation.findUnique({
      where: { id },
      select: { status: true }
    });
    if (!current) {
      throw appError("NOT_FOUND", "Invitation not found");
    }
    invitationStateMachine.transition(current.status as InvitationStateValue, InvitationEvent.DECLINE);

    await prisma.$executeRaw`
      UPDATE "creator_invitations"
      SET
        "status" = 'DECLINED',
        "responded_at" = ${respondedAt},
        "decline_reason" = ${feedback.reason as CreatorInvitationDeclineReason}::"CreatorInvitationDeclineReason",
        "decline_feedback_json" = ${JSON.stringify(feedback)}::jsonb,
        "updated_at" = ${respondedAt}
      WHERE "id" = ${id}
    `;
  }

  async countAcceptedForCampaign(campaignId: string) {
    if (!hasDatabaseUrl()) return 0;
    return prisma.creatorInvitation.count({
      where: { campaignId, status: "ACCEPTED" }
    });
  }

  async findByCampaignAndCreatorProfile(campaignId: string, creatorProfileId: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.creatorInvitation.findFirst({
      where: { campaignId, creatorId: creatorProfileId },
      include: {
        campaign: {
          include: {
            brand: { include: { brandProfile: true } }
          }
        },
        creator: { include: { user: true } }
      }
    });
  }

  async expireNonWinners(campaignId: string, winnerInvitationId: string) {
    if (!hasDatabaseUrl()) return { count: 0 };
    return prisma.creatorInvitation.updateMany({
      where: {
        campaignId,
        id: { not: winnerInvitationId },
        status: { in: ["SENT", "VIEWED", "ACCEPTED"] }
      },
      data: { status: "EXPIRED", respondedAt: new Date() }
    });
  }

  async expireOpenBatch(campaignId: string) {
    if (!hasDatabaseUrl()) return { count: 0 };
    return prisma.creatorInvitation.updateMany({
      where: {
        campaignId,
        status: { in: ["SENT", "VIEWED"] }
      },
      data: { status: "EXPIRED", respondedAt: new Date() }
    });
  }
}

export const invitationRepository = new InvitationRepository();
