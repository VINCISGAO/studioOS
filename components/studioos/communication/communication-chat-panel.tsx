"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Globe, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Todo = { id: string; text: string; done: boolean };

type CommMessage = {
  id: string;
  senderId: string;
  displayContent: string;
  originalContent?: string;
  summary?: string | null;
  todos?: Todo[];
  language?: { code: string; label: string; flag: string; confidence: number | null };
  autoLocalized?: boolean;
  translationUnavailable?: boolean;
  createdAt: string;
  sender?: { name: string; email: string };
};

type Props = {
  campaignId: string;
  currentUserId: string;
  locale?: "en" | "zh";
  className?: string;
};

const copy = {
  en: {
    title: "Messages",
    placeholder: "Write a message…",
    send: "Send",
    autoLocalized: "Auto Localized",
    viewOriginal: "View Original",
    hideOriginal: "Hide Original",
    summary: "Summary",
    todo: "Todo",
    unavailable: "Translation temporarily unavailable — showing original.",
    empty: "No messages yet. Say hello to your partner."
  },
  zh: {
    title: "消息",
    placeholder: "输入消息…",
    send: "发送",
    autoLocalized: "已自动本地化",
    viewOriginal: "查看原文",
    hideOriginal: "隐藏原文",
    summary: "摘要",
    todo: "待办",
    unavailable: "翻译暂时不可用 — 显示原文。",
    empty: "暂无消息，向合作方打个招呼吧。"
  }
};

export function CommunicationChatPanel({ campaignId, currentUserId, locale = "en", className }: Props) {
  const t = copy[locale];
  const [messages, setMessages] = useState<CommMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedOriginal, setExpandedOriginal] = useState<Record<string, boolean>>({});
  const [expandedSummary, setExpandedSummary] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/v1/campaigns/${campaignId}/messages`, { credentials: "include" });
    if (!res.ok) return;
    const json = (await res.json()) as { success?: boolean; data?: { messages?: CommMessage[] } };
    if (json.success && json.data?.messages) {
      setMessages(json.data.messages);
    }
  }, [campaignId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    let since = new Date().toISOString();
    const source = new EventSource(
      `/api/v1/campaigns/${campaignId}/communication/stream?since=${encodeURIComponent(since)}`
    );

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          messages?: CommMessage[];
        };
        if (payload.type === "MessageTranslated" && payload.messages?.length) {
          setMessages((prev) => {
            const map = new Map(prev.map((m) => [m.id, m]));
            for (const m of payload.messages!) map.set(m.id, m);
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
          since = payload.messages[payload.messages.length - 1]!.createdAt;
        }
      } catch {
        // ignore malformed SSE payloads
      }
    };

    return () => source.close();
  }, [campaignId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const onSend = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/v1/campaigns/${campaignId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        setDraft("");
        await loadMessages();
      }
    } finally {
      setSending(false);
    }
  };

  const toggleTodo = async (messageId: string, todoId: string, done: boolean) => {
    await fetch(`/api/v1/messages/${messageId}/todos`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todo_id: todoId, done })
    });
    await loadMessages();
  };

  const sorted = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  return (
    <div className={cn("flex h-full min-h-[420px] flex-col rounded-xl border bg-card", className)}>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">{t.title}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{t.autoLocalized}</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!sorted.length ? (
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          sorted.map((msg) => {
            const mine = msg.senderId === currentUserId;
            const showOriginal = expandedOriginal[msg.id];
            return (
              <div
                key={msg.id}
                className={cn("rounded-lg border p-3", mine ? "ml-8 bg-primary/5" : "mr-8 bg-muted/30")}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{msg.sender?.name ?? "User"}</span>
                  {msg.language ? (
                    <span>
                      {msg.language.flag} {msg.language.label}
                    </span>
                  ) : null}
                  {msg.autoLocalized ? (
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-700">✓ {t.autoLocalized}</span>
                  ) : null}
                </div>

                <p className="whitespace-pre-wrap text-sm">{msg.displayContent}</p>

                {msg.translationUnavailable ? (
                  <p className="mt-2 text-xs text-amber-700">{t.unavailable}</p>
                ) : null}

                {msg.originalContent ? (
                  <button
                    type="button"
                    className="mt-2 flex items-center gap-1 text-xs text-primary"
                    onClick={() =>
                      setExpandedOriginal((s) => ({ ...s, [msg.id]: !s[msg.id] }))
                    }
                  >
                    {showOriginal ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {showOriginal ? t.hideOriginal : t.viewOriginal}
                  </button>
                ) : null}

                {showOriginal && msg.originalContent ? (
                  <p className="mt-2 rounded bg-background/80 p-2 text-xs text-muted-foreground">{msg.originalContent}</p>
                ) : null}

                {msg.summary ? (
                  <div className="mt-3 rounded border bg-background/60 p-2">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-xs font-medium"
                      onClick={() =>
                        setExpandedSummary((s) => ({ ...s, [msg.id]: !s[msg.id] }))
                      }
                    >
                      {t.summary}
                      {expandedSummary[msg.id] ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                    {(expandedSummary[msg.id] ?? true) ? (
                      <pre className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{msg.summary}</pre>
                    ) : null}
                  </div>
                ) : null}

                {msg.todos?.length ? (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium">{t.todo}</p>
                    {msg.todos.map((todo) => (
                      <label key={todo.id} className="flex cursor-pointer items-start gap-2 text-xs">
                        <button
                          type="button"
                          className={cn(
                            "mt-0.5 flex h-4 w-4 items-center justify-center rounded border",
                            todo.done && "border-emerald-600 bg-emerald-600 text-white"
                          )}
                          onClick={() => void toggleTodo(msg.id, todo.id, !todo.done)}
                        >
                          {todo.done ? <Check className="h-3 w-3" /> : null}
                        </button>
                        <span className={cn(todo.done && "line-through text-muted-foreground")}>{todo.text}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.placeholder}
          rows={2}
          className="min-h-[44px] flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
        />
        <Button type="button" size="icon" disabled={sending || !draft.trim()} onClick={() => void onSend()}>
          <Send className="h-4 w-4" />
          <span className="sr-only">{t.send}</span>
        </Button>
      </div>
    </div>
  );
}
