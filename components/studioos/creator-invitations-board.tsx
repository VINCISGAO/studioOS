"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { CreatorInvitationCard } from "@/components/studioos/creator-invitation-card";
import type { CreatorInvitationCardModel } from "@/lib/studioos/creator-invitation-display";
import type { Locale } from "@/lib/i18n";
import {
  countInvitationsByTab,
  creatorInvitationTabLabels,
  creatorInvitationTabs,
  filterInvitationsByTab,
  type CreatorInvitationTab
} from "@/lib/studioos/creator-invitation-utils";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

const copy = {
  en: {
    title: "Project invitations",
    subtitle:
      "Accepting an invitation puts you on the brand shortlist — not a confirmed booking. Production starts only after the brand selects you.",
    empty: "No invitations in this tab."
  },
  zh: {
    title: "项目邀请",
    subtitle: "接受邀请只表示合作意向，不等于正式中标。品牌最终选定你后，项目才会正式开始。",
    empty: "当前分类下没有邀请。"
  }
} as const;

const tabIcons = {
  pending: Clock,
  accepted: Check,
  declined: X,
  expired: Clock
} as const;

export function CreatorInvitationsBoard({
  locale,
  invitations,
  orderByProjectId = {},
  initialTab = "pending"
}: {
  locale: Locale;
  invitations: CreatorInvitationCardModel[];
  orderByProjectId?: Record<string, string>;
  initialTab?: CreatorInvitationTab;
}) {
  const t = copy[locale];
  const labels = creatorInvitationTabLabels[locale];
  const [tab, setTab] = useState<CreatorInvitationTab>(initialTab);
  const [actingId, setActingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const counts = useMemo(() => countInvitationsByTab(invitations), [invitations]);
  const filtered = useMemo(() => filterInvitationsByTab(invitations, tab), [invitations, tab]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function selectTab(nextTab: CreatorInvitationTab) {
    setTab(nextTab);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[28px]">
          {t.title}
          {locale === "zh" ? (
            <span className="ml-1 inline-block text-[22px]" aria-hidden>
              ✨
            </span>
          ) : null}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500">{t.subtitle}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {creatorInvitationTabs.map((item) => {
          const Icon = tabIcons[item];
          const active = tab === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => selectTab(item)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900"
              )}
            >
              <Icon className={cn("h-4 w-4", item === "declined" && !active && "text-rose-500")} />
              {labels[item]}
              <span className={cn("tabular-nums", active ? "text-white/90" : "text-zinc-500")}>
                {counts[item]}
              </span>
            </button>
          );
        })}
      </div>

      <section className="space-y-4">
        {pageItems.length ? (
          pageItems.map((invitation) => (
            <CreatorInvitationCard
              key={invitation.id}
              locale={locale}
              invitation={invitation}
              orderId={orderByProjectId[invitation.campaignId]}
              actingId={actingId}
              onActing={setActingId}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
            <p className="text-sm text-zinc-500">{t.empty}</p>
          </div>
        )}
      </section>

      {filtered.length > 0 ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            aria-label={locale === "zh" ? "上一页" : "Previous page"}
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
            {currentPage}
          </span>
          <button
            type="button"
            aria-label={locale === "zh" ? "下一页" : "Next page"}
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
