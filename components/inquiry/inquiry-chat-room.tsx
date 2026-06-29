"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatSender, StoredMessage } from "@/lib/chat-types";
import type { Locale } from "@/lib/i18n";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    placeholderBrand: "Message the creator about scope, timing, or budget...",
    placeholderCreator: "Reply with quote, timeline, or questions...",
    send: "Send",
    you: "You",
    brand: "Brand",
    creator: "Creator",
    system: "AdBridge",
    syncing: "Live chat",
    error: "Could not send. Try again."
  },
  zh: {
    placeholderBrand: "给创作者发送范围、周期或预算相关消息...",
    placeholderCreator: "回复报价、交付周期或补充问题...",
    send: "发送",
    you: "你",
    brand: "品牌方",
    creator: "创作者",
    system: "AdBridge",
    syncing: "实时聊天",
    error: "发送失败，请重试。"
  }
};

export function InquiryChatRoom({
  locale,
  inquiryId,
  creator,
  viewerRole,
  clientName,
  initialMessages
}: {
  locale: Locale;
  inquiryId: string;
  creator: Creator;
  viewerRole: "brand" | "creator";
  clientName: string;
  initialMessages: StoredMessage[];
}) {
  const t = copy[locale];
  const [messages, setMessages] = useState<StoredMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestAtRef = useRef(initialMessages.at(-1)?.created_at ?? "");

  const syncMessages = useCallback(async () => {
    const query = latestAtRef.current ? `?after=${encodeURIComponent(latestAtRef.current)}` : "";
    const response = await fetch(`/api/inquiries/${inquiryId}/messages${query}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { messages: StoredMessage[] };
    if (!data.messages.length) {
      return;
    }

    setMessages((current) => {
      const byId = new Map(current.map((item) => [item.id, item]));
      for (const item of data.messages) {
        byId.set(item.id, item);
      }
      const merged = [...byId.values()].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      latestAtRef.current = merged.at(-1)?.created_at ?? latestAtRef.current;
      return merged;
    });
  }, [inquiryId]);

  useEffect(() => {
    latestAtRef.current = initialMessages.at(-1)?.created_at ?? "";
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void syncMessages();
    }, 2000);

    return () => window.clearInterval(timer);
  }, [syncMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) {
      return;
    }

    setSending(true);
    setError(null);

    const sender: ChatSender = viewerRole;

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, sender })
      });

      if (!response.ok) {
        setError(t.error);
        return;
      }

      const data = (await response.json()) as { message: StoredMessage };
      setMessages((current) => {
        const next = [...current, data.message];
        latestAtRef.current = data.message.created_at;
        return next;
      });
      setDraft("");
    } catch {
      setError(t.error);
    } finally {
      setSending(false);
    }
  }

  function labelFor(message: StoredMessage) {
    if (message.sender === "system") {
      return t.system;
    }
    if (message.sender === "creator") {
      return creator.name || t.creator;
    }
    if (viewerRole === "brand") {
      return t.you;
    }
    return clientName || t.brand;
  }

  function isOwnMessage(message: StoredMessage) {
    return message.sender === viewerRole;
  }

  return (
    <div className="flex h-[min(72vh,720px)] flex-col overflow-hidden rounded-xl border bg-white shadow-luxe">
      <div className="border-b px-4 py-2 text-xs font-medium text-emerald-700">{t.syncing}</div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              isOwnMessage(message) ? "justify-end" : "justify-start",
              message.sender === "system" && "justify-center"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
                message.sender === "system" && "bg-amber-50 text-amber-950",
                message.sender !== "system" &&
                  (isOwnMessage(message)
                    ? "bg-primary text-primary-foreground"
                    : "border bg-muted/40 text-foreground")
              )}
            >
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">
                {labelFor(message)}
              </div>
              {message.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="px-4 pb-2 text-sm text-destructive">{error}</p> : null}

      <form onSubmit={handleSend} className="flex gap-2 border-t bg-background p-4">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={viewerRole === "creator" ? t.placeholderCreator : t.placeholderBrand}
          className="h-11"
          disabled={sending}
        />
        <Button type="submit" className="h-11 shrink-0 px-4" disabled={sending}>
          <Send className="h-4 w-4" /> {t.send}
        </Button>
      </form>
    </div>
  );
}
