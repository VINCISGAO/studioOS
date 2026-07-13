"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickBriefSectionCard({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function QuickBriefSectionHeader({
  number,
  title,
  optional,
  icon: Icon,
  iconClassName
}: {
  number: number;
  title: string;
  optional?: string;
  icon?: LucideIcon;
  iconClassName?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
        {number}
      </span>
      <p className="text-sm font-semibold text-zinc-900">
        {title}
        {optional ? (
          <span className="ml-1 font-medium text-orange-500">{optional}</span>
        ) : null}
      </p>
      {Icon ? <Icon className={cn("h-3.5 w-3.5 shrink-0 text-zinc-400", iconClassName)} /> : null}
    </div>
  );
}
