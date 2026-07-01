"use client";

import type { MessageStatCard } from "@/lib/studioos/creator-messages-ui";
import type { MessageCategory } from "@/components/studioos/studio-message-center.types";
import { cn } from "@/lib/utils";
import { Bell, DollarSign, FileText, MessageSquare, Monitor } from "lucide-react";

const iconTone: Record<MessageStatCard["icon"], string> = {
  all: "bg-violet-50 text-violet-600",
  project: "bg-blue-50 text-blue-600",
  brand: "bg-orange-50 text-orange-500",
  payment: "bg-emerald-50 text-emerald-600",
  system: "bg-sky-50 text-sky-600"
};

function StatIcon({ icon }: { icon: MessageStatCard["icon"] }) {
  const className = "h-4 w-4";
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

export function StudioMessagesStatCards({
  cards,
  activeCategory,
  onCategoryChange
}: {
  cards: MessageStatCard[];
  activeCategory: MessageCategory | "all";
  onCategoryChange: (category: MessageCategory | "all") => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onCategoryChange(card.key)}
          className={cn(
            "flex items-center justify-between rounded-[20px] border bg-white px-4 py-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-zinc-300",
            activeCategory === card.key ? "border-zinc-300 ring-1 ring-zinc-200" : "border-zinc-200/80"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconTone[card.icon])}>
              <StatIcon icon={card.icon} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">{card.label}</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">{card.count}</p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium text-zinc-400">{card.viewLabel}</span>
        </button>
      ))}
    </div>
  );
}
