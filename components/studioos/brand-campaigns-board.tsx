"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard";
import {
  brandAdLifecycleBucket,
  brandAdLifecycleFilters,
  brandAdLifecycleLabels,
  countBrandRowsByLifecycle,
  filterBrandRowsByLifecycle,
  type BrandAdLifecycleFilter
} from "@/lib/studioos/brand-lifecycle";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { cn, formatDate } from "@/lib/utils";
import { ArrowUpRight, Megaphone, Plus, Search } from "lucide-react";

type Props = {
  locale: Locale;
  rows: BrandProjectRow[];
};

const copy = {
  en: {
    title: "My ads",
    subtitle: "The full ad lifecycle — from draft to delivery.",
    new: "Publish ad",
    search: "Search ads…",
    empty: "No ads yet",
    emptyBody: "Publish your first ad brief to start recruiting creators.",
    emptyFiltered: "No ads in this stage.",
    open: "Open"
  },
  zh: {
    title: "我的广告",
    subtitle: "广告全生命周期 — 从草稿到交付。",
    new: "发布广告",
    search: "搜索广告…",
    empty: "还没有广告",
    emptyBody: "发布第一条广告需求，开始招募创作者。",
    emptyFiltered: "当前阶段没有广告。",
    open: "打开"
  }
};

function rowHref(row: BrandProjectRow) {
  return row.kind === "campaign" ? brandPortalRoutes.project(row.id) : row.href;
}

export function BrandCampaignsBoard({ locale, rows }: Props) {
  const t = copy[locale];
  const labels = brandAdLifecycleLabels[locale];
  const [filter, setFilter] = useState<BrandAdLifecycleFilter>("all");
  const [query, setQuery] = useState("");
  const counts = useMemo(() => countBrandRowsByLifecycle(rows), [rows]);

  const filtered = useMemo(() => {
    const byLifecycle = filterBrandRowsByLifecycle(rows, filter);
    const q = query.trim().toLowerCase();
    if (!q) return byLifecycle;
    return byLifecycle.filter((row) => row.name.toLowerCase().includes(q));
  }, [rows, filter, query]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{t.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
        </div>
        <BrandStartBriefButton
          locale={locale}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          {t.new}
        </BrandStartBriefButton>
      </header>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {brandAdLifecycleFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                filter === item
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
              )}
            >
              {labels[item]}
              <span className="ml-1.5 tabular-nums opacity-80">{counts[item]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full xl:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            className="h-10 rounded-full border-zinc-200 bg-white pl-9"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        {filtered.length ? (
          <ul className="divide-y divide-zinc-100">
            {filtered.map((row) => {
              const bucket = brandAdLifecycleBucket(String(row.status));
              const statusLabel = labels[bucket];
              return (
                <li key={`${row.kind}-${row.id}`}>
                  <Link
                    href={withLocale(rowHref(row), locale)}
                    className="flex flex-col gap-3 px-5 py-4 transition hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-zinc-950">{row.name}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {statusLabel} · {formatDate(row.updatedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                        {statusLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700">
                        {t.open}
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <Megaphone className="h-6 w-6" />
            </span>
            <div>
              <p className="font-medium text-zinc-950">{rows.length ? t.emptyFiltered : t.empty}</p>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">{t.emptyBody}</p>
            </div>
            {!rows.length ? (
              <BrandStartBriefButton
                locale={locale}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                {t.new}
              </BrandStartBriefButton>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
