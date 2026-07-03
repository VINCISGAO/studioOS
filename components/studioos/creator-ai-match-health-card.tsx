"use client";

import Link from "next/link";
import { Brain, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CreatorAiMatchHealth } from "@/lib/studioos/creator-ai-match-health";

export function CreatorAiMatchHealthCard({ health }: { health: CreatorAiMatchHealth }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-600">
            <Brain className="h-3.5 w-3.5" />
            AI Learning
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-zinc-950 sm:text-lg">{health.title}</h2>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {"★".repeat(health.stars)}
              {"☆".repeat(5 - health.stars)}
            </span>
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
              {health.accuracyPercent}%
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{health.body}</p>
        </div>
        <Button asChild variant="outline" className="h-10 shrink-0 rounded-xl bg-white">
          <Link href={health.ctaHref}>
            <Sparkles className="h-4 w-4" />
            {health.ctaLabel}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
