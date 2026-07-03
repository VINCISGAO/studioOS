import type { ComponentType } from "react";
import {
  ArrowRight,
  Circle,
  MousePointer2,
  PenLine,
  Square,
  Trash2,
  Type,
  Undo2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

const tools: Array<{ icon: ComponentType<{ className?: string }>; label: string; active?: boolean }> = [
  { icon: MousePointer2, label: "Select", active: true },
  { icon: PenLine, label: "Pen" },
  { icon: ArrowRight, label: "Arrow" },
  { icon: Square, label: "Rectangle" },
  { icon: Circle, label: "Circle" },
  { icon: Type, label: "Text" },
  { icon: Trash2, label: "Delete" }
];

const labels = {
  zh: { undo: "撤销" },
  en: { undo: "Undo" }
};

export function ReviewerSkeletonToolbar({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <aside
      className="flex gap-2 rounded-xl border border-zinc-200 bg-white p-2 lg:flex-col"
      aria-label={locale === "zh" ? "审片工具栏" : "Review toolbar"}
    >
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.label}
            type="button"
            disabled
            title={tool.label}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-lg border text-zinc-400",
              tool.active ? "border-indigo-300 bg-indigo-50 text-indigo-600" : "border-zinc-200 bg-zinc-50"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
      <button
        type="button"
        disabled
        title={t.undo}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400"
      >
        <Undo2 className="h-4 w-4" />
      </button>
    </aside>
  );
}
