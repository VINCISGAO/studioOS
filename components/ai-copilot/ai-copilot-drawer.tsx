"use client";

import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Check,
  Database,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LucienAvatar } from "@/components/ai-copilot/lucien-avatar";
import {
  installAuthLucienChatIdleGuard,
  readAuthLucienChat,
  syncLucienChatAuthUser,
  writeAuthLucienChat
} from "@/lib/lucien/lucien-chat-storage";
import { resolveCopilotDisplayNameFromUser } from "@/lib/studioos/brand-account-display.shared";
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
    model?: {
      configured: boolean;
      model: string;
    };
  };
};

type SessionDetailData = {
  session: {
    id: string;
    messages: Array<{
      id: string;
      role: "USER" | "ASSISTANT";
      content: string;
      feedback?: ChatLine["feedback"];
    }>;
  };
  suggestedQuestions: string[];
};

type AuthMeData = {
  id: string;
  email: string;
  role?: string;
  fullName?: string;
  companyName?: string;
  displayName?: string;
};

type CopilotAnswerData = {
  sessionId: string;
  messageId: string;
  answer: string;
  suggestedQuestions: string[];
  toolCalls: Array<{ toolName: string; status: string }>;
  answerMode?: string;
  modelConfigured?: boolean;
};

type FeedbackData = {
  messageId: string;
  feedback: NonNullable<ChatLine["feedback"]>;
};

type UiLocale = "zh" | "en";

type FloatingLauncherPosition = {
  x: number;
  y: number;
};

type FloatingLauncherDrag = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  moved: boolean;
};

const FLOATING_LAUNCHER_STORAGE_KEY = "vincis-ai-copilot-launcher-position";
const FLOATING_LAUNCHER_SIZE = 48;
const FLOATING_LAUNCHER_EDGE_OFFSET = 20;
const FLOATING_LAUNCHER_TOP_SAFE = 96;
const FLOATING_LAUNCHER_BOTTOM_SAFE = 128;
const FLOATING_LAUNCHER_CLICK_THRESHOLD = 10;

const DRAWER_COPY: Record<UiLocale, {
  launcher: string;
  title: string;
  subtitle: string;
  currentEntity: string;
  expand: string;
  collapse: string;
  loading: string;
  inputPlaceholder: string;
  unavailable: string;
  requestFailed: string;
  feedbackSaved: string;
  feedbackFailed: string;
  workspaceReady: string;
  readinessItems: string[];
  modelReady: string;
  modelMissing: string;
  modelMissingHint: string;
  defaultSuggestions: string[];
}> = {
  zh: {
    launcher: "卢西恩",
    title: "卢西恩",
    subtitle: "你的创意协作伙伴",
    currentEntity: "当前",
    expand: "放大聊天窗口",
    collapse: "缩回聊天窗口",
    loading: "正在思考中…",
    inputPlaceholder: "问卢西恩...",
    unavailable: "卢西恩暂时不可用，请稍后再试。",
    requestFailed: "卢西恩请求失败",
    feedbackSaved: "反馈已记录，会用于优化后续回复。",
    feedbackFailed: "反馈保存失败，请稍后再试",
    workspaceReady: "卢西恩工作区已就绪",
    readinessItems: ["项目数据", "用户资料", "匹配度", "语言模型"],
    modelReady: "已连接",
    modelMissing: "未连接",
    modelMissingHint: "语言模型未配置。卢西恩会读取数据库作答，但无法进行开放式推理。请在 Vercel 配置 OPENAI_API_KEY 并重新部署。",
    defaultSuggestions: ["我的项目现在到哪一步？", "下一步我应该做什么？", "我的预算合理吗？"]
  },
  en: {
    launcher: "Lucien",
    title: "Lucien",
    subtitle: "Your creative collaboration partner",
    currentEntity: "current",
    expand: "Expand chat window",
    collapse: "Collapse chat window",
    loading: "Thinking…",
    inputPlaceholder: "Ask Lucien...",
    unavailable: "Lucien is temporarily unavailable. Please try again later.",
    requestFailed: "Lucien request failed",
    feedbackSaved: "Feedback saved and will improve future replies.",
    feedbackFailed: "Unable to save feedback. Please try again.",
    workspaceReady: "Lucien workspace is ready",
    readinessItems: ["Project data", "User profile", "Match fit", "Language model"],
    modelReady: "Connected",
    modelMissing: "Missing",
    modelMissingHint: "OpenAI is not configured. Lucien can read your database, but cannot run open-ended reasoning. Set OPENAI_API_KEY in Vercel and redeploy.",
    defaultSuggestions: ["Where is my project now?", "What should I do next?", "Is my budget reasonable?"]
  }
};

const READINESS_ICONS = [Database, UserRound, Target, Sparkles] as const;

function WorkspaceReadinessStrip({
  copy,
  locale,
  modelConfigured
}: {
  copy: (typeof DRAWER_COPY)[UiLocale];
  locale: UiLocale;
  modelConfigured: boolean | null;
}) {
  const modelReady = modelConfigured === true;
  const modelUnknown = modelConfigured === null;

  return (
    <div className="mb-3 rounded-2xl border border-violet-100 bg-white/90 px-3 py-2.5 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-violet-700">
        <Sparkles className="h-3.5 w-3.5" />
        <span>{copy.workspaceReady}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {copy.readinessItems.map((item, index) => {
          const Icon = READINESS_ICONS[index] ?? Sparkles;
          const isModelItem = index === copy.readinessItems.length - 1;
          const ready = isModelItem ? modelReady : true;
          const statusLabel = isModelItem
            ? modelUnknown
              ? locale === "zh"
                ? "检测中"
                : "Checking"
              : ready
                ? copy.modelReady
                : copy.modelMissing
            : locale === "zh"
              ? "完成"
              : "Done";

          return (
            <div
              key={item}
              className="flex min-w-[132px] flex-1 items-center justify-between gap-2 rounded-xl border border-violet-100 bg-gradient-to-r from-white to-violet-50/60 px-3 py-2 text-xs text-slate-700"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                <span className="truncate">{item}</span>
              </span>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold",
                  ready ? "text-emerald-600" : isModelItem && !modelUnknown ? "text-amber-600" : "text-slate-500"
                )}
              >
                {ready ? <Check className="h-3 w-3" /> : null}
                <span>{statusLabel}</span>
              </span>
            </div>
          );
        })}
      </div>
      {modelConfigured === false ? (
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
          {copy.modelMissingHint}
        </p>
      ) : null}
    </div>
  );
}

function inferPageContext(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const projectIndex = parts.indexOf("projects");
  const orderIndex = parts.indexOf("orders");
  const reviewIndex = parts.indexOf("review");
  const attributionIndex = parts.indexOf("attribution");
  const entityType = projectIndex >= 0
    ? "project"
    : orderIndex >= 0
      ? "order"
      : reviewIndex >= 0
        ? "review"
        : attributionIndex >= 0
          ? "attribution"
          : null;
  const entityId =
    projectIndex >= 0
      ? parts[projectIndex + 1]
      : orderIndex >= 0
        ? parts[orderIndex + 1]
        : reviewIndex >= 0
          ? parts[reviewIndex + 1]
          : attributionIndex >= 0
            ? parts[attributionIndex + 1]
            : null;

  return {
    pagePath: pathname,
    entityType,
    entityId: entityType && entityId ? entityId : null
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

function copilotRoleFromPath(pathRole: ReturnType<typeof roleKindFromPath>, authRole?: string) {
  if (pathRole === "creator") return "CREATOR";
  if (pathRole === "brand") return "BRAND";
  if (pathRole === "admin") return "ADMIN";
  if (authRole === "CREATOR" || authRole === "BRAND" || authRole === "ADMIN" || authRole === "SUPPORT") {
    return authRole;
  }
  return "BRAND";
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
    return "我可以帮你分析当前项目的归因数据，看看哪些渠道、创作者或内容带来了更好的效果。";
  }
  if (pathname.startsWith("/studio/ai") || pathname.startsWith("/studio/copilot")) {
    return "这里是你的智能工作台。我可以帮你查看最近的邀请、订单、收益和主页优化建议。";
  }
  if (role === "creator") {
    return "我可以帮你查看邀请、订单、收益、作品表现，也可以帮你分析主页哪里还能优化。";
  }
  if (role === "brand") {
    return "我可以帮你查看项目、推荐创作者、分析广告表现，也可以协助你整理下一步计划。";
  }
  if (role === "admin") {
    return "我可以帮你查看平台状态、订单异常、提现申请、用户数据和需要处理的运营事项。";
  }
  return "你可以告诉我今天想处理什么，我会帮你把重点和下一步整理出来。";
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
  if (typeof window === "undefined") {
    return { x: 320, y: 520 };
  }

  return normalizeLauncherPosition({
    x: window.innerWidth - FLOATING_LAUNCHER_EDGE_OFFSET - FLOATING_LAUNCHER_SIZE,
    y: window.innerHeight - FLOATING_LAUNCHER_BOTTOM_SAFE - FLOATING_LAUNCHER_SIZE
  });
}

function normalizeLauncherPosition(position: FloatingLauncherPosition): FloatingLauncherPosition {
  return {
    x: clampLauncherX(position.x),
    y: clampLauncherY(position.y)
  };
}

function readStoredLauncherPosition(): FloatingLauncherPosition {
  if (typeof window === "undefined") return defaultLauncherPosition();

  try {
    const stored = window.localStorage.getItem(FLOATING_LAUNCHER_STORAGE_KEY);
    if (!stored) return defaultLauncherPosition();
    const parsed = JSON.parse(stored) as Partial<FloatingLauncherPosition> & {
      side?: "left" | "right";
      y?: number;
    };
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return normalizeLauncherPosition({ x: parsed.x, y: parsed.y });
    }
    if ((parsed.side === "left" || parsed.side === "right") && typeof parsed.y === "number") {
      const x =
        parsed.side === "left"
          ? FLOATING_LAUNCHER_EDGE_OFFSET
          : window.innerWidth - FLOATING_LAUNCHER_EDGE_OFFSET - FLOATING_LAUNCHER_SIZE;
      return normalizeLauncherPosition({ x, y: parsed.y });
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
  const [expanded, setExpanded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authMe, setAuthMe] = useState<AuthMeData | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(copy.defaultSuggestions);
  const [workspace, setWorkspace] = useState<SessionListData["workspace"] | null>(null);
  const [localHour, setLocalHour] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);
  const [launcherPosition, setLauncherPosition] = useState<FloatingLauncherPosition>(() => readStoredLauncherPosition());
  const [isLauncherDragging, setIsLauncherDragging] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const launcherButtonRef = useRef<HTMLButtonElement | null>(null);
  const launcherDragRef = useRef<FloatingLauncherDrag | null>(null);
  const suppressLauncherClickRef = useRef(false);
  const sessionRestoreOnOpenRef = useRef(false);

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
  const sessionDetailUrl = useMemo(() => {
    if (!sessionId) return null;
    const params = new URLSearchParams();
    params.set("sessionId", sessionId);
    if (pageContext.languageCode) params.set("languageCode", pageContext.languageCode);
    return `/api/ai-copilot?${params.toString()}`;
  }, [pageContext.languageCode, sessionId]);
  const roleKind = roleKindFromPath(pathname);
  const copilotRole = copilotRoleFromPath(roleKind, authMe?.role);
  const instantDisplayName = useMemo(() => {
    if (authMe?.email) {
      return resolveCopilotDisplayNameFromUser(authMe, copilotRole);
    }
    return fallbackDisplayName(roleKind, locale);
  }, [authMe, copilotRole, roleKind, locale]);
  const displayName = workspace?.displayName?.trim() || instantDisplayName;
  const modelConfigured = workspace?.model?.configured ?? null;
  const introTitle =
    localHour == null
      ? locale === "zh"
        ? `你好，${displayName} 😊`
        : `Hi, ${displayName} 😊`
      : `${localGreetingPrefix(locale, localHour)}${locale === "zh" ? "，" : ", "}${displayName} 😊`;
  const introBody = welcomeBody({ pathname, role: roleKind, locale });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/auth/me", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as ApiResponse<AuthMeData> | null;
        if (!response.ok || !payload?.success || !payload.data?.id) {
          syncLucienChatAuthUser(null);
          return null;
        }
        return payload.data;
      })
      .then((resolvedUser) => {
        if (cancelled || !resolvedUser?.id) return;
        setAuthMe(resolvedUser);
        syncLucienChatAuthUser(resolvedUser.id);
        setUserId(resolvedUser.id);
        const stored = readAuthLucienChat(resolvedUser.id, "workspace");
        if (!stored) return;
        setSessionId(stored.sessionId ?? null);
        if (stored.messages.length > 0) setMessages(stored.messages);
        if (stored.suggestions.length > 0) setSuggestions(stored.suggestions);
      })
      .catch(() => {
        if (!cancelled) syncLucienChatAuthUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    return installAuthLucienChatIdleGuard(userId, "workspace", () => {
      setSessionId(null);
      setMessages([]);
      setSuggestions(copy.defaultSuggestions);
    });
  }, [copy.defaultSuggestions, userId]);

  useEffect(() => {
    if (!userId || messages.length === 0) return;
    writeAuthLucienChat(userId, "workspace", {
      messages,
      suggestions,
      sessionId,
      lastActivityAt: Date.now()
    });
  }, [messages, sessionId, suggestions, userId]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    setLauncherPosition(readStoredLauncherPosition());

    const handleResize = () => {
      setLauncherPosition((current) => {
        const next = normalizeLauncherPosition(current);
        storeLauncherPosition(next);
        return next;
      });
      setIsLauncherDragging(false);
      launcherDragRef.current = null;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    if (!open) {
      sessionRestoreOnOpenRef.current = false;
      return;
    }
    if (sessionRestoreOnOpenRef.current || !sessionDetailUrl) return;
    sessionRestoreOnOpenRef.current = true;

    let cancelled = false;
    const controller = new AbortController();
    fetch(sessionDetailUrl, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as ApiResponse<SessionDetailData> | null;
        if (!response.ok || !payload?.success || !payload.data?.session) {
          throw new Error(payload?.error?.message ?? copy.unavailable);
        }
        return payload.data;
      })
      .then((data) => {
        if (cancelled) return;
        setSessionId(data.session.id);
        setMessages(
          data.session.messages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            feedback: message.feedback ?? null
          }))
        );
        if (data.suggestedQuestions.length > 0) {
          setSuggestions(data.suggestedQuestions);
        }
      })
      .catch((err) => {
        if (cancelled || isAbortError(err)) return;
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [copy.unavailable, open, sessionDetailUrl]);

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
      const modelConfigured = data.modelConfigured;
      if (modelConfigured === true || modelConfigured === false) {
        setWorkspace((current) => ({
          displayName: current?.displayName ?? displayName,
          workspaceName: current?.workspaceName ?? displayName,
          roleLabel: current?.roleLabel ?? "",
          model: {
            configured: modelConfigured,
            model: current?.model?.model ?? "gpt-4o-mini"
          }
        }));
      }
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

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    button.setPointerCapture(event.pointerId);

    const drag: FloatingLauncherDrag = {
      pointerId: event.pointerId,
      offsetX,
      offsetY,
      startX: event.clientX,
      startY: event.clientY,
      lastX: rect.left,
      lastY: rect.top,
      moved: false
    };
    launcherDragRef.current = drag;
    setIsLauncherDragging(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const current = launcherDragRef.current;
      if (!current || moveEvent.pointerId !== current.pointerId) return;

      const next = normalizeLauncherPosition({
        x: moveEvent.clientX - current.offsetX,
        y: moveEvent.clientY - current.offsetY
      });
      const moved =
        current.moved ||
        Math.hypot(moveEvent.clientX - current.startX, moveEvent.clientY - current.startY) >
          FLOATING_LAUNCHER_CLICK_THRESHOLD;

      launcherDragRef.current = { ...current, lastX: next.x, lastY: next.y, moved };
      setLauncherPosition(next);
    };

    const finishDrag = (endEvent: PointerEvent) => {
      const current = launcherDragRef.current;
      if (!current || endEvent.pointerId !== current.pointerId) return;

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);

      const buttonNode = launcherButtonRef.current;
      if (buttonNode?.hasPointerCapture(endEvent.pointerId)) {
        buttonNode.releasePointerCapture(endEvent.pointerId);
      }

      const next = normalizeLauncherPosition({ x: current.lastX, y: current.lastY });
      setLauncherPosition(next);
      storeLauncherPosition(next);
      setIsLauncherDragging(false);
      suppressLauncherClickRef.current = current.moved;
      launcherDragRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
  }

  function openLauncher() {
    if (suppressLauncherClickRef.current) {
      suppressLauncherClickRef.current = false;
      return;
    }
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
    setExpanded(false);
  }

  const launcherStyle = {
    left: `${launcherPosition.x}px`,
    top: `${launcherPosition.y}px`
  };

  const drawerUi = (
    <>
      <Button
        ref={launcherButtonRef}
        type="button"
        aria-label={copy.launcher}
        title={copy.launcher}
        onClick={openLauncher}
        onPointerDown={startLauncherDrag}
        style={launcherStyle}
        className={cn(
          "fixed z-[200] h-12 w-12 touch-none select-none rounded-full border-0 bg-white p-0 shadow-[0_12px_28px_rgba(15,23,42,0.18)] ring-1 ring-violet-100/90",
          isLauncherDragging ? "cursor-grabbing transition-none" : "cursor-grab"
        )}
      >
        <LucienAvatar
          size="md"
          alt={copy.launcher}
          className="shadow-none ring-0"
        />
        <span className="sr-only">{copy.launcher}</span>
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[200] flex h-[100dvh] max-h-[100dvh] justify-end overflow-hidden bg-slate-950/30 backdrop-blur-[1px]">
          <aside
            className={cn(
              "flex h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-col overflow-hidden border-l border-violet-100 bg-[#fbfbff] shadow-2xl transition-all duration-300",
              expanded ? "max-w-none" : "max-w-[460px]"
            )}
          >
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setExpanded((value) => !value)}
                    aria-label={expanded ? copy.collapse : copy.expand}
                    title={expanded ? copy.collapse : copy.expand}
                    aria-pressed={expanded}
                  >
                    {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={closeDrawer}>
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
              <WorkspaceReadinessStrip copy={copy} locale={locale} modelConfigured={modelConfigured} />
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

  if (!portalReady) return null;
  return createPortal(drawerUi, document.body);
}
