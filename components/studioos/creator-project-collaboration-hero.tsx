"use client";

import Link from "next/link";
import { ArrowRight, Film, Lightbulb, MessageCircle, Sparkles } from "lucide-react";
import { CreativeCollaborationPanel } from "@/components/studioos/creative-collaboration-panel";
import { Button } from "@/components/ui/button";
import type { CreativeCollaborationView } from "@/features/creative-collaboration/creative-collaboration.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

const copy = {
  zh: {
    title: "AI 创意协作",
    subtitle: "让 AI 帮你激发灵感，生成脚本、分镜与创意建议",
    script: "生成脚本",
    storyboard: "生成分镜",
    suggest: "创意建议",
    askAi: "问 AI",
    openWorkbench: "打开 AI 工作台"
  },
  en: {
    title: "AI Creative Collaboration",
    subtitle: "Let AI spark ideas — scripts, storyboards, and creative suggestions",
    script: "Generate script",
    storyboard: "Generate storyboard",
    suggest: "Creative tips",
    askAi: "Ask AI",
    openWorkbench: "Open AI workbench"
  }
};

const quickActions = [
  { key: "script", icon: Film },
  { key: "storyboard", icon: Lightbulb },
  { key: "suggest", icon: Sparkles },
  { key: "askAi", icon: MessageCircle }
] as const;

export function CreatorProjectCollaborationHero({
  locale,
  projectId,
  orderId,
  aiEnabled,
  collaborationView
}: {
  locale: Locale;
  projectId: string;
  orderId: string;
  aiEnabled: boolean;
  collaborationView: CreativeCollaborationView;
}) {
  const t = copy[locale];
  const aiHref = withLocale(creatorPortalRoutes.aiAssistant, locale);

  return (
    <section
      id="ai-collaboration"
      className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/90 via-white to-violet-50/40 shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b border-violet-100/80 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-950">
            <Sparkles className="h-5 w-5 text-violet-600" />
            {t.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
        </div>
        <Button asChild variant="outline" className="h-9 shrink-0 rounded-xl border-violet-200 text-violet-700">
          <Link href={aiHref}>
            {t.openWorkbench}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 px-5 py-4 sm:grid-cols-4 sm:px-6">
        {quickActions.map(({ key, icon: Icon }) => (
          <Link
            key={key}
            href={aiHref}
            className="flex items-center justify-center gap-2 rounded-xl border border-violet-100 bg-white/80 px-3 py-2.5 text-xs font-medium text-violet-800 transition hover:bg-violet-50 sm:text-sm"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t[key]}
          </Link>
        ))}
      </div>

      <div className="border-t border-violet-100/80 bg-white/60 px-5 py-4 sm:px-6 [&_section]:border-0 [&_section]:bg-transparent [&_section]:p-0 [&_section]:shadow-none">
        <CreativeCollaborationPanel
          locale={locale}
          projectId={projectId}
          orderId={orderId}
          role="creator"
          aiEnabled={aiEnabled}
          initialView={collaborationView}
        />
      </div>
    </section>
  );
}
