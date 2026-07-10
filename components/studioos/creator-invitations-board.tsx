"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clapperboard, Clock, X } from "lucide-react";
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
      "Review project details before you respond. Accepting an invitation puts you on the brand shortlist — not a confirmed booking. Production starts only after the brand selects you and completes escrow payment.",
    empty: "No invitations in this tab.",
    uploadTitle: "Where to upload Version 1",
    uploadHint: "After the brand selects you and pays escrow, open Order management, enter the project, then open the review center to upload Version 1.",
    openProjects: "Open order management"
  },
  zh: {
    title: "项目邀请",
    subtitle: "请先点击「项目详情」了解品牌需求，再决定是否接受。接受邀请只表示合作意向，不等于正式中标。品牌选定你并完成托管付款后，项目才会正式开始。",
    empty: "当前分类下没有邀请。",
    uploadTitle: "第一版视频在哪里上传？",
    uploadHint: "品牌选中你并完成托管付款后，到「订单管理」进入对应项目，再打开「审片中心」上传 Version 1。",
    openProjects: "打开订单管理"
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const counts = useMemo(() => countInvitationsByTab(invitations), [invitations]);
  const filtered = useMemo(() => filterInvitationsByTab(invitations, tab), [invitations, tab]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function selectTab(nextTab: CreatorInvitationTab) {
    setTab(nextTab);
    setPage(1);
    setActionError(null);
  }

  function handleRespond(nextTab: CreatorInvitationTab) {
    setActingId(null);
    setActionError(null);
    setTab(nextTab);
    setPage(1);
  }

  function handleActionError(code: string) {
    setActingId(null);
    setActionError(
      code === "recruitment-closed"
        ? locale === "zh"
          ? "该项目招募已结束，无法接受或拒绝。"
          : "Recruitment for this project is closed."
        : code === "not-pending"
          ? locale === "zh"
            ? "该邀请状态已更新，请刷新页面后重试。"
            : "This invitation was already updated. Refresh and try again."
          : locale === "zh"
            ? "操作失败，请稍后重试。"
            : "Something went wrong. Please try again."
    );
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

      <div className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
            <Clapperboard className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-violet-950">{t.uploadTitle}</p>
            <p className="mt-1 text-sm leading-6 text-violet-800/80">{t.uploadHint}</p>
          </div>
        </div>
        <a
          href={locale === "zh" ? "/studio/projects?lang=zh" : "/studio/projects?lang=en"}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-medium text-white transition hover:bg-violet-700"
        >
          {t.openProjects}
        </a>
      </div>

      {actionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</div>
      ) : null}

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
              onRespond={handleRespond}
              onActionError={handleActionError}
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
