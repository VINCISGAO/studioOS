import type { ProposalInquiry, ProposalInquiryMessage } from "@prisma/client";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { StoredInquiry, StoredMessage } from "@/lib/chat-types";

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapInquiry(row: ProposalInquiry): StoredInquiry {
  return {
    id: row.id,
    creator_id: row.creatorLegacyId,
    work_id: row.workId,
    project_id: row.projectLegacyId,
    client_name: row.clientName,
    client_email: row.clientEmail,
    company_name: row.companyName,
    budget_range: row.budgetRange,
    message: row.message,
    status: row.status as StoredInquiry["status"],
    created_at: row.createdAt.toISOString()
  };
}

function mapMessage(row: ProposalInquiryMessage): StoredMessage {
  return {
    id: row.id,
    inquiry_id: row.inquiryId,
    sender: row.sender as StoredMessage["sender"],
    body: row.body,
    kind: (row.kind as StoredMessage["kind"]) ?? "text",
    attachment_url: row.attachmentUrl,
    created_at: row.createdAt.toISOString()
  };
}

export class ProposalInquiryRepository {
  isEnabled() {
    return hasDatabaseUrl();
  }

  async resolveCreatorProfileId(creatorLegacyId: string) {
    return resolveCreatorProfileIdForLegacyId(creatorLegacyId);
  }

  async findById(id: string) {
    const row = await prisma.proposalInquiry.findUnique({ where: { id } });
    return row ? mapInquiry(row) : null;
  }

  async listForCreator(creatorLegacyId: string) {
    const rows = await prisma.proposalInquiry.findMany({
      where: { creatorLegacyId },
      orderBy: { createdAt: "desc" }
    });
    return rows.map(mapInquiry);
  }

  async listForClient(clientEmail: string) {
    const normalized = clientEmail.trim().toLowerCase();
    const rows = await prisma.proposalInquiry.findMany({
      where: { clientEmail: normalized },
      orderBy: { createdAt: "desc" }
    });
    return rows.map(mapInquiry);
  }

  async listForPair(clientEmail: string, creatorLegacyId: string) {
    const normalized = clientEmail.trim().toLowerCase();
    const rows = await prisma.proposalInquiry.findMany({
      where: { clientEmail: normalized, creatorLegacyId },
      orderBy: { createdAt: "desc" }
    });
    return rows.map(mapInquiry);
  }

  async findOpenForPair(clientEmail: string, creatorLegacyId: string) {
    const rows = await this.listForPair(clientEmail, creatorLegacyId);
    return (
      rows.find((item) => !["converted", "closed"].includes(item.status)) ?? null
    );
  }

  async createInquiry(input: {
    creatorLegacyId: string;
    creatorProfileId?: string | null;
    workId?: string | null;
    projectLegacyId?: string | null;
    clientName: string;
    clientEmail: string;
    companyName?: string;
    budgetRange?: string;
    message: string;
  }) {
    const id = createId("inq");
    const createdAt = new Date();
    const row = await prisma.proposalInquiry.create({
      data: {
        id,
        creatorLegacyId: input.creatorLegacyId,
        creatorProfileId: input.creatorProfileId ?? null,
        workId: input.workId ?? null,
        projectLegacyId: input.projectLegacyId ?? null,
        clientName: input.clientName,
        clientEmail: input.clientEmail.toLowerCase(),
        companyName: input.companyName ?? "",
        budgetRange: input.budgetRange ?? "",
        message: input.message,
        status: "new",
        createdAt,
        messages: {
          create: [
            {
              id: createId("msg"),
              sender: "brand",
              body: input.message,
              createdAt
            },
            {
              id: createId("msg"),
              sender: "system",
              body:
                "Proposal Room opened. All messages are saved on-platform for contract and dispute records.",
              createdAt: new Date()
            }
          ]
        }
      }
    });
    return mapInquiry(row);
  }

  async appendBrandFollowUp(
    inquiryId: string,
    input: { message: string; budgetRange?: string; workId?: string | null }
  ) {
    const inquiry = await prisma.proposalInquiry.update({
      where: { id: inquiryId },
      data: {
        budgetRange: input.budgetRange?.trim() || undefined,
        workId: input.workId ?? undefined
      }
    });

    const now = new Date();
    await prisma.proposalInquiryMessage.createMany({
      data: [
        {
          id: createId("msg"),
          inquiryId,
          sender: "brand",
          body: input.message,
          createdAt: now
        },
        {
          id: createId("msg"),
          inquiryId,
          sender: "system",
          body: "Additional requirements added to this inquiry thread.",
          createdAt: new Date()
        }
      ]
    });

    return mapInquiry(inquiry);
  }

  async updateStatus(inquiryId: string, status: StoredInquiry["status"]) {
    const row = await prisma.proposalInquiry.update({
      where: { id: inquiryId },
      data: { status }
    });
    return mapInquiry(row);
  }

  async listMessages(inquiryId: string) {
    const rows = await prisma.proposalInquiryMessage.findMany({
      where: { inquiryId },
      orderBy: { createdAt: "asc" }
    });
    return rows.map(mapMessage);
  }

  async listMessagesForPair(clientEmail: string, creatorLegacyId: string) {
    const inquiries = await this.listForPair(clientEmail, creatorLegacyId);
    const inquiryIds = inquiries.map((item) => item.id);
    if (!inquiryIds.length) return [];

    const rows = await prisma.proposalInquiryMessage.findMany({
      where: { inquiryId: { in: inquiryIds } },
      orderBy: { createdAt: "asc" }
    });
    return rows.map(mapMessage);
  }

  async addMessage(input: {
    inquiryId: string;
    sender: StoredMessage["sender"];
    body: string;
    kind?: StoredMessage["kind"];
    attachmentUrl?: string | null;
  }) {
    const row = await prisma.proposalInquiryMessage.create({
      data: {
        id: createId("msg"),
        inquiryId: input.inquiryId,
        sender: input.sender,
        body: input.body,
        kind: input.kind ?? "text",
        attachmentUrl: input.attachmentUrl ?? null
      }
    });
    return mapMessage(row);
  }

  async reassignMessages(fromInquiryId: string, toInquiryId: string) {
    await prisma.proposalInquiryMessage.updateMany({
      where: { inquiryId: fromInquiryId },
      data: { inquiryId: toInquiryId }
    });
  }
}

export const proposalInquiryRepository = new ProposalInquiryRepository();
