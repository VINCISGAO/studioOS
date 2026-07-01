import { inquiries as seedInquiries } from "@/lib/data";
import type { ChatSender, ChatStore, CreateInquiryInput, MessageKind, StoredInquiry, StoredMessage } from "@/lib/chat-types";
import { getActiveQuoteForPair, getOrderForPair, reassignQuotesToInquiry } from "@/lib/order-service";
import { allowOffPlatformContacts, isProposalChatLocked } from "@/lib/studioos/project-contract";
import { contactFilterNotice, filterContactInfo } from "@/lib/studioos/contact-filter";
import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store-core";

const STORE_PATH = dataStorePath("chat-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function seedStore(): ChatStore {
  const inquiries: StoredInquiry[] = seedInquiries.map((item) => ({
    id: item.id,
    creator_id: item.creator_id,
    work_id: item.work_id,
    client_name: item.client_name,
    client_email: item.client_email,
    company_name: item.company_name,
    budget_range: item.budget_range,
    message: item.message,
    status: item.status,
    created_at: item.created_at
  }));

  const messages: StoredMessage[] = seedInquiries.flatMap((item) => [
    {
      id: `${item.id}_m1`,
      inquiry_id: item.id,
      sender: "brand" as const,
      body: item.message,
      created_at: item.created_at
    },
    {
      id: `${item.id}_m2`,
      inquiry_id: item.id,
      sender: "system" as const,
      body: "Inquiry received. Both sides can reply in this thread.",
      created_at: item.created_at
    }
  ]);

  return { inquiries, messages };
}

async function readStore(): Promise<ChatStore> {
  return readDataJson(STORE_PATH, seedStore);
}

async function writeStore(store: ChatStore) {
  await writeDataJson(STORE_PATH, store);
}

export async function createInquiry(input: CreateInquiryInput): Promise<StoredInquiry> {
  let store: ChatStore;
  try {
    store = await readStore();
  } catch {
    store = seedStore();
  }

  const inquiry: StoredInquiry = {
    id: createId("inq"),
    creator_id: input.creator_id,
    work_id: input.work_id ?? null,
    project_id: input.project_id ?? null,
    client_name: input.client_name,
    client_email: input.client_email.toLowerCase(),
    company_name: input.company_name ?? "",
    budget_range: input.budget_range ?? "",
    message: input.message,
    status: "new",
    created_at: new Date().toISOString()
  };

  store.inquiries.unshift(inquiry);
  store.messages.push(
    {
      id: createId("msg"),
      inquiry_id: inquiry.id,
      sender: "brand",
      body: input.message,
      created_at: inquiry.created_at
    },
    {
      id: createId("msg"),
      inquiry_id: inquiry.id,
      sender: "system",
      body: "Proposal Room opened. All messages are saved on-platform for contract and dispute records.",
      created_at: new Date().toISOString()
    }
  );

  await writeStore(store);
  return inquiry;
}

export async function findOpenInquiryForPair(
  clientEmail: string,
  creatorId: string
): Promise<StoredInquiry | null> {
  const store = await readStore();
  const normalized = clientEmail.toLowerCase();

  return (
    store.inquiries
      .filter(
        (item) =>
          item.client_email.toLowerCase() === normalized &&
          item.creator_id === creatorId &&
          !["converted", "closed"].includes(item.status)
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
  );
}

export async function getOrCreateOpenInquiry(
  input: CreateInquiryInput
): Promise<{ inquiry: StoredInquiry; created: boolean }> {
  const existing = await findOpenInquiryForPair(input.client_email, input.creator_id);
  if (existing) {
    const store = await readStore();
    const inquiry = store.inquiries.find((item) => item.id === existing.id);
    if (!inquiry) {
      return { inquiry: existing, created: false };
    }

    if (input.budget_range?.trim()) {
      inquiry.budget_range = input.budget_range.trim();
    }
    if (input.work_id) {
      inquiry.work_id = input.work_id;
    }

    const now = new Date().toISOString();
    store.messages.push(
      {
        id: createId("msg"),
        inquiry_id: inquiry.id,
        sender: "brand",
        body: input.message,
        created_at: now
      },
      {
        id: createId("msg"),
        inquiry_id: inquiry.id,
        sender: "system",
        body: "Additional requirements added to this inquiry thread.",
        created_at: now
      }
    );

    await writeStore(store);
    return { inquiry, created: false };
  }

  const inquiry = await createInquiry(input);
  return { inquiry, created: true };
}

export async function getInquiry(id: string): Promise<StoredInquiry | null> {
  const store = await readStore();
  return store.inquiries.find((item) => item.id === id) ?? null;
}

export async function listInquiriesForCreator(creatorId: string): Promise<StoredInquiry[]> {
  const store = await readStore();
  return store.inquiries
    .filter((item) => item.creator_id === creatorId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function listInquiriesForClient(clientEmail: string): Promise<StoredInquiry[]> {
  const normalized = clientEmail.toLowerCase();
  const store = await readStore();
  return store.inquiries
    .filter((item) => item.client_email.toLowerCase() === normalized)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function listInquiriesForPair(
  clientEmail: string,
  creatorId: string
): Promise<StoredInquiry[]> {
  const normalized = clientEmail.toLowerCase();
  const store = await readStore();
  return store.inquiries
    .filter(
      (item) =>
        item.client_email.toLowerCase() === normalized && item.creator_id === creatorId
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getMessagesForPair(
  clientEmail: string,
  creatorId: string
): Promise<StoredMessage[]> {
  const store = await readStore();
  const inquiryIds = new Set(
    (await listInquiriesForPair(clientEmail, creatorId)).map((item) => item.id)
  );

  return store.messages
    .filter((item) => inquiryIds.has(item.inquiry_id))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function resolveCanonicalInquiry(
  clientEmail: string,
  creatorId: string
): Promise<StoredInquiry | null> {
  const threads = await listInquiriesForPair(clientEmail, creatorId);
  if (!threads.length) {
    return null;
  }

  const quote = await getActiveQuoteForPair(clientEmail, creatorId);
  if (quote) {
    return threads.find((item) => item.id === quote.inquiry_id) ?? threads[0];
  }

  const order = await getOrderForPair(clientEmail, creatorId);
  if (order) {
    return threads.find((item) => item.id === order.inquiry_id) ?? threads[0];
  }

  const store = await readStore();
  let best = threads[0];
  let bestTime = 0;

  for (const thread of threads) {
    const messages = store.messages.filter((item) => item.inquiry_id === thread.id);
    const latestAt = messages.at(-1)?.created_at ?? thread.created_at;
    const time = new Date(latestAt).getTime();
    if (time >= bestTime) {
      bestTime = time;
      best = thread;
    }
  }

  return best;
}

export async function consolidateInquiryThreads(
  clientEmail: string,
  creatorId: string
): Promise<StoredInquiry | null> {
  const threads = await listInquiriesForPair(clientEmail, creatorId);
  if (!threads.length) {
    return null;
  }

  const canonical = (await resolveCanonicalInquiry(clientEmail, creatorId)) ?? threads[0];
  if (threads.length === 1) {
    return canonical;
  }

  const store = await readStore();
  let changed = false;

  for (const thread of threads) {
    if (thread.id === canonical.id) {
      continue;
    }

    for (const message of store.messages) {
      if (message.inquiry_id === thread.id) {
        message.inquiry_id = canonical.id;
        changed = true;
      }
    }

    if (thread.status !== "converted") {
      thread.status = "closed";
      changed = true;
    }
  }

  if (changed) {
    await writeStore(store);
  }

  await reassignQuotesToInquiry(clientEmail, creatorId, canonical.id);
  return canonical;
}

export type GroupedClientInquiry = {
  creator_id: string;
  primary: StoredInquiry;
  thread_count: number;
  status: StoredInquiry["status"];
  latest_message: StoredMessage | null;
};

const INQUIRY_STATUS_RANK: Record<StoredInquiry["status"], number> = {
  escrow_pending: 0,
  quoted: 1,
  new: 2,
  converted: 3,
  closed: 4
};

export async function groupInquiriesByCreator(inquiries: StoredInquiry[]): Promise<GroupedClientInquiry[]> {
  const byCreator = new Map<string, StoredInquiry[]>();

  for (const inquiry of inquiries) {
    const list = byCreator.get(inquiry.creator_id) ?? [];
    list.push(inquiry);
    byCreator.set(inquiry.creator_id, list);
  }

  const groups = await Promise.all(
    [...byCreator.entries()].map(async ([creatorId, threads]) => {
      const sorted = [...threads].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const clientEmail = sorted[0]?.client_email ?? "";
      await consolidateInquiryThreads(clientEmail, creatorId);
      const primary = (await resolveCanonicalInquiry(clientEmail, creatorId)) ?? sorted[0];
      const quote = await getActiveQuoteForPair(clientEmail, creatorId);
      const openThreads = sorted.filter((item) => !["converted", "closed"].includes(item.status));

      const latest_message =
        (await getMessagesForPair(clientEmail, creatorId))
          .filter((item) => item.sender !== "system")
          .at(-1) ?? null;

      const status = quote
        ? "quoted"
        : [...(openThreads.length ? openThreads : sorted)].sort(
            (a, b) => INQUIRY_STATUS_RANK[a.status] - INQUIRY_STATUS_RANK[b.status]
          )[0].status;

      return {
        creator_id: creatorId,
        primary,
        thread_count: threads.length,
        status,
        latest_message
      };
    })
  );

  return groups.sort(
    (a, b) => new Date(b.primary.created_at).getTime() - new Date(a.primary.created_at).getTime()
  );
}

export type GroupedCreatorInquiry = {
  client_email: string;
  primary: StoredInquiry;
  thread_count: number;
  status: StoredInquiry["status"];
  latest_message: StoredMessage | null;
};

export async function groupInquiriesForCreator(
  inquiries: StoredInquiry[]
): Promise<GroupedCreatorInquiry[]> {
  const byClient = new Map<string, StoredInquiry[]>();

  for (const inquiry of inquiries) {
    const key = inquiry.client_email.toLowerCase();
    const list = byClient.get(key) ?? [];
    list.push(inquiry);
    byClient.set(key, list);
  }

  const groups = await Promise.all(
    [...byClient.entries()].map(async ([clientEmail, threads]) => {
      const creatorId = threads[0]?.creator_id ?? "";
      const primary = (await resolveCanonicalInquiry(clientEmail, creatorId)) ?? threads[0];
      const openThreads = threads.filter((item) => !["converted", "closed"].includes(item.status));
      const latest_message =
        (await getMessagesForPair(clientEmail, creatorId))
          .filter((item) => item.sender !== "system")
          .at(-1) ?? null;
      const statusPool = openThreads.length ? openThreads : threads;
      const status = [...statusPool].sort(
        (a, b) => INQUIRY_STATUS_RANK[a.status] - INQUIRY_STATUS_RANK[b.status]
      )[0].status;

      return {
        client_email: clientEmail,
        primary,
        thread_count: threads.length,
        status,
        latest_message
      };
    })
  );

  return groups.sort(
    (a, b) =>
      new Date(b.latest_message?.created_at ?? b.primary.created_at).getTime() -
      new Date(a.latest_message?.created_at ?? a.primary.created_at).getTime()
  );
}

export async function getLatestMessage(inquiryId: string): Promise<StoredMessage | null> {
  const store = await readStore();
  const messages = store.messages
    .filter((item) => item.inquiry_id === inquiryId && item.sender !== "system")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return messages[0] ?? null;
}

export async function getMessages(inquiryId: string, after?: string): Promise<StoredMessage[]> {
  const store = await readStore();
  const rows = store.messages
    .filter((item) => item.inquiry_id === inquiryId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (!after) {
    return rows;
  }

  const afterTime = new Date(after).getTime();
  return rows.filter((item) => new Date(item.created_at).getTime() > afterTime);
}

export async function addMessage(
  inquiryId: string,
  sender: ChatSender,
  body: string,
  options?: { kind?: MessageKind; attachment_url?: string | null }
): Promise<StoredMessage | null> {
  const trimmed = body.trim();
  if (!trimmed || sender === "system") {
    return null;
  }

  const store = await readStore();
  const inquiry = store.inquiries.find((item) => item.id === inquiryId);
  if (!inquiry) {
    return null;
  }

  const order = await getOrderForPair(inquiry.client_email, inquiry.creator_id);
  if (isProposalChatLocked(order)) {
    return null;
  }

  const allowContacts = allowOffPlatformContacts(order);
  const filtered = filterContactInfo(trimmed, allowContacts);
  let finalBody = filtered.text;
  if (filtered.blocked) {
    finalBody += `\n\n— ${contactFilterNotice("en", filtered.reasons)}`;
  }

  const message: StoredMessage = {
    id: createId("msg"),
    inquiry_id: inquiryId,
    sender,
    body: finalBody,
    kind: options?.kind ?? "text",
    attachment_url: options?.attachment_url ?? null,
    contact_filtered: filtered.blocked,
    created_at: new Date().toISOString()
  };

  store.messages.push(message);

  if (sender === "creator" && inquiry.status === "new") {
    inquiry.status = "quoted";
  }

  await writeStore(store);
  return message;
}

export async function addPitchMessage(
  inquiryId: string,
  creatorId: string,
  videoUrl: string,
  caption: string
): Promise<StoredMessage | null> {
  const inquiry = await getInquiry(inquiryId);
  if (!inquiry || inquiry.creator_id !== creatorId) return null;

  const order = await getOrderForPair(inquiry.client_email, inquiry.creator_id);
  if (isProposalChatLocked(order)) return null;

  return addMessage(inquiryId, "creator", caption || "Live Pitch — 60s studio introduction", {
    kind: "pitch",
    attachment_url: videoUrl
  });
}

export async function addSystemMessage(inquiryId: string, body: string): Promise<StoredMessage | null> {
  const trimmed = body.trim();
  if (!trimmed) {
    return null;
  }

  const store = await readStore();
  const inquiry = store.inquiries.find((item) => item.id === inquiryId);
  if (!inquiry) {
    return null;
  }

  const message: StoredMessage = {
    id: createId("msg"),
    inquiry_id: inquiryId,
    sender: "system",
    body: trimmed,
    created_at: new Date().toISOString()
  };

  store.messages.push(message);
  await writeStore(store);
  return message;
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: StoredInquiry["status"]
): Promise<StoredInquiry | null> {
  const store = await readStore();
  const inquiry = store.inquiries.find((item) => item.id === inquiryId);
  if (!inquiry) {
    return null;
  }

  inquiry.status = status;
  await writeStore(store);
  return inquiry;
}

export function toInquiryThread(inquiry: StoredInquiry) {
  return {
    id: inquiry.id,
    creator_id: inquiry.creator_id,
    work_id: inquiry.work_id,
    client_name: inquiry.client_name,
    client_email: inquiry.client_email,
    company_name: inquiry.company_name,
    budget_range: inquiry.budget_range,
    message: inquiry.message
  };
}
