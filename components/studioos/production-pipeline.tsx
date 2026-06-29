import type { PipelineStage } from "@/lib/studioos/pipeline";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";

export function ProductionPipeline({ locale, stages }: { locale: Locale; stages: PipelineStage[] }) {
  return (
    <ol className="relative space-y-0">
      {stages.map((stage, index) => (
        <li key={stage.id} className="relative flex gap-4 pb-8 last:pb-0">
          {index < stages.length - 1 ? (
            <span
              className={cn(
                "absolute left-[11px] top-6 h-[calc(100%-12px)] w-px",
                stage.status === "completed" ? "bg-emerald-400" : "bg-zinc-200"
              )}
            />
          ) : null}
          <span className="relative z-10 mt-0.5 shrink-0">
            {stage.status === "completed" ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            ) : stage.status === "in_progress" ? (
              <LoaderCircle className="h-6 w-6 animate-spin text-zinc-900" />
            ) : (
              <Circle className="h-6 w-6 text-zinc-300" />
            )}
          </span>
          <div className="min-w-0 flex-1 rounded-xl border border-zinc-200/80 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-zinc-900">{stage.label[locale]}</p>
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-wide",
                  stage.status === "completed" && "text-emerald-600",
                  stage.status === "in_progress" && "text-zinc-900",
                  stage.status === "pending" && "text-zinc-400"
                )}
              >
                {stage.status === "completed"
                  ? locale === "zh"
                    ? "已完成"
                    : "Completed"
                  : stage.status === "in_progress"
                    ? locale === "zh"
                      ? "进行中"
                      : "In progress"
                    : locale === "zh"
                      ? "待开始"
                      : "Pending"}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
