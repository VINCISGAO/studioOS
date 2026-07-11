"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import { Button } from "@/components/ui/button";
import { CREATIVE_BRIEF_SECTIONS } from "@/lib/studioos/brand-creative-brief-options";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
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
    <div className="flex min-h-[100dvh] flex-col">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-zinc-200/80 bg-white xl:flex">
          <Link
            href={withLocale(brandPortalRoutes.dashboard, locale)}
            className="flex items-center gap-2.5 px-5 py-5 transition hover:opacity-80"
          >
            <BrandLogoLockup
              contrastOn="light"
              markClassName="h-8 w-8 rounded-lg shadow-sm ring-1 ring-violet-100"
              wordmarkClassName="h-[17px] w-[106px]"
            />
          </Link>

          <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
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

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6">
              <Link href={withLocale(brandPortalRoutes.dashboard, locale)} className="xl:hidden">
                <BrandLogoLockup
                  contrastOn="light"
                  markClassName="h-8 w-8 rounded-lg shadow-sm ring-1 ring-violet-100"
                  wordmarkClassName="h-[17px] w-[106px]"
                />
              </Link>
              <div className="flex items-center justify-end gap-2 xl:ml-auto">
              <LanguageSwitcher locale={locale} />
              {onSaveDraft ? (
                <Button type="button" variant="outline" className="hidden h-10 rounded-xl sm:inline-flex" onClick={onSaveDraft}>
                  {isSavingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSavingDraft ? t.savingDraft : t.saveDraft}
                </Button>
              ) : null}
              <Button
                type="button"
                className="h-10 rounded-xl bg-violet-600 px-5 hover:bg-violet-700"
                disabled={continueDisabled}
                onClick={onContinue}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPending ? t.continuePending : t.continue}
                {!isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
              </Button>
              </div>
            </div>
            <div className="border-t border-zinc-100 px-4 pb-4 sm:px-6">
              <WizardStepper locale={locale} currentStep={1} variant="brand" />
            </div>
          </header>

          <div id="brand-wizard-scroll-panel" className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
              <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[28px]">{t.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">{t.subtitle}</p>
              </div>
              <div className="space-y-5 pb-32">{children}</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 backdrop-blur xl:left-[220px]">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-h-[20px] flex-1">
            {displayError ? (
              <p className="text-sm text-red-600">{displayError}</p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-zinc-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                {t.draftSaved}
              </p>
            )}
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
