"use client";

import { CREATIVE_BRIEF_SECTIONS } from "@/lib/studioos/brand-creative-brief-options";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  CircleDollarSign,
  Clapperboard,
  FileText,
  Layers3,
  Lightbulb
} from "lucide-react";

const sectionIcons: Record<(typeof CREATIVE_BRIEF_SECTIONS)[number]["id"], LucideIcon> = {
  overview: FileText,
  creative: Lightbulb,
  production: Clapperboard,
  details: Layers3,
  budget: CircleDollarSign
};

export function BrandCreativeBriefSectionNavTop({
  locale,
  activeSection,
  createLabel,
  onSelect
}: {
  locale: Locale;
  activeSection: string;
  createLabel: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      className="border-t border-zinc-100 px-4 py-3 sm:px-6 xl:hidden"
      aria-label={locale === "zh" ? "需求表单章节" : "Brief sections"}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-600">{createLabel}</p>
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CREATIVE_BRIEF_SECTIONS.map((section) => {
          const Icon = sectionIcons[section.id];
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm",
                active
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                  : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{section.label[locale]}</span>
              <span
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-white text-zinc-500"
                )}
              >
                {section.number}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function BrandCreativeBriefSectionNavSidebar({
  locale,
  activeSection,
  createLabel,
  onSelect
}: {
  locale: Locale;
  activeSection: string;
  createLabel: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="min-h-0 overflow-y-auto px-3 pb-4 pt-8">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-violet-600">{createLabel}</p>
      <div className="space-y-0.5">
        {CREATIVE_BRIEF_SECTIONS.map((section) => {
          const Icon = sectionIcons[section.id];
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
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
      </div>
    </nav>
  );
}
