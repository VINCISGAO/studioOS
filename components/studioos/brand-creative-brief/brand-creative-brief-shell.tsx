"use client";

import { useEffect, useState } from "react";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import { Button } from "@/components/ui/button";
import { CREATIVE_BRIEF_SECTIONS } from "@/lib/studioos/brand-creative-brief-options";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bot,
  CircleDollarSign,
  Clapperboard,
  FileText,
  FolderOpen,
  Layers3,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const copy = {
  zh: {
    create: "需求创建",
    title: "创建您的创意需求",
    subtitle: "请尽可能详细地描述您的需求，AI 帮助您匹配最合适的创作团队",
    aiBeta: "AI 创意助手",
    aiBody: "不知道怎么写？试试和 AI 聊聊，帮你完善创意需求。",
    aiCta: "开始对话",
    tips: "填写小贴士",
    tipItems: [
      "产品链接越完整，AI 分析越准确",
      "参考视频能显著提升匹配质量",
      "预算与周期请按真实预期填写"
    ],
    saveDraft: "保存草稿",
    savingDraft: "保存中…",
    continue: "继续",
    continuePending: "继续中…",
    draftSaved: "草稿已自动保存",
    optionalTag: "选填"
  },
  en: {
    create: "Create brief",
    title: "Create your creative brief",
    subtitle: "Describe your needs in detail — AI will help match the best creative team.",
    aiBeta: "AI Creative Assistant",
    aiBody: "Not sure how to write it? Chat with AI to refine your creative brief.",
    aiCta: "Start chat",
    tips: "Filling tips",
    tipItems: [
      "Complete product links improve AI analysis",
      "Reference videos improve match quality",
      "Enter realistic budget and timeline"
    ],
    saveDraft: "Save draft",
    savingDraft: "Saving…",
    continue: "Continue",
    continuePending: "Continuing…",
    draftSaved: "Draft auto-saved",
    optionalTag: "Optional"
  }
};

const sectionIcons = {
  overview: FileText,
  creative: Lightbulb,
  production: Clapperboard,
  assets: FolderOpen,
  details: Layers3,
  budget: CircleDollarSign
};

function BriefInlineNotice({
  message,
  locale,
  onDismiss
}: {
  message: string;
  locale: Locale;
  onDismiss: () => void;
}) {
  const dismissLabel = locale === "zh" ? "知道了" : "Got it";

  return (
    <div className="fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-2rem)] max-w-[28rem] -translate-x-1/2 -translate-y-1/2">
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/95 shadow-[0_14px_44px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="flex items-center gap-3 bg-gradient-to-br from-emerald-50/90 via-white to-violet-50/80 px-3.5 py-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/15">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-5 text-zinc-950">
              {locale === "zh" ? "需要补充信息" : "More information needed"}
            </p>
            <p className="mt-0.5 text-sm leading-5 text-zinc-600">{message}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 hover:text-violet-800"
          >
            {dismissLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BrandCreativeBriefShell({
  locale,
  children,
  displayError,
  onSaveDraft,
  onContinue,
  isSavingDraft,
  isPending,
  continueDisabled
}: {
  locale: Locale;
  children: React.ReactNode;
  displayError: string | null;
  onSaveDraft?: () => void;
  onContinue: () => void;
  isSavingDraft?: boolean;
  isPending?: boolean;
  continueDisabled?: boolean;
}) {
  const t = copy[locale];
  const [activeSection, setActiveSection] = useState("overview");
  const [dismissedNotice, setDismissedNotice] = useState<string | null>(null);
  const showNotice = Boolean(displayError && displayError !== dismissedNotice);

  useEffect(() => {
    if (!displayError) {
      setDismissedNotice(null);
    }
  }, [displayError]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.getElementById("brand-wizard-scroll-panel")?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const sections = CREATIVE_BRIEF_SECTIONS.map((item) => item.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveSection(visible.target.id.replace("brief-section-", ""));
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] }
    );

    for (const id of sections) {
      const node = document.getElementById(`brief-section-${id}`);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  function scrollToSection(id: string) {
    document.getElementById(`brief-section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col lg:h-full">
      {displayError && showNotice ? (
        <BriefInlineNotice message={displayError} locale={locale} onDismiss={() => setDismissedNotice(displayError)} />
      ) : null}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-zinc-200/80 bg-white lg:flex">
          <MarketingHomeLink
            locale={locale}
            className="flex items-center gap-2.5 px-5 py-5 transition hover:opacity-80 lg:hidden"
          >
            <BrandLogoLockup
              contrastOn="light"
              markClassName="h-8 w-8 rounded-lg shadow-sm ring-1 ring-violet-100"
              wordmarkClassName="h-[17px] w-[106px]"
            />
          </MarketingHomeLink>

          <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 pt-5 lg:pt-8">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-violet-600">{t.create}</p>
            {CREATIVE_BRIEF_SECTIONS.map((section) => {
              const Icon = sectionIcons[section.id];
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                    active
                      ? "bg-violet-50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.12)]"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{section.label[locale]}</span>
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[10px] font-semibold",
                      active ? "bg-violet-600 text-white" : "bg-zinc-100 text-zinc-500"
                    )}
                  >
                    {section.number}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="space-y-3 px-3 pb-5">
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-violet-600" />
                <p className="text-sm font-semibold text-zinc-900">{t.aiBeta}</p>
                <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Beta
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600">{t.aiBody}</p>
              <Button type="button" variant="outline" size="sm" className="mt-3 h-8 w-full rounded-lg border-violet-200">
                {t.aiCta}
              </Button>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.tips}</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-600">
                {t.tipItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-violet-500">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
            <div className="px-4 py-3 lg:hidden sm:px-6">
              <MarketingHomeLink locale={locale} className="inline-flex transition hover:opacity-80">
                <BrandLogoLockup
                  contrastOn="light"
                  markClassName="h-8 w-8 rounded-lg shadow-sm ring-1 ring-violet-100"
                  wordmarkClassName="h-[17px] w-[106px]"
                />
              </MarketingHomeLink>
            </div>
            <div className="border-t border-zinc-100 px-4 pb-4 pt-3 sm:px-6 lg:border-t-0 lg:pt-4">
              <WizardStepper locale={locale} currentStep={1} variant="brand" />
            </div>
          </header>

          <div id="brand-wizard-scroll-panel" className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
              <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[28px]">{t.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">{t.subtitle}</p>
                <div className="mt-5 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_18px_60px_rgba(88,28,135,0.08)]">
                  <div className="bg-[radial-gradient(circle_at_6%_20%,rgba(124,58,237,0.16),transparent_28%),linear-gradient(135deg,#faf5ff_0%,#ffffff_56%,#ecfdf5_100%)] px-5 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/25">
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-base font-semibold tracking-tight text-zinc-950">
                            {locale === "zh" ? "VINCIS 智能制作估价引擎" : "VINCIS Production Pricing Engine"}
                          </p>
                          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-600">
                            {locale === "zh"
                              ? "不是按模型调用次数粗算价格，而是先估算可用镜头、生成倍率、创作者工时、修改和风险，再生成可成交的预算方案。"
                              : "Not a raw generation-cost calculator. It estimates usable shots, generation ratio, creator hours, revision cost, and risk before pricing."}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-2 text-xs sm:grid-cols-3 lg:min-w-[26rem]">
                        {(locale === "zh"
                          ? ["保障创作者利润", "品牌可自主加价", "平台覆盖交易风险"]
                          : ["Protect creator profit", "Brand-controlled upgrades", "Platform risk covered"]
                        ).map((item) => (
                          <div key={item} className="rounded-2xl bg-white/85 px-3 py-2 font-semibold text-zinc-700 shadow-sm ring-1 ring-violet-100">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-5 pb-32">{children}</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 backdrop-blur lg:left-[468px]">
        <div className="flex w-full flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 xl:px-10">
          <div className="min-h-[20px] flex-1">
            <p className="flex items-center gap-2 text-sm text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {t.draftSaved}
            </p>
          </div>
          <div className="flex gap-2">
            {onSaveDraft ? (
              <Button type="button" variant="outline" className="h-11 rounded-xl" disabled={continueDisabled} onClick={onSaveDraft}>
                {isSavingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSavingDraft ? t.savingDraft : t.saveDraft}
              </Button>
            ) : null}
            <Button type="button" className="h-11 rounded-xl bg-violet-600 px-6 hover:bg-violet-700" disabled={continueDisabled} onClick={onContinue}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isPending ? t.continuePending : t.continue}
              {!isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
