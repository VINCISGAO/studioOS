"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreatorMessageIdentity } from "@/components/studioos/certification/creator-message-identity";
import type { ChatSender, StoredMessage } from "@/lib/chat-types";
import type { Locale } from "@/lib/i18n";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    placeholderBrand: "Discuss scope, timeline, or budget — stays on platform...",
    placeholderStudio: "Reply with proposal details, questions, or Live Pitch link...",
    send: "Send",
    you: "You",
    brand: "Brand",
    studio: "Studio",
    system: "StudioOS",
    syncing: "Proposal Room · saved on platform",
    locked: "Proposal chat locked. Production uses Timeline Review only.",
    error: "Could not send. Try again.",
    pitch: "Live Pitch",
    reference: "Reference",
    filtered: "Contact info filtered until payment"
  },
  zh: {
    placeholderBrand: "讨论方案、周期或预算 — 全部保存在平台内...",
    placeholderStudio: "回复方案细节、问题，或发送 Live Pitch 链接...",
    send: "发送",
    you: "你",
    brand: "Brand",
    studio: "Studio",
    system: "StudioOS",
    syncing: "Proposal Room · 平台存档",
    locked: "Proposal 聊天已锁定。制作阶段请使用时间轴审片。",
    error: "发送失败，请重试。",
    pitch: "Live Pitch",
    reference: "参考素材",
    filtered: "联系方式已过滤，付款后可显示"
  }
};

export function ProposalChatRoom({
  locale,
  inquiryId,
  creator,
  viewerRole,
  clientName,
  initialMessages,
  locked
}: {
  locale: Locale;
  inquiryId: string;
  creator: Creator;
  viewerRole: "brand" | "studio";
  clientName: string;
  initialMessages: StoredMessage[];
  locked: boolean;
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
    const response = await fetch(`/api/inquiries/${inquiryId}/messages${query}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { messages: StoredMessage[] };
    if (!data.messages.length) return;
    setMessages((current) => {
      const byId = new Map(current.map((item) => [item.id, item]));
      for (const item of data.messages) byId.set(item.id, item);
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
    const timer = window.setInterval(() => void syncMessages(), 2000);
    return () => window.clearInterval(timer);
  }, [syncMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (locked || !draft.trim() || sending) return;

    setSending(true);
    setError(null);
    const sender: ChatSender = viewerRole === "studio" ? "creator" : "brand";

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim(), sender })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error === "locked" ? t.locked : t.error);
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
    if (message.sender === "system") return t.system;
    if (message.sender === "creator") return creator.name || t.studio;
    if (viewerRole === "brand") return t.you;
    return clientName || t.brand;
  }

  function isOwnMessage(message: StoredMessage) {
    if (message.sender === "system") return false;
    return viewerRole === "studio" ? message.sender === "creator" : message.sender === "brand";
  }

  return (
    <div className="flex h-[min(72vh,720px)] flex-col overflow-hidden rounded-xl border bg-white shadow-luxe">
      <div className="border-b px-4 py-2 text-xs font-medium text-emerald-700">
        {locked ? t.locked : t.syncing}
      </div>
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
              <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">
                {message.sender === "creator" ? (
                  <CreatorMessageIdentity
                    locale={locale}
                    creator={creator}
                    name={creator.name || t.studio}
                  />
                ) : (
                  labelFor(message)
                )}
                {message.kind === "pitch" ? (
                  <span className="inline-flex items-center gap-0.5 normal-case">
                    <Video className="h-3 w-3" /> {t.pitch}
                  </span>
                ) : null}
                {message.kind === "reference" ? <span className="normal-case">{t.reference}</span> : null}
              </div>
              <p className="whitespace-pre-wrap">{message.body}</p>
              {message.attachment_url ? (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block truncate text-xs underline opacity-90"
                >
                  {message.attachment_url}
                </a>
              ) : null}
              {message.contact_filtered ? (
                <p className="mt-2 text-[10px] opacity-70">{t.filtered}</p>
              ) : null}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="px-4 pb-2 text-sm text-destructive">{error}</p> : null}

      {!locked ? (
        <form onSubmit={handleSend} className="flex gap-2 border-t bg-background p-4">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={viewerRole === "studio" ? t.placeholderStudio : t.placeholderBrand}
            className="h-11"
            disabled={sending}
          />
          <Button type="submit" className="h-11 shrink-0 px-4" disabled={sending}>
            <Send className="h-4 w-4" /> {t.send}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
