import type { Locale } from "@/lib/i18n";

export type ChatMessage = {
  id: string;
  sender: "brand" | "creator" | "system";
  body: string;
  created_at: string;
};

export type InquiryThread = {
  id: string;
  creator_id: string;
  work_id: string | null;
  client_name: string;
  client_email: string;
  company_name: string;
  budget_range: string;
  message: string;
};

export function chatStorageKey(inquiryId: string) {
  return `studioos:chat:${inquiryId}`;
}

export function readChatMessages(inquiryId: string): ChatMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(chatStorageKey(inquiryId));
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

export function writeChatMessages(inquiryId: string, messages: ChatMessage[]) {
  window.localStorage.setItem(chatStorageKey(inquiryId), JSON.stringify(messages));
}

export function seedChatMessages(thread: InquiryThread, locale: Locale): ChatMessage[] {
  return [
    {
      id: `${thread.id}_seed_brand`,
      sender: "brand",
      body: thread.message,
      created_at: new Date().toISOString()
    },
    {
      id: `${thread.id}_seed_system`,
      sender: "system",
      body:
        locale === "zh"
          ? "询价已发送。你可以在这里和创作者继续沟通报价、周期和交付细节。"
          : "Inquiry sent. Continue the quote conversation here with the creator.",
      created_at: new Date().toISOString()
    }
  ];
}

export function createChatMessage(sender: ChatMessage["sender"], body: string): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    sender,
    body,
    created_at: new Date().toISOString()
  };
}
