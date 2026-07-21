"use client";

import { useEffect, useState } from "react";
import { MessageSquarePlus, PanelRightClose } from "lucide-react";
import { LucienAvatar } from "@/components/ai-copilot/lucien-avatar";
import { CanvasChatFeedback } from "@/components/canvas/canvas-chat-feedback";
import { CanvasChatInput } from "@/components/canvas/canvas-chat-input";
import { CanvasChatImageBlock } from "@/components/canvas/canvas-chat-image-block";
import { CanvasChatSkills } from "@/components/canvas/canvas-chat-skills";
import { useCanvasChatReference } from "@/components/canvas/hooks/use-canvas-chat-reference";
import { useCanvasChatHistory } from "@/components/canvas/hooks/use-canvas-chat-history";
import { CANVAS_SEND_TO_CHAT_EVENT } from "@/lib/canvas/canvas-chat-bridge";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

type ChatResponse = {
  sessionId: string;
  messageId: string;
  answer: string;
  answerMode: string;
  modelConfigured: boolean;
  participants: readonly ["gpt", "lucien_learning"];
  imageUrl?: string;
  assetId?: string;
};

export function CanvasChatPanel({
  locale,
  projectId,
  collapsed,
  onToggle
}: {
  locale: Locale;
  projectId: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatReference = useCanvasChatReference(projectId);
  const history = useCanvasChatHistory(projectId, !collapsed);

  useEffect(() => {
    const onSendToChat = (event: Event) => {
      const detail = (event as CustomEvent<{
        assetId: string;
        url: string;
        fileName: string;
      }>).detail;
      if (!detail?.assetId || !detail.url) return;
      chatReference.setReferenceFromCanvas(detail);
    };
    window.addEventListener(CANVAS_SEND_TO_CHAT_EVENT, onSendToChat);
    return () => window.removeEventListener(CANVAS_SEND_TO_CHAT_EVENT, onSendToChat);
  }, [chatReference.setReferenceFromCanvas]);

  function updateMessageFeedback(
    messageId: string,
    feedback: { rating: "HELPFUL" | "NOT_HELPFUL"; createdAt?: string }
  ) {
    history.setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, feedback } : message
      )
    );
  }

  async function sendMessage() {
    const message = draft.trim();
    const reference = chatReference.reference;
    if ((!message && !reference) || busy || chatReference.uploading) return;

    const userMessage = {
      id: `user_${crypto.randomUUID()}`,
      role: "user" as const,
      content:
        message ||
        (locale === "zh" ? "根据参考图生成图片" : "Generate image from reference"),
      referenceImageUrl: reference?.url
    };
    history.setMessages((current) => [...current, userMessage]);
    setDraft("");
    chatReference.clearReference();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/canvas/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message,
          referenceAssetId: reference?.assetId ?? null,
          sessionId: history.sessionId,
          languageCode: locale === "zh" ? "zh-CN" : "en"
        })
      });
      const payload = (await response.json()) as ApiEnvelope<ChatResponse>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Chat request failed");
      }
      const data = payload.data;

      history.setSessionId(data.sessionId);
      history.setMessages((current) => [
        ...current,
        {
          id: data.messageId,
          role: "assistant",
          content: data.answer,
          answerMode: data.answerMode,
          imageUrl: data.imageUrl,
          assetId: data.assetId,
          feedback: null
        }
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Chat request failed");
    } finally {
      setBusy(false);
    }
  }

  if (collapsed) {
    return (
      <div className="absolute right-3 top-12 z-40" data-canvas-chat-root>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-lg"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {locale === "zh" ? "AI 对话" : "AI Chat"}
        </button>
      </div>
    );
  }

  const hasHistory = history.messages.length > 0;

  return (
    <aside
      data-canvas-chat-root
      className="relative z-40 flex h-full w-[390px] max-w-[42vw] shrink-0 flex-col border-l border-zinc-200 bg-white max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:max-w-[88vw]"
    >
      <div className="border-b border-zinc-100 px-4 py-3">
        <div className="flex h-8 items-center justify-between">
          <div className="text-sm font-semibold text-zinc-950">
            {hasHistory
              ? locale === "zh"
                ? "继续对话"
                : "Continue chat"
              : locale === "zh"
                ? "新对话"
                : "New chat"}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              aria-label={locale === "zh" ? "收起" : "Collapse"}
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-1 text-[10px] text-zinc-400">
          {locale === "zh"
            ? `对话记忆保留 ${history.memoryHours} 小时，刷新页面后仍可继续。`
            : `Chat memory lasts ${history.memoryHours} hours and persists after refresh.`}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {history.loading ? (
          <div className="px-4 py-6 text-sm text-zinc-500">
            {locale === "zh" ? "正在恢复对话记录…" : "Restoring chat history…"}
          </div>
        ) : !hasHistory ? (
          <CanvasChatSkills locale={locale} onSelect={(prompt) => setDraft(prompt)} />
        ) : (
          <div className="space-y-4 px-4 py-4">
            {history.messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" ? (
                  <LucienAvatar className="mt-0.5 h-7 w-7 shrink-0" />
                ) : null}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                    message.role === "user"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-100"
                  )}
                >
                  {message.referenceImageUrl ? (
                    <img
                      src={message.referenceImageUrl}
                      alt={locale === "zh" ? "参考图" : "Reference"}
                      className="mb-2 max-h-40 w-full rounded-xl object-cover ring-1 ring-white/20"
                    />
                  ) : null}
                  <div className="select-text whitespace-pre-wrap">{message.content}</div>
                  {message.imageUrl ? (
                    <CanvasChatImageBlock
                      locale={locale}
                      imageUrl={message.imageUrl}
                      assetId={message.assetId}
                    />
                  ) : null}
                  {message.role === "assistant" ? (
                    <CanvasChatFeedback
                      locale={locale}
                      projectId={projectId}
                      messageId={message.id}
                      feedback={message.feedback}
                      onFeedback={updateMessageFeedback}
                    />
                  ) : null}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start gap-3">
                <LucienAvatar className="mt-0.5 h-7 w-7 shrink-0" />
                <div className="rounded-2xl bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-500 ring-1 ring-zinc-100">
                  {locale === "zh" ? "卢西恩正在思考" : "Lucien is thinking"}
                </div>
              </div>
            ) : null}
          </div>
        )}
        {error || chatReference.error || history.error ? (
          <p className="px-4 pb-3 text-xs text-rose-600">
            {error ?? chatReference.error ?? history.error}
          </p>
        ) : null}
      </div>

      <CanvasChatInput
        locale={locale}
        value={draft}
        busy={busy}
        reference={chatReference.reference}
        uploadingReference={chatReference.uploading}
        onChange={setDraft}
        onReferenceFileSelected={chatReference.handleFile}
        onClearReference={chatReference.clearReference}
        onSubmit={() => void sendMessage()}
      />
    </aside>
  );
}
