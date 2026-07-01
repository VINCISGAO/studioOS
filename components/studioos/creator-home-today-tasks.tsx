"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CreatorPendingTaskCard } from "@/lib/studioos/creator-home-ui";
import { cn } from "@/lib/utils";

const taskTone = {
  purple: "border-violet-100 bg-violet-50/70",
  blue: "border-blue-100 bg-blue-50/70",
  orange: "border-amber-100 bg-amber-50/70"
};

const taskButton = {
  purple: "bg-violet-600 hover:bg-violet-700",
  blue: "bg-blue-600 hover:bg-blue-700",
  orange: "bg-amber-500 hover:bg-amber-600"
};

export function CreatorHomeTodayTasks({
  title,
  viewAllHref,
  viewAllLabel,
  pendingTasks
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  pendingTasks: CreatorPendingTaskCard[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
          {pendingTasks.length ? (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
              {pendingTasks.length}
            </span>
          ) : null}
        </div>
        <Link href={viewAllHref} className="text-sm font-medium text-violet-600 hover:text-violet-700">
          {viewAllLabel} <ArrowRight className="ml-1 inline h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {pendingTasks.map((task) => (
          <div key={task.id} className={cn("rounded-2xl border p-4", taskTone[task.tone])}>
            <span className="inline-flex rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
              {task.tag}
            </span>
            <p className="mt-3 font-semibold text-zinc-950">{task.title}</p>
            <p className="mt-1 text-sm text-zinc-700">{task.subtitle}</p>
            {task.metaLines.map((line) => (
              <p key={line} className="mt-1 text-xs text-zinc-500">
                {line}
              </p>
            ))}
            <Button asChild size="sm" className={cn("mt-4 rounded-xl text-white", taskButton[task.tone])}>
              <Link href={task.href}>{task.actionLabel}</Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
