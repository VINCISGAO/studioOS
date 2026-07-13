"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function BriefModuleCard({
  title,
  icon: Icon,
  accent = "violet",
  children,
  className
}: {
  title: string;
  icon: LucideIcon;
  accent?: "violet" | "sky" | "emerald" | "amber";
  children: React.ReactNode;
  className?: string;
}) {
  const accentStyles = {
    violet: "border-violet-100 bg-violet-50/50 text-violet-700",
    sky: "border-sky-100 bg-sky-50/50 text-sky-700",
    emerald: "border-emerald-100 bg-emerald-50/50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50/50 text-amber-700"
  }[accent];

  return (
    <section
      className={cn(
        "rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
            accentStyles
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h4 className="text-sm font-semibold tracking-tight text-zinc-900">{title}</h4>
      </div>
      {children}
    </section>
  );
}

export function BriefStatPill({
  label,
  value,
  highlight
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  if (!value.trim()) return null;
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border px-3.5 py-2.5",
        highlight
          ? "border-violet-200 bg-violet-50/80"
          : "border-zinc-200/80 bg-zinc-50/60"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-semibold",
          highlight ? "text-violet-800" : "text-zinc-800"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function BriefTagGroup({ label, items }: { label: string; items: string[] }) {
  const filtered = items.filter((item) => item.trim());
  if (!filtered.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {filtered.map((item) => (
          <span
            key={item}
            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BriefSellingPointCard({
  priority,
  label
}: {
  priority: number;
  label: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-zinc-200/80 bg-gradient-to-r from-zinc-50/80 to-white p-3.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">
        {priority}
      </span>
      <p className="text-sm leading-relaxed text-zinc-800">{label}</p>
    </div>
  );
}

export function BriefGapCard({ message, suggestion }: { message: string; suggestion: string }) {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 px-4 py-3">
      <p className="text-sm font-semibold text-amber-950">{message}</p>
      <p className="mt-1 text-sm leading-relaxed text-amber-900/80">{suggestion}</p>
    </div>
  );
}
