"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Send, Sparkles, X } from "lucide-react";
import { LucienAvatar } from "@/components/ai-copilot/lucien-avatar";
import { publicLucienCopy } from "@/lib/marketing/faq-copy";
import { publicLucienIdentityLabel } from "@/lib/marketing/public-lucien-identity";
import type { LucienViewerSnapshot } from "@/components/marketing/faq/lucien-viewer-identity.client";
import type { PublicLucienPagePath } from "@/lib/marketing/public-lucien-paths";
import { buildLocalizedHref } from "@/lib/marketing/localized-href";
import {
  installAuthLucienChatIdleGuard,
  readAuthLucienChat,
  readGuestLucienChat,
  syncLucienChatAuthUser,
  writeAuthLucienChat,
  writeGuestLucienChat,
  type LucienStoredMessage
} from "@/lib/lucien/lucien-chat-storage";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

type ChatLine = LucienStoredMessage;

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { message: string };
};

type AnswerData = {
  answer: string;
  suggestedQuestions: string[];
  modelConfigured?: boolean;
};

const GUEST_SESSION_KEY = "vincis-public-lucien-session";

function resolveGuestSessionId() {
  if (typeof window === "undefined") return null;
  let id = sessionStorage.getItem(GUEST_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(GUEST_SESSION_KEY, id);
  }
  return id;
}

type PublicLucienDrawerProps = {
  locale: Locale;
  open: boolean;
  onClose: () => void;
  pagePath: PublicLucienPagePath;
  viewer: LucienViewerSnapshot;
};

export function PublicLucienDrawer({
  locale,
  open,
  onClose,
  pagePath,
  viewer
}: PublicLucienDrawerProps) {
  const t = publicLucienCopy(locale);
  const { viewerIdentity, welcomeMessage, authUser } = viewer;
  const userId = authUser?.id ?? null;
  const isGuest = viewerIdentity === "guest";
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelConfigured, setModelConfigured] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState(t.suggestions);
  const listRef = useRef<HTMLDivElement>(null);
  const storageScopeRef = useRef<string | null>(null);

  const resetToWelcome = useCallback(() => {
    setMessages([{ id: "welcome", role: "ASSISTANT", content: welcomeMessage }]);
    setSuggestions(t.suggestions);
  }, [t.suggestions, welcomeMessage]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/public-lucien/status")
      .then((response) => response.json() as Promise<ApiResponse<{ modelConfigured: boolean }>>)
      .then((payload) => {
        if (payload.success && payload.data) {
          setModelConfigured(payload.data.modelConfigured);
        }
      })
      .catch(() => {
        setModelConfigured(null);
      });
  }, [open]);

  useEffect(() => {
    if (!open) {
      storageScopeRef.current = null;
      return;
    }

    const scope = isGuest ? "guest" : userId ?? "anonymous";
    if (storageScopeRef.current === scope) return;
    storageScopeRef.current = scope;

    syncLucienChatAuthUser(isGuest ? null : userId);

    const stored = isGuest
      ? readGuestLucienChat("public")
      : userId
        ? readAuthLucienChat(userId, "public")
        : null;

    if (stored?.messages.length) {
      setMessages(
        stored.messages.map((line) =>
          line.id === "welcome" ? { ...line, content: welcomeMessage } : line
        )
      );
      if (stored.suggestions.length > 0) {
        setSuggestions(stored.suggestions);
      } else {
        setSuggestions(t.suggestions);
      }
      return;
    }

    resetToWelcome();
  }, [isGuest, open, resetToWelcome, t.suggestions, userId, welcomeMessage]);

  useEffect(() => {
    if (!open || !userId || isGuest) return;
    return installAuthLucienChatIdleGuard(userId, "public", resetToWelcome);
  }, [isGuest, open, resetToWelcome, userId]);

  useEffect(() => {
    if (!open || messages.length === 0) return;

    const record = {
      messages,
      suggestions,
      lastActivityAt: Date.now()
    };

    if (isGuest) {
      writeGuestLucienChat("public", record);
      return;
    }
    if (userId) {
      writeAuthLucienChat(userId, "public", record);
    }
  }, [isGuest, messages, open, suggestions, userId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [loading, messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    const userLineId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: userLineId, role: "USER", content: trimmed }]);
    setLoading(true);

    try {
      const languageCode = locale === "zh" ? "zh-CN" : "en";
      const response = await fetch("/api/public-lucien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          languageCode,
          guestSessionId: resolveGuestSessionId(),
          pagePath
        })
      });
      const payload = (await response.json()) as ApiResponse<AnswerData>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? t.requestFailed);
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ASSISTANT", content: payload.data!.answer }
      ]);
      if (payload.data.suggestedQuestions.length > 0) {
        setSuggestions(payload.data.suggestedQuestions);
      }
      if (typeof payload.data.modelConfigured === "boolean") {
        setModelConfigured(payload.data.modelConfigured);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ASSISTANT", content: t.unavailable }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[1px]"
        aria-label={t.close}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-lucien-title"
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:rounded-l-[1.75rem]"
      >
        <header className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
          <LucienAvatar size="md" />
          <div className="min-w-0 flex-1">
            <p id="public-lucien-title" className="text-base font-semibold text-zinc-950">
              {locale === "zh" ? "卢西恩" : "Lucien"}
            </p>
            <p className="text-xs text-zinc-500">
              {publicLucienIdentityLabel(locale, viewerIdentity)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            aria-label={t.close}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </header>

        {modelConfigured === false ? (
          <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs leading-5 text-amber-900">
            {locale === "zh"
              ? "语言模型未连接 · 可回答 FAQ 常见问题"
              : "Language model offline · FAQ answers still work"}
          </p>
        ) : null}

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((line) => (
            <div
              key={line.id}
              className={cn("flex", line.role === "USER" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6",
                  line.role === "USER"
                    ? "bg-violet-600 text-white"
                    : "border border-zinc-200/80 bg-zinc-50 text-zinc-800"
                )}
              >
                {line.content}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.loading}
            </div>
          ) : null}
        </div>

        {suggestions.length > 0 && !loading ? (
          <div className="border-t border-zinc-100 px-5 py-3">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  className="rounded-full border border-violet-100 bg-violet-50/70 px-3 py-1.5 text-left text-xs font-medium text-violet-800 transition hover:border-violet-200 hover:bg-violet-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="border-t border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 shadow-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-violet-500" strokeWidth={1.75} />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.inputPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t.inputPlaceholder}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
          {viewerIdentity === "guest" ? (
            <>
              <p className="mt-3 text-xs leading-5 text-zinc-500">{t.loginHint}</p>
              <Link
                href={buildLocalizedHref("/login", locale)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-700 transition hover:text-violet-800"
              >
                {t.loginLabel}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </>
          ) : null}
        </form>
      </div>
    </div>
  );
}
