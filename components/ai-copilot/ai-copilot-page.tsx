"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Clock3, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatRole = "USER" | "ASSISTANT" | "SYSTEM";

type ChatLine = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
};

type SessionSummary = {
  id: string;
  title: string | null;
  role: string;
  updatedAt: string;
  lastMessage: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

type SessionListData = {
  sessions: SessionSummary[];
  suggestedQuestions: string[];
};

type SessionDetailData = {
  session: SessionSummary & { messages: ChatLine[] };
  suggestedQuestions: string[];
};

type CopilotAnswerData = {
  sessionId: string;
  answer: string;
  suggestedQuestions: string[];
};

type AiCopilotPageProps = {
  mode: "brand" | "creator" | "admin" | "auto";
};

const COPY = {
  brand: {
    greeting: "Hi Vincis",
    subtitle: "今天有什么可以帮你？",
    chips: ["创建 Campaign", "推荐 Creator", "查看订单", "分析预算", "查看付款"]
  },
  creator: {
    greeting: "Hi Creator",
    subtitle: "我可以帮你分析收入、接单率、Portfolio、Review、Invitation 和 Wallet。",
    chips: ["为什么最近没接到单？", "如何提高接单率？", "查看收益", "优化主页", "Review 下一步"]
  },
  admin: {
    greeting: "Hi Admin",
    subtitle: "我可以帮你查看平台成交、异常订单、投诉、提现和运营状态。",
    chips: ["今天成交多少？", "哪些订单异常？", "哪些 Creator 被投诉？", "哪些提现需要处理？"]
  },
  auto: {
    greeting: "你好",
    subtitle: "今天有什么可以帮你？",
    chips: ["我的项目现在到哪一步？", "下一步我应该做什么？", "查看订单", "查看通知"]
  }
};

function inferPageContext(pathname: string) {
  if (pathname.startsWith("/brand")) return { pagePath: pathname, entityType: "brand_copilot", entityId: null };
  if (pathname.startsWith("/studio")) return { pagePath: pathname, entityType: "creator_copilot", entityId: null };
  if (pathname.startsWith("/admin")) return { pagePath: pathname, entityType: "admin_copilot", entityId: null };
  return { pagePath: pathname, entityType: "copilot", entityId: null };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function AiCopilotPage({ mode }: AiCopilotPageProps) {
  const pathname = usePathname();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(COPY[mode].chips);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const context = useMemo(() => inferPageContext(pathname), [pathname]);
  const copy = COPY[mode];

  useEffect(() => {
    let cancelled = false;
    setBooting(true);
    fetch("/api/ai-copilot")
      .then(async (response) => (await response.json()) as ApiResponse<SessionListData>)
      .then((payload) => {
        if (cancelled) return;
        if (!payload.success || !payload.data) throw new Error(payload.error?.message ?? "Unable to load AI Copilot");
        setSessions(payload.data.sessions);
        setSuggestions(payload.data.suggestedQuestions.length ? payload.data.suggestedQuestions : COPY[mode].chips);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "AI Copilot 暂时不可用"))
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadSession(nextSessionId: string) {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/ai-copilot?sessionId=${encodeURIComponent(nextSessionId)}`);
      const payload = (await response.json()) as ApiResponse<SessionDetailData>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to load conversation");
      }
      setSessionId(payload.data.session.id);
      setMessages(payload.data.session.messages.filter((message) => message.role !== "SYSTEM"));
      setSuggestions(payload.data.suggestedQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "历史记录读取失败");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setError(null);
    setLoading(true);
    setInput("");
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "USER", content: trimmed }]);

    try {
      const response = await fetch("/api/ai-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: trimmed, ...context })
      });
      const payload = (await response.json()) as ApiResponse<CopilotAnswerData>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "AI Copilot request failed");
      }
      const data = payload.data;
      setSessionId(data.sessionId);
      setSuggestions(data.suggestedQuestions);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "ASSISTANT", content: data.answer }
      ]);
      const listResponse = await fetch("/api/ai-copilot");
      const listPayload = (await listResponse.json()) as ApiResponse<SessionListData>;
      if (listPayload.success && listPayload.data) setSessions(listPayload.data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/10 bg-white/95 p-4 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">StudioOS AI</p>
              <p className="text-xs text-slate-500">{mode === "auto" ? "Role auto detected" : `${mode} copilot`}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full justify-start rounded-2xl"
            onClick={() => {
              setSessionId(null);
              setMessages([]);
              setError(null);
            }}
          >
            <Sparkles className="h-4 w-4" />
            新聊天
          </Button>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">History</p>
            <div className="space-y-2">
              {booting ? (
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载历史记录...
                </div>
              ) : null}
              {!booting && sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                  暂无聊天历史。
                </div>
              ) : null}
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => void loadSession(session.id)}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-3 text-left transition",
                    sessionId === session.id
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  )}
                >
                  <p className="line-clamp-1 text-sm font-medium">{session.title ?? session.lastMessage ?? "Untitled"}</p>
                  <p className={cn("mt-1 flex items-center gap-1 text-xs", sessionId === session.id ? "text-slate-300" : "text-slate-500")}>
                    <Clock3 className="h-3 w-3" />
                    {formatTime(session.updatedAt)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl">
          <header className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">StudioOS AI</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{copy.greeting}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">{copy.subtitle}</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Context: {context.entityType}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {copy.chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => void sendMessage(chip)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-6">
            {messages.length === 0 ? (
              <div className="mx-auto mt-8 max-w-2xl rounded-[2rem] border border-dashed border-slate-300 bg-white p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">今天有什么可以帮你？</h2>
                <p className="mt-2 text-sm text-slate-600">
                  你可以直接提问。AI 会自动识别当前登录身份，并只读取你有权限访问的真实 StudioOS 数据。
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {suggestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => void sendMessage(question)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.role === "USER" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[min(760px,88%)] whitespace-pre-wrap rounded-[1.5rem] px-4 py-3 text-sm leading-relaxed",
                    message.role === "USER"
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-800"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在读取真实业务数据...
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={submit} className="border-t border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex gap-2 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="输入消息..."
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
              />
              <Button type="submit" disabled={loading || !input.trim()} className="rounded-2xl">
                <Send className="h-4 w-4" />
                发送
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
