"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import {
  CircleDollarSign,
  MessageSquare,
  Send,
  Sparkles,
  Upload
} from "lucide-react";

const copy = {
  en: {
    aiTitle: "AI Assistant",
    online: "Online",
    aiGreeting: "Hi — I'm your AI project assistant. I can help optimize matching, review your budget, or suggest brief improvements.",
    quick1: "How to improve match quality?",
    quick2: "Is my budget reasonable?",
    quick3: "What should I revise in the brief?",
    placeholder: "Ask about this project…",
    quickActions: "Quick actions",
    uploadVersion: "Upload new version",
    uploadHint: "Submit the latest deliverable",
    sendMessage: "Send message",
    sendHint: "Contact accepted creators",
    adjustBudget: "Adjust budget",
    adjustHint: "Increase budget for more matches"
  },
  zh: {
    aiTitle: "AI 助理",
    online: "在线",
    aiGreeting: "Hi，我是你的 AI 项目助理。我可以帮你优化匹配质量、评估预算，或建议如何完善需求。",
    quick1: "如何提高匹配质量？",
    quick2: "预算是否合理？",
    quick3: "需要修改哪些需求？",
    placeholder: "询问关于此项目的问题…",
    quickActions: "快速操作",
    uploadVersion: "上传新版本",
    uploadHint: "提交最新作品版本",
    sendMessage: "发送消息",
    sendHint: "联系已接受的 Creator",
    adjustBudget: "调整预算",
    adjustHint: "增加预算以获得更多匹配"
  }
};

const quickReplies = ["quick1", "quick2", "quick3"] as const;

export function BrandProjectOverviewSidebar({
  locale,
  projectId,
  hasDeliverables,
  canMessage
}: {
  locale: Locale;
  projectId: string;
  hasDeliverables: boolean;
  canMessage: boolean;
}) {
  const t = copy[locale];
  const [draft, setDraft] = useState("");

  function openAiAssistant(prompt?: string) {
    const base = withLocale(brandPortalRoutes.aiAssistant, locale);
    if (!prompt) {
      window.location.href = base;
      return;
    }
    const url = `${base}?q=${encodeURIComponent(prompt)}`;
    window.location.href = url;
  }

  return (
    <aside className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-zinc-950">{t.aiTitle}</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t.online}
          </span>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="rounded-xl bg-violet-50/80 px-3.5 py-3 text-sm leading-relaxed text-zinc-700">
            {t.aiGreeting}
          </div>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => openAiAssistant(t[key])}
                className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-50"
              >
                {t[key]}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              openAiAssistant(draft.trim());
              setDraft("");
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.placeholder}
              className="h-10 flex-1 rounded-xl"
            />
            <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3.5">
          <h3 className="text-sm font-semibold text-zinc-950">{t.quickActions}</h3>
        </div>
        <ul className="divide-y divide-zinc-100">
          <li>
            <Link
              href={withLocale(hasDeliverables ? brandPortalRoutes.projectReview(projectId) : brandPortalRoutes.project(projectId), locale)}
              className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-zinc-50"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Upload className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900">{t.uploadVersion}</p>
                <p className="text-xs text-zinc-500">{t.uploadHint}</p>
              </div>
            </Link>
          </li>
          {canMessage ? (
            <li>
              <Link
                href={withLocale(`${brandPortalRoutes.messages}?tab=project`, locale)}
                className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-zinc-50"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{t.sendMessage}</p>
                  <p className="text-xs text-zinc-500">{t.sendHint}</p>
                </div>
              </Link>
            </li>
          ) : null}
          <li>
            <button
              type="button"
              onClick={() => openAiAssistant(locale === "zh" ? "帮我评估预算是否合理" : "Help me evaluate if my budget is reasonable")}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-zinc-50"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <CircleDollarSign className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900">{t.adjustBudget}</p>
                <p className="text-xs text-zinc-500">{t.adjustHint}</p>
              </div>
            </button>
          </li>
        </ul>
      </section>
    </aside>
  );
}
