"use client";

import type { BrandTeamStatCard } from "@/lib/studioos/brand-team-ui";
import { cn } from "@/lib/utils";
import { FolderKanban, Shield, UserCheck, Users } from "lucide-react";

const iconTone: Record<BrandTeamStatCard["icon"], string> = {
  users: "bg-violet-50 text-violet-600",
  "user-check": "bg-emerald-50 text-emerald-600",
  shield: "bg-blue-50 text-blue-600",
  folder: "bg-orange-50 text-orange-500"
};

function StatIcon({ icon }: { icon: BrandTeamStatCard["icon"] }) {
  const className = "h-4 w-4";
  switch (icon) {
    case "users":
      return <Users className={className} />;
    case "user-check":
      return <UserCheck className={className} />;
    case "shield":
      return <Shield className={className} />;
    case "folder":
      return <FolderKanban className={className} />;
  }
}

export function BrandTeamStatCards({ cards }: { cards: BrandTeamStatCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="flex items-center justify-between rounded-[20px] border border-zinc-200/80 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                iconTone[card.icon]
              )}
            >
              <StatIcon icon={card.icon} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">{card.label}</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">{card.value}</p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium text-zinc-400">{card.hint}</span>
        </div>
      ))}
    </div>
  );
}
