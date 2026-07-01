"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronDown, Clock, ExternalLink, Hourglass } from "lucide-react";
import { selectCreatorFromInvitationsAction } from "@/app/brand-selection-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  buildAcceptedCreatorRow,
  estimatePendingReplyHours,
  formatPendingReplyEta,
  groupBrandMatchInvitations,
  resolveCreatorForInvitation
} from "@/lib/studioos/brand-match-display";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { creatorAvatarTone, creatorInitials } from "@/lib/studioos/creator-display";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Creator responses",
    waitMore: "Keep waiting for replies",
    waitingHint: "You can still select anytime — new acceptances will appear here.",
    accepted: (n: number) => `Accepted creators (${n})`,
    pending: (n: number) => `Awaiting reply (${n})`,
    declined: (n: number) => `Declined (${n})`,
    selectNow: "Select now",
    viewProfile: "View profile",
    match: "Match",
    emptyAccepted: "No acceptances yet — responses will appear here.",
    emptyPending: "All invited creators have responded.",
    emptyDeclined: "No declines yet."
  },
  zh: {
    title: "Creator 回复",
    waitMore: "继续等待更多回复",
    waitingHint: "你可随时选定 Creator — 新的接受者会实时出现在列表中。",
    accepted: (n: number) => `已接受 Creator (${n})`,
    pending: (n: number) => `等待回复 (${n})`,
    declined: (n: number) => `拒绝 (${n})`,
    selectNow: "立即选择",
    viewProfile: "查看主页",
    match: "匹配度",
    emptyAccepted: "还没有 Creator 接受 — 回复会显示在这里。",
    emptyPending: "所有邀请已收到回复。",
    emptyDeclined: "暂无拒绝。"
  }
};

function SelectCreatorForm({
  locale,
  projectId,
  creatorId,
  label
}: {
  locale: Locale;
  projectId: string;
  creatorId: string;
  label: string;
}) {
  return (
    <form action={selectCreatorFromInvitationsAction}>
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="creatorId" value={creatorId} />
      <Button type="submit" size="sm" className="h-9 rounded-xl bg-zinc-900 px-3.5 text-xs font-medium">
        <Check className="h-3.5 w-3.5" />
        {label}
      </Button>
    </form>
  );
}

function AcceptedRow({
  locale,
  projectId,
  invitation,
  projectBudgetRange
}: {
  locale: Locale;
  projectId: string;
  invitation: StoredCreatorInvitation;
  projectBudgetRange?: string | null;
}) {
  const t = copy[locale];
  const row = buildAcceptedCreatorRow(invitation, locale, projectBudgetRange);

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            creatorAvatarTone(invitation.creatorId)
          )}
        >
          {creatorInitials(row.name, invitation.creatorId)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-zinc-950">{row.name}</p>
            <span className="text-xs text-amber-600">{row.starDisplay}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
              {t.match} {row.matchPercent}%
            </span>
          </div>
          {row.creator?.headline ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{row.creator.headline}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:ml-4">
        <SelectCreatorForm
          locale={locale}
          projectId={projectId}
          creatorId={invitation.creatorId}
          label={t.selectNow}
        />
        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl px-3.5 text-xs">
          <Link href={withLocale(row.profileHref, locale)} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            {t.viewProfile}
          </Link>
        </Button>
      </div>
    </li>
  );
}

export function BrandProjectMatchBoard({
  locale,
  projectId,
  invitations,
  projectBudgetRange
}: {
  locale: Locale;
  projectId: string;
  invitations: StoredCreatorInvitation[];
  projectBudgetRange?: string | null;
}) {
  const t = copy[locale];
  const groups = groupBrandMatchInvitations(invitations);
  const [waitingForMore, setWaitingForMore] = useState(false);
  const showSelection = groups.accepted.length > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-zinc-950 sm:text-lg">{t.title}</h2>
          {showSelection && waitingForMore ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.waitingHint}</p>
          ) : null}
        </div>
        {showSelection ? (
          <Button
            type="button"
            variant={waitingForMore ? "default" : "outline"}
            size="sm"
            className={cn(
              "shrink-0 rounded-xl text-xs font-medium",
              waitingForMore ? "bg-violet-600 hover:bg-violet-700" : ""
            )}
            onClick={() => setWaitingForMore((value) => !value)}
          >
            <Hourglass className="h-3.5 w-3.5" />
            {t.waitMore}
          </Button>
        ) : null}
      </div>

      {showSelection ? (
        <section>
          <header className="border-b border-zinc-100 bg-emerald-50/40 px-5 py-3 sm:px-6">
            <h3 className="text-sm font-semibold text-emerald-900">{t.accepted(groups.accepted.length)}</h3>
          </header>
          {groups.accepted.length ? (
            <ul className="divide-y divide-zinc-100">
              {groups.accepted.map((invitation) => (
                <AcceptedRow
                  key={invitation.id}
                  locale={locale}
                  projectId={projectId}
                  invitation={invitation}
                  projectBudgetRange={projectBudgetRange}
                />
              ))}
            </ul>
          ) : (
            <p className="px-6 py-8 text-center text-sm text-zinc-500">{t.emptyAccepted}</p>
          )}
        </section>
      ) : null}

      {groups.pending.length > 0 ? (
        <section className={cn(showSelection ? "border-t border-zinc-100" : "")}>
          <header className="border-b border-zinc-100 bg-amber-50/30 px-5 py-3 sm:px-6">
            <h3 className="text-sm font-semibold text-amber-900">{t.pending(groups.pending.length)}</h3>
          </header>
          <ul className="divide-y divide-zinc-100">
            {groups.pending.map((invitation) => {
              const creator = resolveCreatorForInvitation(invitation.creatorId);
              const name = creator?.name ?? invitation.creatorId;
              const etaHours = estimatePendingReplyHours(invitation.creatorId, invitation.id);
              return (
                <li key={invitation.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      creatorAvatarTone(invitation.creatorId)
                    )}
                  >
                    {creatorInitials(name, invitation.creatorId)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-950">{name}</p>
                    {creator?.headline ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{creator.headline}</p>
                    ) : null}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                    <Clock className="h-3 w-3" />
                    {formatPendingReplyEta(etaHours, locale)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : showSelection ? (
        <section className="border-t border-zinc-100">
          <header className="border-b border-zinc-100 px-5 py-3 sm:px-6">
            <h3 className="text-sm font-semibold text-zinc-700">{t.pending(0)}</h3>
          </header>
          <p className="px-6 py-6 text-center text-sm text-zinc-500">{t.emptyPending}</p>
        </section>
      ) : null}

      {groups.declined.length > 0 ? (
        <details className="group border-t border-zinc-100">
          <summary className="flex cursor-pointer list-none items-center justify-between bg-zinc-50/60 px-5 py-3 sm:px-6 [&::-webkit-details-marker]:hidden">
            <h3 className="text-sm font-semibold text-zinc-600">{t.declined(groups.declined.length)}</h3>
            <ChevronDown className="h-4 w-4 text-zinc-400 transition group-open:rotate-180" />
          </summary>
          <ul className="divide-y divide-zinc-100">
            {groups.declined.map((invitation) => {
              const creator = resolveCreatorForInvitation(invitation.creatorId);
              const name = creator?.name ?? invitation.creatorId;
              return (
                <li key={invitation.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold opacity-60",
                      creatorAvatarTone(invitation.creatorId)
                    )}
                  >
                    {creatorInitials(name, invitation.creatorId)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-zinc-600">{name}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
