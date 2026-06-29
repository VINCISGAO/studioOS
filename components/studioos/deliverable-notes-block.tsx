import type { Locale } from "@/lib/i18n";
import type { DeliverableNotesView } from "@/lib/studioos/deliverable-notes";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

export function DeliverableNotesBlock({
  locale,
  view,
  className
}: {
  locale: Locale;
  view: DeliverableNotesView;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {view.showTranslationBadge ? (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <Languages className="h-3.5 w-3.5" />
          {locale === "zh" ? "已自动翻译为品牌语言" : "Auto-translated for the brand"}
        </p>
      ) : null}
      <p className="text-sm leading-6 text-zinc-700">{view.primary}</p>
      {view.secondary && view.secondary !== view.primary ? (
        <p className="text-xs leading-5 text-zinc-500">
          {view.secondaryLabel ? `${view.secondaryLabel}: ` : ""}
          {view.secondary}
        </p>
      ) : null}
    </div>
  );
}
