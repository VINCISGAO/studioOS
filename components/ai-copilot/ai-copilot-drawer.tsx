"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ExternalLink, Loader2, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatLine = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

type SessionListData = {
  suggestedQuestions: string[];
};

type CopilotAnswerData = {
  sessionId: string;
  answer: string;
  suggestedQuestions: string[];
  toolCalls: Array<{ toolName: string; status: string }>;
};

type UiLocale = "zh" | "en";

const DRAWER_COPY: Record<UiLocale, {
  launcher: string;
  title: string;
  subtitle: string;
  rolePrefix: string;
  currentEntity: string;
  openWorkspace: string;
  openWorkspaceAria: string;
  introTitle: string;
  introBody: string;
  loading: string;
  inputPlaceholder: string;
  unavailable: string;
  requestFailed: string;
  defaultSuggestions: string[];
}> = {
  zh: {
    launcher: "AI助手",
    title: "StudioOS AI助手",
    subtitle: "查询、解释、建议、引导",
    rolePrefix: "角色",
    currentEntity: "当前",
    openWorkspace: "打开全屏 AI助手",
    openWorkspaceAria: "打开 AI助手工作区",
    introTitle: "我是 StudioOS 内置 AI助手。",
    introBody: "V1 只基于你有权限访问的真实数据做查询和解释，不会执行付款、删除、释放资金或修改订单状态。",
    loading: "正在读取 StudioOS 数据...",
    inputPlaceholder: "问 StudioOS AI助手...",
    unavailable: "AI助手暂时不可用，请稍后再试。",
    requestFailed: "AI助手请求失败",
    defaultSuggestions: ["我的项目现在到哪一步？", "下一步我应该做什么？", "我的预算合理吗？"]
  },
  en: {
    launcher: "AI Assistant",
    title: "StudioOS AI Assistant",
    subtitle: "Search, explain, suggest, and guide",
    rolePrefix: "Role",
    currentEntity: "current",
    openWorkspace: "Open full AI Assistant",
    openWorkspaceAria: "Open AI Assistant workspace",
    introTitle: "I am the built-in StudioOS AI Assistant.",
    introBody:
      "V1 only queries and explains data you are allowed to access. It will not make payments, delete data, release funds, or change order status.",
    loading: "Reading StudioOS data...",
    inputPlaceholder: "Ask StudioOS AI Assistant...",
    unavailable: "AI Assistant is temporarily unavailable. Please try again later.",
    requestFailed: "AI Assistant request failed",
    defaultSuggestions: ["Where is my project now?", "What should I do next?", "Is my budget reasonable?"]
  }
};

function inferPageContext(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const entityId = parts.at(-1);
  const entityType = parts.includes("projects")
    ? "campaign"
    : parts.includes("orders")
      ? "order"
      : parts.includes("review")
        ? "review"
        : parts.includes("attribution")
          ? "attribution"
          : null;

  return {
    pagePath: pathname,
    entityType,
    entityId: entityType && entityId && !["projects", "orders", "review", "attribution"].includes(entityId) ? entityId : null
  };
}

function contextLabel(pathname: string, locale: UiLocale) {
  if (pathname.startsWith("/brand")) return locale === "zh" ? "广告主" : "Brand";
  if (pathname.startsWith("/studio") || pathname.startsWith("/creator")) return locale === "zh" ? "创作者" : "Creator";
  if (pathname.startsWith("/admin")) return locale === "zh" ? "管理员" : "Admin";
  return "StudioOS";
}

function workspaceHref(pathname: string, searchParams: { get(name: string): string | null }) {
  const base = pathname.startsWith("/admin")
    ? "/admin/ai"
    : pathname.startsWith("/studio") || pathname.startsWith("/creator")
      ? "/studio/ai"
      : pathname.startsWith("/brand")
        ? "/brand/ai"
        : "/copilot";
  const lang = searchParams.get("lang");
  return lang ? `${base}?lang=${encodeURIComponent(lang)}` : base;
}

function languageFromSearch(searchParams: { get(name: string): string | null }) {
  const lang = searchParams.get("lang");
  if (lang === "zh") return "zh-CN";
  if (lang === "en") return "en";
  return lang ?? "zh-CN";
}

function localeFromSearch(searchParams: { get(name: string): string | null }): UiLocale {
  return searchParams.get("lang") === "en" ? "en" : "zh";
}

export function AiCopilotDrawer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = localeFromSearch(searchParams);
  const copy = DRAWER_COPY[locale];
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(copy.defaultSuggestions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const pageContext = useMemo(
    () => ({ ...inferPageContext(pathname), languageCode: languageFromSearch(searchParams) }),
    [pathname, searchParams]
  );
  const sessionsUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (pageContext.languageCode) params.set("languageCode", pageContext.languageCode);
    const query = params.toString();
    return query ? `/api/ai-copilot?${query}` : "/api/ai-copilot";
  }, [pageContext.languageCode]);
  const roleLabel = contextLabel(pathname, locale);
  const workspaceUrl = workspaceHref(pathname, searchParams);

  useEffect(() => {
    if (messages.length === 0) setSuggestions(copy.defaultSuggestions);
  }, [copy.defaultSuggestions, messages.length]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(sessionsUrl)
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as ApiResponse<SessionListData> | null;
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? copy.unavailable);
        }
        return payload;
      })
      .then((payload) => {
        if (cancelled || !payload.data) return;
        setSuggestions(payload.data.suggestedQuestions);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : copy.unavailable);
      });
    return () => {
      cancelled = true;
    };
  }, [copy.unavailable, open, sessionsUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setError(null);
    setLoading(true);
    setInput("");
    const userLine: ChatLine = { id: crypto.randomUUID(), role: "USER", content: trimmed };
    setMessages((current) => [...current, userLine]);

    try {
      const response = await fetch("/api/ai-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
          ...pageContext
        })
      });
      const payload = (await response.json().catch(() => null)) as ApiResponse<CopilotAnswerData> | null;
      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.error?.message ?? copy.requestFailed);
      }
      const data = payload.data;
      setSessionId(data.sessionId);
      setSuggestions(data.suggestedQuestions);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "ASSISTANT", content: data.answer }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.unavailable);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-5 right-5 z-50 h-12 rounded-full px-4 shadow-xl",
          "bg-slate-950 text-white hover:bg-slate-800"
        )}
      >
        <Sparkles className="h-5 w-5 fill-white" />
        {copy.launcher}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-[1px]">
          <aside className="flex h-full w-full max-w-[460px] flex-col border-l border-violet-100 bg-[#fbfbff] shadow-2xl">
            <header className="border-b border-violet-100 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-100">
                    <Sparkles className="h-5 w-5 fill-white" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-950">{copy.title}</p>
                    <p className="text-xs text-slate-500">{copy.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" asChild>
                    <a href={workspaceUrl} aria-label={copy.openWorkspaceAria}>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                  {copy.rolePrefix}: {roleLabel}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {pageContext.entityType ? `${pageContext.entityType}:${pageContext.entityId ?? copy.currentEntity}` : pathname}
                </span>
                <a
                  href={workspaceUrl}
                  className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white"
                >
                  {copy.openWorkspace}
                </a>
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfbff] p-5">
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-violet-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                  <p className="font-medium text-slate-950">{copy.introTitle}</p>
                  <p className="mt-2">{copy.introBody}</p>
                </div>
              ) : null}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.role === "USER" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[86%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed",
                      message.role === "USER"
                        ? "bg-slate-950 text-white"
                        : "border border-violet-100 bg-white text-slate-800 shadow-sm"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {copy.loading}
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-violet-100 bg-white p-4">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {suggestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => void sendMessage(question)}
                    className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
              <form onSubmit={submit} className="flex gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={copy.inputPlaceholder}
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
