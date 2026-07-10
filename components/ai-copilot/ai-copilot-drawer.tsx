"use client";

import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ExternalLink, Loader2, Send, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LucienAvatar } from "@/components/ai-copilot/lucien-avatar";
import { cn } from "@/lib/utils";

type ChatLine = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  feedback?: {
    rating: "HELPFUL" | "NOT_HELPFUL";
    reason?: string | null;
    createdAt: string;
  } | null;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

type SessionListData = {
  suggestedQuestions: string[];
  workspace?: {
    roleLabel: string;
    displayName: string;
    workspaceName: string;
  };
};

type CopilotAnswerData = {
  sessionId: string;
  messageId: string;
  answer: string;
  suggestedQuestions: string[];
  toolCalls: Array<{ toolName: string; status: string }>;
};

type FeedbackData = {
  messageId: string;
  feedback: NonNullable<ChatLine["feedback"]>;
};

type UiLocale = "zh" | "en";

type FloatingLauncherPosition = {
  side: "left" | "right";
  y: number;
};

type FloatingLauncherPreview = {
  x: number;
  y: number;
};

type FloatingLauncherDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  moved: boolean;
};

const AI_WORKSPACE_PATHS = new Set([
  "/copilot",
  "/brand/ai",
  "/brand/copilot",
  "/studio/ai",
  "/studio/copilot",
  "/admin/ai",
  "/admin/copilot",
  "/creator/ai"
]);

const FLOATING_LAUNCHER_STORAGE_KEY = "vincis-ai-copilot-launcher-position";
const FLOATING_LAUNCHER_SIZE = 48;
const FLOATING_LAUNCHER_EDGE_OFFSET = 20;
const FLOATING_LAUNCHER_TOP_SAFE = 96;
const FLOATING_LAUNCHER_BOTTOM_SAFE = 128;
const FLOATING_LAUNCHER_CLICK_THRESHOLD = 5;

const DRAWER_COPY: Record<UiLocale, {
  launcher: string;
  title: string;
  subtitle: string;
  currentEntity: string;
  openWorkspace: string;
  openWorkspaceAria: string;
  loading: string;
  inputPlaceholder: string;
  unavailable: string;
  requestFailed: string;
  feedbackSaved: string;
  feedbackFailed: string;
  defaultSuggestions: string[];
}> = {
  zh: {
    launcher: "卢西恩",
    title: "卢西恩",
    subtitle: "你的创意协作伙伴",
    currentEntity: "当前",
    openWorkspace: "打开全屏聊天",
    openWorkspaceAria: "打开全屏聊天",
    loading: "正在读取 VINCIS 数据...",
    inputPlaceholder: "问卢西恩...",
    unavailable: "卢西恩暂时不可用，请稍后再试。",
    requestFailed: "卢西恩请求失败",
    feedbackSaved: "反馈已记录，会用于优化后续回复。",
    feedbackFailed: "反馈保存失败，请稍后再试",
    defaultSuggestions: ["我的项目现在到哪一步？", "下一步我应该做什么？", "我的预算合理吗？"]
  },
  en: {
    launcher: "Lucien",
    title: "Lucien",
    subtitle: "Your creative collaboration partner",
    currentEntity: "current",
    openWorkspace: "Open full-screen chat",
    openWorkspaceAria: "Open full-screen chat",
    loading: "Reading VINCIS data...",
    inputPlaceholder: "Ask Lucien...",
    unavailable: "Lucien is temporarily unavailable. Please try again later.",
    requestFailed: "Lucien request failed",
    feedbackSaved: "Feedback saved and will improve future replies.",
    feedbackFailed: "Unable to save feedback. Please try again.",
    defaultSuggestions: ["Where is my project now?", "What should I do next?", "Is my budget reasonable?"]
  }
};

function inferPageContext(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const entityId = parts.at(-1);
  const entityType = parts.includes("projects")
    ? "project"
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

function pageContextLabel(input: { pathname: string; entityType: string | null; locale: UiLocale }) {
  const { pathname, entityType, locale } = input;
  if (entityType === "review") return locale === "zh" ? "当前：审片中心" : "Current: Review center";
  if (entityType === "project") return locale === "zh" ? "当前：项目页面" : "Current: Project page";
  if (entityType === "order") return locale === "zh" ? "当前：订单页面" : "Current: Order page";
  if (entityType === "attribution") return locale === "zh" ? "当前：归因分析" : "Current: Attribution";
  if (pathname.startsWith("/studio/messages")) return locale === "zh" ? "当前：消息中心" : "Current: Messages";
  if (pathname.startsWith("/studio/profile")) return locale === "zh" ? "当前：个人资料" : "Current: Profile";
  if (pathname.startsWith("/brand")) return locale === "zh" ? "当前：品牌方工作台" : "Current: Brand workspace";
  if (pathname.startsWith("/studio") || pathname.startsWith("/creator")) return locale === "zh" ? "当前：创作者工作台" : "Current: Creator workspace";
  if (pathname.startsWith("/admin")) return locale === "zh" ? "当前：管理后台" : "Current: Admin";
  return locale === "zh" ? "当前：VINCIS" : "Current: VINCIS";
}

function roleKindFromPath(pathname: string): "brand" | "creator" | "admin" | "auto" {
  if (pathname.startsWith("/brand")) return "brand";
  if (pathname.startsWith("/studio") || pathname.startsWith("/creator")) return "creator";
  if (pathname.startsWith("/admin")) return "admin";
  return "auto";
}

function localGreetingPrefix(locale: UiLocale, hour: number) {
  if (locale === "zh") {
    if (hour >= 5 && hour < 12) return "早上好";
    if (hour >= 12 && hour < 18) return "下午好";
    if (hour >= 18 && hour < 24) return "晚上好";
    return "夜深了";
  }
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  if (hour >= 18 && hour < 24) return "Good evening";
  return "It is late";
}

function fallbackDisplayName(role: ReturnType<typeof roleKindFromPath>, locale: UiLocale) {
  if (locale === "en") {
    if (role === "creator") return "Creator";
    if (role === "brand") return "Brand";
    if (role === "admin") return "Admin";
    return "there";
  }
  if (role === "creator") return "创作者";
  if (role === "brand") return "品牌方";
  if (role === "admin") return "管理员";
  return "你好";
}

function welcomeBody(input: { pathname: string; role: ReturnType<typeof roleKindFromPath>; locale: UiLocale }) {
  const { pathname, role, locale } = input;
  if (locale === "en") {
    if (pathname.startsWith("/brand/attribution")) {
      return "I can help analyze attribution data for this campaign and identify which channels, creators, or content are driving better results.";
    }
    if (pathname.startsWith("/studio/ai") || pathname.startsWith("/studio/copilot")) {
      return "This is your AI workspace. I can help review recent invitations, orders, earnings, and profile optimization ideas.";
    }
    if (role === "creator") {
      return "I can help you review invitations, orders, earnings, and portfolio performance, or analyze what to improve on your profile.";
    }
    if (role === "brand") {
      return "I can help you review campaigns, find recommended creators, analyze ad performance, and organize your next steps.";
    }
    if (role === "admin") {
      return "I can help review platform health, order exceptions, withdrawal requests, user data, and operational tasks that need attention.";
    }
    return "Tell me what you are working on today, and I will help organize the key next steps.";
  }

  if (pathname.startsWith("/brand/attribution")) {
    return "我可以帮你分析当前 Campaign 的归因数据，看看哪些渠道、Creator 或内容带来了更好的效果。";
  }
  if (pathname.startsWith("/studio/ai") || pathname.startsWith("/studio/copilot")) {
    return "这里是你的 AI 工作台。我可以帮你查看最近的邀请、订单、收益和主页优化建议。";
  }
  if (role === "creator") {
    return "我可以帮你查看邀请、订单、收益、作品表现，也可以帮你分析主页哪里还能优化。";
  }
  if (role === "brand") {
    return "我可以帮你查看 Campaign、推荐 Creator、分析广告表现，也可以协助你整理下一步计划。";
  }
  if (role === "admin") {
    return "我可以帮你查看平台状态、订单异常、提现申请、用户数据和需要处理的运营事项。";
  }
  return "你可以告诉我今天想处理什么，我会帮你把重点和下一步整理出来。";
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

function isAiWorkspacePath(pathname: string) {
  return AI_WORKSPACE_PATHS.has(pathname);
}

function clampLauncherY(y: number) {
  if (typeof window === "undefined") return y;
  const maxY = Math.max(
    FLOATING_LAUNCHER_TOP_SAFE,
    window.innerHeight - FLOATING_LAUNCHER_BOTTOM_SAFE - FLOATING_LAUNCHER_SIZE
  );
  return Math.min(Math.max(y, FLOATING_LAUNCHER_TOP_SAFE), maxY);
}

function clampLauncherX(x: number) {
  if (typeof window === "undefined") return x;
  const maxX = Math.max(
    FLOATING_LAUNCHER_EDGE_OFFSET,
    window.innerWidth - FLOATING_LAUNCHER_EDGE_OFFSET - FLOATING_LAUNCHER_SIZE
  );
  return Math.min(Math.max(x, FLOATING_LAUNCHER_EDGE_OFFSET), maxX);
}

function defaultLauncherPosition(): FloatingLauncherPosition {
  return {
    side: "right",
    y: 360
  };
}

function normalizeLauncherPosition(position: FloatingLauncherPosition): FloatingLauncherPosition {
  return {
    side: position.side === "left" ? "left" : "right",
    y: clampLauncherY(position.y)
  };
}

function readStoredLauncherPosition(): FloatingLauncherPosition {
  if (typeof window === "undefined") return defaultLauncherPosition();

  try {
    const stored = window.localStorage.getItem(FLOATING_LAUNCHER_STORAGE_KEY);
    if (!stored) return defaultLauncherPosition();
    const parsed = JSON.parse(stored) as Partial<FloatingLauncherPosition>;
    if ((parsed.side === "left" || parsed.side === "right") && typeof parsed.y === "number") {
      return normalizeLauncherPosition({ side: parsed.side, y: parsed.y });
    }
  } catch {
    return defaultLauncherPosition();
  }

  return defaultLauncherPosition();
}

function storeLauncherPosition(position: FloatingLauncherPosition) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(FLOATING_LAUNCHER_STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Position memory is a convenience, so storage failures should not block the launcher.
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
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
  const [workspace, setWorkspace] = useState<SessionListData["workspace"] | null>(null);
  const [localHour, setLocalHour] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);
  const [launcherPosition, setLauncherPosition] = useState<FloatingLauncherPosition>(() => defaultLauncherPosition());
  const [launcherPreview, setLauncherPreview] = useState<FloatingLauncherPreview | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const launcherDragRef = useRef<FloatingLauncherDrag | null>(null);
  const suppressLauncherClickRef = useRef(false);

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
  const roleKind = roleKindFromPath(pathname);
  const displayName = workspace?.displayName?.trim() || fallbackDisplayName(roleKind, locale);
  const introTitle =
    localHour == null
      ? locale === "zh"
        ? `你好，${displayName} 😊`
        : `Hi, ${displayName} 😊`
      : `${localGreetingPrefix(locale, localHour)}${locale === "zh" ? "，" : ", "}${displayName} 😊`;
  const introBody = welcomeBody({ pathname, role: roleKind, locale });
  const workspaceUrl = workspaceHref(pathname, searchParams);
  const hideFloatingLauncher = isAiWorkspacePath(pathname);

  useEffect(() => {
    setLauncherPosition(readStoredLauncherPosition());

    const handleResize = () => {
      setLauncherPosition((current) => {
        const next = normalizeLauncherPosition(current);
        storeLauncherPosition(next);
        return next;
      });
      setLauncherPreview(null);
      launcherDragRef.current = null;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (hideFloatingLauncher) setOpen(false);
  }, [hideFloatingLauncher]);

  useEffect(() => {
    const syncLocalHour = () => setLocalHour(new Date().getHours());
    syncLocalHour();
    const interval = window.setInterval(syncLocalHour, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length === 0) setSuggestions(copy.defaultSuggestions);
  }, [copy.defaultSuggestions, messages.length]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const controller = new AbortController();
    fetch(sessionsUrl, { signal: controller.signal })
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
        setWorkspace(payload.data.workspace ?? null);
      })
      .catch((err) => {
        if (cancelled || isAbortError(err)) return;
        setError(err instanceof Error ? err.message : copy.unavailable);
      });
    return () => {
      cancelled = true;
      controller.abort();
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
        { id: data.messageId, role: "ASSISTANT", content: data.answer, feedback: null }
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

  async function submitFeedback(messageId: string, rating: "HELPFUL" | "NOT_HELPFUL") {
    if (messages.some((message) => message.id === messageId && message.feedback)) return;
    setSavingFeedbackId(messageId);
    setError(null);
    try {
      const response = await fetch("/api/ai-copilot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          rating,
          languageCode: pageContext.languageCode
        })
      });
      const payload = (await response.json().catch(() => null)) as ApiResponse<FeedbackData> | null;
      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.error?.message ?? copy.feedbackFailed);
      }
      const data = payload.data;
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, feedback: data.feedback } : message
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.feedbackFailed);
    } finally {
      setSavingFeedbackId(null);
    }
  }

  function startLauncherDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    launcherDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      currentX: rect.left,
      currentY: rect.top,
      moved: false
    };
    setLauncherPreview({ x: rect.left, y: rect.top });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveLauncherDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = launcherDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const nextX = clampLauncherX(drag.originX + deltaX);
    const nextY = clampLauncherY(drag.originY + deltaY);
    const moved = Math.hypot(deltaX, deltaY) > FLOATING_LAUNCHER_CLICK_THRESHOLD;

    launcherDragRef.current = {
      ...drag,
      currentX: nextX,
      currentY: nextY,
      moved: drag.moved || moved
    };
    setLauncherPreview({ x: nextX, y: nextY });
  }

  function finishLauncherDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = launcherDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const side = drag.currentX + FLOATING_LAUNCHER_SIZE / 2 < window.innerWidth / 2 ? "left" : "right";
    const nextPosition = normalizeLauncherPosition({ side, y: drag.currentY });
    setLauncherPosition(nextPosition);
    storeLauncherPosition(nextPosition);
    setLauncherPreview(null);
    suppressLauncherClickRef.current = drag.moved;
    launcherDragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function openLauncher() {
    if (suppressLauncherClickRef.current) {
      suppressLauncherClickRef.current = false;
      return;
    }
    setOpen(true);
  }

  if (hideFloatingLauncher) {
    return null;
  }

  const launcherStyle = launcherPreview
    ? { left: `${launcherPreview.x}px`, top: `${launcherPreview.y}px` }
    : launcherPosition.side === "left"
      ? { left: `${FLOATING_LAUNCHER_EDGE_OFFSET}px`, top: `${launcherPosition.y}px` }
      : { right: `${FLOATING_LAUNCHER_EDGE_OFFSET}px`, top: `${launcherPosition.y}px` };

  return (
    <>
      <Button
        type="button"
        aria-label={copy.launcher}
        title={copy.launcher}
        onClick={openLauncher}
        onPointerDown={startLauncherDrag}
        onPointerMove={moveLauncherDrag}
        onPointerUp={finishLauncherDrag}
        onPointerCancel={finishLauncherDrag}
        style={launcherStyle}
        className={cn(
          "fixed z-[100] h-12 w-12 touch-none select-none rounded-full p-0 shadow-xl shadow-slate-950/20",
          "bg-slate-950 text-white ring-1 ring-white/20 hover:bg-slate-800",
          launcherPreview ? "cursor-grabbing transition-none" : "cursor-grab transition-[top,left,right,box-shadow] duration-200"
        )}
      >
        <Sparkles className="h-5 w-5 fill-white" />
        <span className="sr-only">{copy.launcher}</span>
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex h-[100dvh] max-h-[100dvh] justify-end overflow-hidden bg-slate-950/30 backdrop-blur-[1px]">
          <aside className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-[460px] flex-col overflow-hidden border-l border-violet-100 bg-[#fbfbff] shadow-2xl">
            <header className="border-b border-violet-100 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <LucienAvatar size="md" alt={copy.title} />
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
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {pageContextLabel({
                    pathname,
                    entityType: pageContext.entityType,
                    locale
                  })}
                </span>
                <a
                  href={workspaceUrl}
                  className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white"
                >
                  {copy.openWorkspace}
                </a>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#fbfbff] p-5">
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-violet-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                  <p className="font-medium text-slate-950">{introTitle}</p>
                  <p className="mt-2">{introBody}</p>
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
                    {message.role === "ASSISTANT" ? (
                      <div className="mt-3 border-t border-violet-100 pt-2">
                        <div className="flex items-center gap-2 text-slate-400">
                          <button
                            type="button"
                            disabled={savingFeedbackId === message.id || Boolean(message.feedback)}
                            onClick={() => void submitFeedback(message.id, "HELPFUL")}
                            className={cn(
                              "rounded-full p-1 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50",
                              message.feedback?.rating === "HELPFUL" && "bg-emerald-50 text-emerald-600"
                            )}
                            aria-label={locale === "zh" ? "这条回复有帮助" : "This reply was helpful"}
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
                            aria-label={locale === "zh" ? "这条回复没有帮助" : "This reply was not helpful"}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                          {savingFeedbackId === message.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                          ) : null}
                          {message.feedback ? (
                            <span className="text-xs text-slate-400">{copy.feedbackSaved}</span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
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

            <div className="shrink-0 border-t border-violet-100 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
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
