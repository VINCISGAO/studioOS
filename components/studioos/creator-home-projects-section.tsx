"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { CreatorHomeProjectRow, CreatorProjectTab } from "@/lib/studioos/creator-home-ui";
import { countProjectsForTab, matchesProjectTab, projectStatusToneClass } from "@/lib/studioos/creator-home-ui";
import { formatSettlementUsd } from "@/lib/money/display-money";
import { cn } from "@/lib/utils";

function brandInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "B";
}

export function CreatorHomeProjectsSection({
  locale,
  title,
  viewAllHref,
  viewAllLabel,
  detailLabel,
  progressLabel,
  tabLabels,
  projects
}: {
  locale: Locale;
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  detailLabel: string;
  progressLabel: string;
  tabLabels: Record<Exclude<CreatorProjectTab, "all">, string> & { all: string };
  projects: CreatorHomeProjectRow[];
}) {
  const [tab, setTab] = useState<CreatorProjectTab>("all");

  const tabCounts = useMemo(
    () => ({
      all: countProjectsForTab(projects, "all"),
      production: countProjectsForTab(projects, "production"),
      review: countProjectsForTab(projects, "review"),
      pending: countProjectsForTab(projects, "pending"),
      completed: countProjectsForTab(projects, "completed")
    }),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((item) => matchesProjectTab(item, tab));
  }, [projects, tab]);

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
        <Link href={viewAllHref} className="text-sm font-medium text-violet-600 hover:text-violet-700">
          {viewAllLabel} <ChevronRight className="ml-1 inline h-4 w-4" />
        </Link>
      </div>
      <div className="flex flex-wrap gap-5 border-b border-zinc-100 px-5 sm:px-6">
        {(Object.keys(tabLabels) as CreatorProjectTab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "border-b-2 py-3 text-sm font-medium transition",
              tab === key
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            )}
          >
            {tabLabels[key]} ({tabCounts[key]})
          </button>
        ))}
      </div>
      <ul className="divide-y divide-zinc-100">
        {filteredProjects.map((project) => (
          <li key={project.id}>
            <Link
              href={project.href}
              className="flex flex-col gap-4 px-5 py-4 transition hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:px-6"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {project.thumbnailUrl ? (
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                    <Image
                      src={project.thumbnailUrl}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 text-lg font-semibold text-zinc-500">
                    {brandInitial(project.brand)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-950">{project.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {project.brand} · {project.code}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <span className="text-sm font-semibold text-zinc-900">{formatSettlementUsd(project.budget, locale)}</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                    projectStatusToneClass(project.statusTone)
                  )}
                >
                  {project.statusLabel}
                </span>
                <span className="text-xs text-zinc-500">{project.dateLabel}</span>
                {project.progress ? (
                  <div className="w-28">
                    <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
                      <span>{progressLabel}</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-violet-600"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                <span className="text-sm font-medium text-violet-600">
                  {project.actionLabel ?? detailLabel} {locale === "zh" ? ">" : "›"}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
