import type { ConversationMessageRole, ConversationStatus, Prisma } from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";
import { orderService } from "@/features/order/order.service";
import type { CreateOrderInput } from "@/features/order/order.repository";

export type CreateConversationInput = {
  creatorId: string;
  visitorId?: string | null;
  customerId?: string | null;
  campaignId?: string | null;
  channel: string;
  source?: string | null;
  language?: string;
  status?: ConversationStatus;
  openingMessage?: {
    role: ConversationMessageRole;
    content: string;
    metadata?: Prisma.InputJsonValue;
    tokens?: number | null;
  };
};

export type AddConversationMessageInput = {
  conversationId: string;
  role: ConversationMessageRole;
  content: string;
  metadata?: Prisma.InputJsonValue;
  tokens?: number | null;
};

export type ListConversationsInput = {
  creatorId?: string;
  customerId?: string;
  assignedTo?: string;
  status?: ConversationStatus;
  campaignId?: string;
  limit?: number;
};

export type CreateOrderFromConversationInput = Omit<CreateOrderInput, "conversationId" | "creatorProfileId" | "creatorId" | "clientId"> & {
  conversationId: string;
  clientId?: string;
};

export class AiSupportConversationService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  listConversations(input: ListConversationsInput = {}) {
    return prisma.conversation.findMany({
      where: {
        ...(input.creatorId ? { creatorId: input.creatorId } : {}),
        ...(input.customerId ? { customerId: input.customerId } : {}),
        ...(input.assignedTo ? { assignedTo: input.assignedTo } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.campaignId ? { campaignId: input.campaignId } : {})
      },
      include: {
        creator: { select: { id: true, displayName: true, userId: true } },
        customer: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        campaign: { select: { id: true, title: true, status: true } },
        assignedAgent: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        orders: { select: { id: true, status: true, orderAmount: true, currency: true } },
        attributions: { take: 3, orderBy: { createdAt: "desc" } }
      },
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      take: input.limit ?? 50
    });
  }

  getConversation(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        creator: { include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } } },
        customer: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        campaign: { select: { id: true, title: true, status: true } },
        assignedAgent: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: "asc" } },
        orders: { orderBy: { createdAt: "desc" } },
        attributions: { orderBy: { createdAt: "desc" } }
      }
    });
  }

  async createConversation(input: CreateConversationInput) {
    if (!input.channel.trim()) {
      throw new Error("Conversation channel is required");
    }

    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const conversation = await tx.conversation.create({
        data: {
          creatorId: input.creatorId,
          visitorId: input.visitorId ?? null,
          customerId: input.customerId ?? null,
          campaignId: input.campaignId ?? null,
          channel: input.channel,
          source: input.source ?? null,
          language: input.language ?? "en",
          status: input.status ?? "OPEN",
          lastMessageAt: input.openingMessage ? now : null
        }
      });

      if (!input.openingMessage) {
        return conversation;
      }

      await tx.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          role: input.openingMessage.role,
          content: input.openingMessage.content,
          metadata: asInputJson(input.openingMessage.metadata),
          tokens: input.openingMessage.tokens ?? null,
          createdAt: now
        }
      });

      return conversation;
    });
  }

  async addMessage(input: AddConversationMessageInput) {
    if (!input.content.trim()) {
      throw new Error("Conversation message content is required");
    }

    return prisma.$transaction(async (tx) => {
      const createdAt = new Date();
      const message = await tx.conversationMessage.create({
        data: {
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          metadata: asInputJson(input.metadata),
          tokens: input.tokens ?? null,
          createdAt
        }
      });

      await tx.conversation.update({
        where: { id: input.conversationId },
        data: {
          lastMessageAt: createdAt,
          ...(input.role === "HUMAN_AGENT" ? { status: "HUMAN_ACTIVE" } : {})
        }
      });

      return message;
    });
  }

  async requestHumanHandoff(conversationId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.conversation.update({
        where: { id: conversationId },
        data: { status: "HUMAN_REQUIRED" }
      });

      await tx.conversationMessage.create({
        data: {
          conversationId,
          role: "SYSTEM",
          content: "AI handoff requested.",
          metadata: asInputJson(reason ? { reason } : undefined)
        }
      });

      return updated;
    });
  }

  async assignHumanAgent(conversationId: string, userId: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedTo: userId,
        status: "HUMAN_ACTIVE"
      }
    });
  }

  replyAsHuman(conversationId: string, content: string, userId: string) {
    return this.addMessage({
      conversationId,
      role: "HUMAN_AGENT",
      content,
      metadata: { userId }
    });
  }

  closeConversation(conversationId: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: "CLOSED",
        endedAt: new Date()
      }
    });
  }

  async createOrderFromConversation(input: CreateOrderFromConversationInput) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: input.conversationId },
      include: { creator: { select: { id: true, userId: true } } }
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const clientId = input.clientId ?? conversation.customerId;
    if (!clientId) {
      throw new Error("A customer is required before converting a conversation to an order");
    }

    const order = await orderService.createOrder({
      ...input,
      clientId,
      creatorId: conversation.creator.userId,
      creatorProfileId: conversation.creator.id,
      campaignId: input.campaignId ?? conversation.campaignId,
      sourceChannel: input.sourceChannel ?? conversation.channel,
      conversationId: conversation.id
    });

    await prisma.attribution.updateMany({
      where: {
        conversationId: conversation.id,
        orderId: null
      },
      data: { orderId: order.id }
    });

    return order;
  }
}

export const aiSupportConversationService = new AiSupportConversationService();
