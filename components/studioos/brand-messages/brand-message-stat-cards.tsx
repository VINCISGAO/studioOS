"use client";

import type { MessageStatCard } from "@/lib/studioos/creator-messages-ui";
import type { MessageCategory } from "@/components/studioos/studio-message-center.types";
import { cn } from "@/lib/utils";
import { Bell, ChevronRight, DollarSign, FileText, MessageSquare, Monitor } from "lucide-react";

const iconTone: Record<MessageStatCard["icon"], string> = {
  all: "bg-violet-100 text-violet-600",
  project: "bg-sky-100 text-sky-600",
  brand: "bg-orange-100 text-orange-500",
  payment: "bg-emerald-100 text-emerald-600",
  system: "bg-blue-100 text-blue-600"
};

function StatIcon({ icon }: { icon: MessageStatCard["icon"] }) {
  const className = "h-[18px] w-[18px]";
  switch (icon) {
    case "all":
      return <MessageSquare className={className} />;
    case "project":
      return <FileText className={className} />;
    case "brand":
      return <Bell className={className} />;
    case "payment":
      return <DollarSign className={className} />;
    case "system":
      return <Monitor className={className} />;
  }
}

export function BrandMessageStatCards({
  cards,
  activeCategory,
  onCategoryChange
}: {
  cards: MessageStatCard[];
  activeCategory: MessageCategory | "all";
  onCategoryChange: (category: MessageCategory | "all") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onCategoryChange(card.key)}
          className={cn(
            "flex min-h-[132px] flex-col rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-zinc-300",
            activeCategory === card.key ? "border-zinc-300 ring-1 ring-zinc-200" : "border-zinc-200/80"
          )}
        >
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconTone[card.icon])}>
            <StatIcon icon={card.icon} />
          </span>
          <p className="mt-3 text-xs text-zinc-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">{card.count}</p>
          <span className="mt-auto inline-flex items-center gap-0.5 pt-3 text-xs text-zinc-400">
            {card.viewLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </button>
      ))}
    </div>
  );
}
