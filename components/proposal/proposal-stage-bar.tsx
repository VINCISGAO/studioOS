import type { ProposalStage } from "@/lib/studioos/project-contract";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const stages: { id: ProposalStage; label: { en: string; zh: string } }[] = [
  { id: "brief", label: { en: "AI Brief", zh: "AI Brief" } },
  { id: "match", label: { en: "Studio Match", zh: "创作者匹配" } },
  { id: "proposal", label: { en: "Proposal Room", zh: "Proposal Room" } },
  { id: "contract", label: { en: "Contract", zh: "合同确认" } },
  { id: "production", label: { en: "Production", zh: "制作" } },
  { id: "review", label: { en: "Timeline Review", zh: "时间轴审片" } },
  { id: "delivery", label: { en: "Delivery", zh: "交付" } }
];

const order: ProposalStage[] = ["brief", "match", "proposal", "contract", "production", "review", "delivery"];

export function ProposalStageBar({ locale, current }: { locale: Locale; current: ProposalStage }) {
  const currentIndex = order.indexOf(current);

  return (
    <ol className="flex flex-wrap gap-1 rounded-xl border border-zinc-200/80 bg-white p-2 text-xs">
      {stages.map((stage, index) => {
        const done = index < currentIndex;
        const active = stage.id === current;
        return (
          <li
            key={stage.id}
            className={cn(
              "rounded-lg px-2.5 py-1.5 font-medium",
              done && "bg-emerald-50 text-emerald-800",
              active && "bg-zinc-900 text-white",
              !done && !active && "text-zinc-400"
            )}
          >
            {stage.label[locale]}
          </li>
        );
      })}
    </ol>
  );
}
