"use client";

import { Sparkles } from "lucide-react";
import { CreativeCollaborationPanel } from "@/components/studioos/creative-collaboration-panel";
import type { CreativeCollaborationView } from "@/features/creative-collaboration/creative-collaboration.types";
import type { Locale } from "@/lib/i18n";

const copy = {
  zh: {
    title: "AI 创意协作",
    subtitle: "让 AI 帮你激发灵感，生成脚本、分镜与创意建议"
  },
  en: {
    title: "AI Creative Collaboration",
    subtitle: "Let AI spark ideas — scripts, storyboards, and creative suggestions"
  }
};

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
