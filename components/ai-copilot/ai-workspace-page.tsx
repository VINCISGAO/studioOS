"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Box,
  Brain,
  Check,
  ChevronDown,
  Compass,
  Database,
  ExternalLink,
  Loader2,
  MessageSquare,
  Send,
  Settings,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  Wallet,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkspaceMode = "brand" | "creator" | "admin" | "auto";
type ChatRole = "USER" | "ASSISTANT" | "SYSTEM";

type ChatLine = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
  feedback?: {
    rating: "HELPFUL" | "NOT_HELPFUL";
    reason?: string | null;
    createdAt: string;
  } | null;
};

type SessionSummary = {
  id: string;
  title: string | null;
  role: string;
  updatedAt: string;
  lastMessage: string | null;
};

type WorkspaceStat = {
  label: string;
  value: string;
  detail: string;
  icon: "box" | "brain" | "wallet" | "compass";
};

type WorkspaceSnapshot = {
  roleLabel: string;
  displayName: string;
  workspaceName: string;
  greeting: string;
  subtitle: string;
  stats: WorkspaceStat[];
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

type SessionListData = {
  sessions: SessionSummary[];
  suggestedQuestions: string[];
  workspace?: WorkspaceSnapshot;
};

type SessionDetailData = {
  session: SessionSummary & { messages: ChatLine[] };
  suggestedQuestions: string[];
};

type CopilotAnswerData = {
  sessionId: string;
  messageId: string;
  answer: string;
  suggestedQuestions: string[];
  toolCalls: Array<{ toolName: string; status: string; durationMs: number }>;
};

type FeedbackData = {
  messageId: string;
  feedback: NonNullable<ChatLine["feedback"]>;
};

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<{
  response: Response;
  payload: T | null;
}> {
  const response = await fetch(input, init);
  return {
    response,
    payload: await readJsonResponse<T>(response)
  };
}

type AiWorkspacePageProps = {
  mode: WorkspaceMode;
};

type UiLocale = "zh" | "en";

const UI_COPY: Record<UiLocale, {
  title: string;
  subtitle: string;
  nav: {
    copilot: string;
    chats: string;
    insights: string;
    memory: string;
    tools: string;
    settings: string;
  };
  workspaceCard: string;
  switchRole: string;
  proTipTitle: string;
  proTipBody: string;
  learnMore: string;
  loadingWorkspaceName: string;
  loadingGreeting: string;
  inputPlaceholder: string;
  ready: string;
  loading: string;
  booting: string;
  unavailable: string;
  loadFailed: string;
  sendFailed: string;
  requestFailed: string;
  feedbackSaved: string;
  feedbackFailed: string;
  done: string;
  untitled: string;
  disclaimer: string;
  toolSteps: string[];
  compactPageTitle: string;
}> = {
  zh: {
    title: "VINCIS AI助手",
    subtitle: "你的 AI 创作者操作系统",
    nav: {
      copilot: "AI助手",
      chats: "聊天",
      insights: "洞察",
      memory: "记忆",
      tools: "工具",
      settings: "设置"
    },
    workspaceCard: "当前工作区",
    switchRole: "切换角色",
    proTipTitle: "使用建议",
    proTipBody: "AI 可以帮你分析表现、寻找创作者，并优化广告项目。",
    learnMore: "了解更多 →",
    loadingWorkspaceName: "正在读取数据库",
    loadingGreeting: "正在同步你的真实资料",
    inputPlaceholder: "询问任何关于 VINCIS 的问题...",
    ready: "AI助手工作区已就绪",
    loading: "AI 正在为你分析",
    booting: "正在加载 AI 工作区",
    unavailable: "AI助手工作区暂时不可用",
    loadFailed: "历史记录读取失败",
    sendFailed: "发送失败，请稍后再试",
    requestFailed: "AI助手请求失败",
    feedbackSaved: "反馈已记录，会用于优化后续回复。",
    feedbackFailed: "反馈保存失败，请稍后再试",
    done: "完成",
    untitled: "未命名",
    disclaimer: "AI 生成的内容仅供参考，请结合实际情况判断和使用。",
    toolSteps: ["项目数据", "用户资料", "匹配度", "生成建议"],
    compactPageTitle: "打开紧凑版 AI助手"
  },
  en: {
    title: "VINCIS AI Assistant",
    subtitle: "Your AI Creator Operating System",
    nav: {
      copilot: "AI Assistant",
      chats: "Chats",
      insights: "Insights",
      memory: "Memory",
      tools: "Tools",
      settings: "Settings"
    },
    workspaceCard: "Current workspace",
    switchRole: "Switch role",
    proTipTitle: "Pro Tip",
    proTipBody: "AI Assistant can help you analyze performance, find creators, and optimize campaigns.",
    learnMore: "Learn more →",
    loadingWorkspaceName: "Reading database",
    loadingGreeting: "Syncing your real profile",
    inputPlaceholder: "Ask anything about VINCIS...",
    ready: "AI Assistant workspace is ready",
    loading: "AI is analyzing for you",
    booting: "Loading AI workspace",
    unavailable: "AI Assistant workspace is temporarily unavailable",
    loadFailed: "Unable to load conversation",
    sendFailed: "Unable to send. Please try again later.",
    requestFailed: "AI Assistant request failed",
    feedbackSaved: "Feedback saved and will improve future replies.",
    feedbackFailed: "Unable to save feedback. Please try again.",
    done: "Done",
    untitled: "Untitled",
    disclaimer: "AI-generated content is for reference only. Please use your own judgment.",
    toolSteps: ["Read project data", "Analyze creator data", "Calculate match score", "Generate suggestions"],
    compactPageTitle: "Open compact AI Assistant"
  }
};

const toolSteps = [
  { label: "读取项目数据", icon: Database },
  { label: "分析创作者数据", icon: UserRound },
  { label: "匹配度计算", icon: Compass },
  { label: "生成建议", icon: Sparkles }
];

function statIcon(name: "box" | "brain" | "wallet" | "compass") {
  if (name === "brain") return Brain;
  if (name === "wallet") return Wallet;
  if (name === "compass") return Compass;
  return Box;
}

function inferPageContext(pathname: string) {
  if (pathname.startsWith("/brand")) return { pagePath: pathname, entityType: "brand_ai_workspace", entityId: null };
  if (pathname.startsWith("/studio") || pathname.startsWith("/creator")) {
    return { pagePath: pathname, entityType: "creator_ai_workspace", entityId: null };
  }
  if (pathname.startsWith("/admin")) return { pagePath: pathname, entityType: "admin_ai_workspace", entityId: null };
  return { pagePath: pathname, entityType: "ai_workspace", entityId: null };
}

function languageFromSearch(searchParams: { get(name: string): string | null }) {
  const lang = searchParams.get("lang");
  if (lang === "zh") return "zh-CN";
  if (lang === "en") return "en";
  return lang ?? "zh-CN";
}

function uiLocaleFromSearch(searchParams: { get(name: string): string | null }): UiLocale {
  return searchParams.get("lang") === "en" ? "en" : "zh";
}

function compactHref(mode: WorkspaceMode, searchParams: { get(name: string): string | null }) {
  const base = mode === "brand"
    ? "/brand/copilot"
    : mode === "creator"
      ? "/studio/copilot"
      : mode === "admin"
        ? "/admin/copilot"
        : "/copilot";
  const lang = searchParams.get("lang");
  return lang ? `${base}?lang=${encodeURIComponent(lang)}` : base;
}

function formatAssistantContent(content: string) {
  if (content.includes("\n")) return content;
  return content;
}

function localGreetingPrefix(locale: UiLocale, hour: number) {
  if (locale === "zh") {
    if (hour >= 5 && hour < 11) return "早上好";
    if (hour >= 11 && hour < 14) return "中午好";
    if (hour >= 14 && hour < 18) return "下午好";
    return "晚上好";
  }
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

export function AiWorkspacePage({ mode }: AiWorkspacePageProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const uiLocale = useMemo(() => uiLocaleFromSearch(searchParams), [searchParams]);
  const ui = UI_COPY[uiLocale];
  const context = useMemo(
    () => ({ ...inferPageContext(pathname), languageCode: languageFromSearch(searchParams) }),
    [pathname, searchParams]
  );
  const sessionsUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (context.languageCode) params.set("languageCode", context.languageCode);
    const query = params.toString();
    return query ? `/api/ai-copilot?${query}` : "/api/ai-copilot";
  }, [context.languageCode]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);
  const [localHour, setLocalHour] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBooting(true);
    fetchJson<ApiResponse<SessionListData>>(sessionsUrl)
      .then(({ response, payload }) => {
        if (!response.ok || !payload?.success) throw new Error(payload?.error?.message ?? ui.unavailable);
        return payload;
      })
      .then((payload) => {
        if (cancelled || !payload.data) return;
        setSessions(payload.data.sessions);
        setWorkspace(payload.data.workspace ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : ui.unavailable))
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionsUrl, ui.unavailable]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const syncLocalHour = () => setLocalHour(new Date().getHours());
    syncLocalHour();
    const interval = window.setInterval(syncLocalHour, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  async function loadSession(nextSessionId: string) {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ sessionId: nextSessionId });
      if (context.languageCode) params.set("languageCode", context.languageCode);
      const { response, payload } = await fetchJson<ApiResponse<SessionDetailData>>(`/api/ai-copilot?${params.toString()}`);
      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.error?.message ?? ui.loadFailed);
      }
      setSessionId(payload.data.session.id);
      setMessages(payload.data.session.messages.filter((message) => message.role !== "SYSTEM"));
    } catch (err) {
      setError(err instanceof Error ? err.message : ui.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function refreshSessions() {
    try {
      const { payload } = await fetchJson<ApiResponse<SessionListData>>(sessionsUrl);
      if (payload?.success && payload.data) {
        setSessions(payload.data.sessions);
        setWorkspace(payload.data.workspace ?? null);
      }
    } catch {
      // Refresh is non-critical; keep the current conversation visible.
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
      const { response, payload } = await fetchJson<ApiResponse<CopilotAnswerData>>("/api/ai-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: trimmed, ...context })
      });
      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.error?.message ?? ui.requestFailed);
      }
      const data = payload.data;
      setSessionId(data.sessionId);
      setMessages((current) => [
        ...current,
        { id: data.messageId, role: "ASSISTANT", content: data.answer, feedback: null }
      ]);
      await refreshSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : ui.sendFailed);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  async function submitFeedback(messageId: string, rating: "HELPFUL" | "NOT_HELPFUL") {
    if (messages.some((message) => message.id === messageId && message.feedback)) return;
    setSavingFeedbackId(messageId);
    setError(null);
    try {
      const { response, payload } = await fetchJson<ApiResponse<FeedbackData>>("/api/ai-copilot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          rating,
          languageCode: context.languageCode
        })
      });
      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.error?.message ?? ui.feedbackFailed);
      }
      const data = payload.data;
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, feedback: data.feedback } : message
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : ui.feedbackFailed);
    } finally {
      setSavingFeedbackId(null);
    }
  }

  const displayWorkspace = workspace?.workspaceName ?? ui.loadingWorkspaceName;
  const displayGreeting =
    workspace && localHour != null
      ? `${localGreetingPrefix(uiLocale, localHour)}${uiLocale === "zh" ? "，" : ", "}${workspace.displayName}`
      : workspace?.greeting ?? ui.loadingGreeting;
  const displayStats = workspace?.stats ?? [];

  return (
    <main className="h-[calc(100dvh-7rem)] min-h-[640px] overflow-hidden bg-white text-[#171923] sm:rounded-[2rem] sm:border sm:border-slate-200 sm:shadow-sm lg:h-[calc(100dvh-8.5rem)] lg:max-h-[calc(100dvh-8.5rem)]">
      <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden">
        <aside className="hidden">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 fill-violet-500 text-violet-500" />
            VINCIS AI
          </div>

          <nav className="mt-8 space-y-2 text-sm">
            {[
              { label: ui.nav.copilot, icon: Sparkles, active: true },
              { label: ui.nav.chats, icon: MessageSquare },
              { label: ui.nav.insights, icon: BarChart3 },
              { label: ui.nav.memory, icon: Brain },
              { label: ui.nav.tools, icon: Wrench },
              { label: ui.nav.settings, icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                    item.active ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">{ui.workspaceCard}</p>
              <p className="mt-1 text-sm font-semibold">{displayWorkspace}</p>
              <button type="button" className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <UserRound className="h-3.5 w-3.5" />
                  {ui.switchRole}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-50 p-4">
              <p className="text-xs font-medium text-slate-500">{ui.proTipTitle}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {ui.proTipBody}
              </p>
              <p className="mt-3 text-xs font-medium text-violet-700">{ui.learnMore}</p>
              <div className="ml-auto mt-2 h-16 w-20 rounded-full bg-gradient-to-br from-violet-400/40 to-sky-300/40 blur-sm" />
            </div>

          </div>
        </aside>

        <section className="flex h-full min-h-0 min-w-0 flex-col bg-white">
          <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-200 sm:h-14 sm:w-14">
                <Sparkles className="h-5 w-5 fill-white sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold sm:text-2xl">{ui.title}</h1>
                <p className="truncate text-xs text-slate-500 sm:text-sm">{ui.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={compactHref(mode, searchParams)}
                className="hidden rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 sm:inline-flex"
                title={ui.compactPageTitle}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 justify-center overflow-hidden">
            <div className="flex min-h-0 w-full max-w-none flex-1 flex-col px-4 py-4 sm:px-6">
              <div className="shrink-0 rounded-[1.5rem] border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50 p-3 shadow-sm sm:p-4 lg:p-3 xl:p-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold leading-snug sm:text-2xl">👋 {displayGreeting}</h2>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-2">
                  {displayStats.length > 0
                    ? displayStats.map((stat) => {
                        const Icon = statIcon(stat.icon);
                        return (
                          <div
                            key={stat.label}
                            className="flex min-h-[52px] items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm xl:min-h-0 xl:gap-3 xl:px-4 xl:py-3"
                          >
                            <div className="flex min-w-0 shrink-0 items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 sm:h-7 sm:w-7 xl:h-8 xl:w-8">
                                <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5 xl:h-4 xl:w-4" />
                              </span>
                              <span className="text-xl font-semibold sm:text-xl xl:text-2xl">{stat.value}</span>
                            </div>
                            <p className="min-w-0 flex-1 truncate text-right text-xs font-medium text-slate-700 xl:text-sm">{stat.label}</p>
                          </div>
                        );
                      })
                    : Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className="flex min-h-[52px] items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm xl:min-h-0 xl:gap-3 xl:px-4 xl:py-3"
                        >
                          <div className="flex shrink-0 items-center gap-2.5">
                            <span className="h-8 w-8 animate-pulse rounded-full bg-violet-100" />
                            <span className="h-7 w-10 animate-pulse rounded-lg bg-slate-100" />
                          </div>
                          <p className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                        </div>
                      ))}
                </div>
              </div>

              <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pb-4">
                {sessions.length > 0 && messages.length === 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {sessions.slice(0, 6).map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => void loadSession(session.id)}
                        className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                      >
                        {session.title ?? session.lastMessage ?? ui.untitled}
                      </button>
                    ))}
                  </div>
                ) : null}

                {messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.role === "USER" ? "justify-end" : "justify-start")}>
                    {message.role !== "USER" ? (
                      <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
                        <Sparkles className="h-4 w-4 fill-white" />
                      </div>
                    ) : null}
                    <div
                      className={cn(
                        "max-w-[min(680px,88%)] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed sm:px-5 sm:py-4",
                        message.role === "USER"
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-100"
                          : "border border-slate-200 bg-white text-slate-800 shadow-sm"
                      )}
                    >
                      {formatAssistantContent(message.content)}
                      {message.role !== "USER" ? (
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-3 text-slate-400">
                            <button
                              type="button"
                              disabled={savingFeedbackId === message.id || Boolean(message.feedback)}
                              onClick={() => void submitFeedback(message.id, "HELPFUL")}
                              className={cn(
                                "rounded-full p-1 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50",
                                message.feedback?.rating === "HELPFUL" && "bg-emerald-50 text-emerald-600"
                              )}
                              aria-label={uiLocale === "zh" ? "这条回复有帮助" : "This reply was helpful"}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={savingFeedbackId === message.id || Boolean(message.feedback)}
                              onClick={() => void submitFeedback(message.id, "NOT_HELPFUL")}
                              className={cn(
                                "rounded-full p-1 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50",
                                message.feedback?.rating === "NOT_HELPFUL" && "bg-rose-50 text-rose-600"
                              )}
                              aria-label={uiLocale === "zh" ? "这条回复没有帮助" : "This reply was not helpful"}
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </button>
                            {savingFeedbackId === message.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                            ) : null}
                            {message.feedback ? (
                              <span className="text-xs text-slate-400">{ui.feedbackSaved}</span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                ) : null}
                <div ref={bottomRef} />
              </div>

              <div className="mt-auto shrink-0 border-t border-slate-100 bg-white pb-4 pt-3">
                <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="h-4 w-4 fill-violet-500 text-violet-500" />
                  <span>{loading ? ui.loading : booting ? ui.booting : ui.ready}</span>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {toolSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.label} className="flex min-h-[40px] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                        <span className="flex min-w-0 items-center gap-2 text-slate-600">
                          <Icon className="h-4 w-4 text-violet-500" />
                          <span className="truncate">{ui.toolSteps[index] ?? step.label}</span>
                        </span>
                        {loading && index === 3 ? (
                          <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                        ) : (
                          <span className="flex shrink-0 items-center gap-1 text-emerald-600">
                            <Check className="h-3.5 w-3.5" />
                            {ui.done}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <input
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder={ui.inputPlaceholder}
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={loading || !input.trim()}
                      className="rounded-xl bg-violet-600 text-white hover:bg-violet-700"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </form>
                <p className="mt-3 text-xs text-slate-400">
                  {ui.disclaimer}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
