"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Check, ChevronDown, Clock, ExternalLink } from "lucide-react";
import {
  selectCreatorFromInvitationsAction,
  trackBrandCreatorProfileViewAction
} from "@/app/brand-selection-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  buildAcceptedCreatorRow,
  buildCreatorMatchTags,
  estimatePendingReplyHours,
  formatPendingReplyEta,
  groupBrandMatchInvitations,
  resolveCreatorForInvitation
} from "@/lib/studioos/brand-match-display";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { creatorAvatarTone, creatorInitials } from "@/lib/studioos/creator-display";
import { cn } from "@/lib/utils";

type MatchTab = "pending" | "accepted" | "declined" | "expired";

const copy = {
  en: {
    title: "Creator response status",
    allStatus: "All statuses",
    pending: (n: number) => `Awaiting reply (${n})`,
    accepted: (n: number) => `Accepted (${n})`,
    declined: (n: number) => `Declined (${n})`,
    expired: (n: number) => `Closed (${n})`,
    match: "Match",
    selectNow: "Select now",
    viewProfile: "View profile",
    viewAll: "View all invitations",
    empty: "No creators in this status yet."
  },
  zh: {
    title: "创作者响应状态",
    allStatus: "全部状态",
    pending: (n: number) => `等待回复 (${n})`,
    accepted: (n: number) => `已接受 (${n})`,
    declined: (n: number) => `已拒绝 (${n})`,
    expired: (n: number) => `已失效 (${n})`,
    match: "匹配度",
    selectNow: "立即选择",
    viewProfile: "查看主页",
    viewAll: "查看全部邀请",
    empty: "暂无该状态的创作者。"
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
      <Button type="submit" size="sm" className="h-8 rounded-lg bg-zinc-900 px-3 text-xs font-medium">
        <Check className="h-3.5 w-3.5" />
        {label}
      </Button>
    </form>
  );
}

function ViewCreatorProfileForm({
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
    <form action={trackBrandCreatorProfileViewAction}>
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="creatorId" value={creatorId} />
      <Button type="submit" variant="outline" size="sm" className="h-8 rounded-lg px-3 text-xs">
        <ExternalLink className="h-3.5 w-3.5" />
        {label}
      </Button>
    </form>
  );
}

function CreatorReplyRow({
  locale,
  invitation,
  projectId,
  projectBudgetRange,
  showActions = false
}: {
  locale: Locale;
  invitation: StoredCreatorInvitation;
  projectId: string;
  projectBudgetRange?: string | null;
  showActions?: boolean;
}) {
  const t = copy[locale];
  const creator = resolveCreatorForInvitation(invitation.creatorId);
  const name = invitation.creatorName ?? creator?.name ?? invitation.creatorId;
  const row = buildAcceptedCreatorRow(invitation, locale, projectBudgetRange);
  const tags = creator ? buildCreatorMatchTags(creator, locale) : row.tags;
  const etaHours = estimatePendingReplyHours(invitation.creatorId, invitation.id);
  const verified = Boolean(creator?.profile_completed_at);

  return (
    <li className="flex gap-3 border-b border-zinc-100 px-5 py-4 last:border-0 sm:px-6">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          creatorAvatarTone(invitation.creatorId)
        )}
      >
        {creatorInitials(name, invitation.creatorId)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-zinc-950">{name}</p>
          {verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-violet-500" aria-label="Verified" /> : null}
        </div>
        {invitation.creatorHeadline || creator?.headline ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
            {invitation.creatorHeadline ?? creator?.headline}
          </p>
        ) : null}
        {tags.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {showActions ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SelectCreatorForm
              locale={locale}
              projectId={projectId}
              creatorId={invitation.creatorId}
              label={t.selectNow}
            />
            <ViewCreatorProfileForm
              locale={locale}
              projectId={projectId}
              creatorId={invitation.creatorId}
              label={t.viewProfile}
            />
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        {invitation.status === "pending" ? (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <Clock className="h-3.5 w-3.5" />
            {formatPendingReplyEta(etaHours, locale)}
          </span>
        ) : null}
        {invitation.status === "accepted" ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            {t.match} {row.matchPercent}%
          </span>
        ) : (
          <span className="text-xs font-semibold text-emerald-600">
            {t.match} {row.matchPercent}%
          </span>
        )}
      </div>
    </li>
  );
}

export function BrandProjectMatchBoard({
  locale,
  projectId,
  invitations,
  projectBudgetRange,
  selectionLocked = false
}: {
  locale: Locale;
  projectId: string;
  invitations: StoredCreatorInvitation[];
  projectBudgetRange?: string | null;
  selectionLocked?: boolean;
}) {
  const t = copy[locale];
  const groups = groupBrandMatchInvitations(invitations);
  const expired = invitations.filter(
    (item) => item.status === "expired" || item.status === "not_selected"
  );

  const counts = {
    pending: groups.pending.length,
    accepted: groups.accepted.length,
    declined: groups.declined.length,
    expired: expired.length
  };

  const defaultTab: MatchTab =
    counts.pending > 0 ? "pending" : counts.accepted > 0 ? "accepted" : "pending";

  const [activeTab, setActiveTab] = useState<MatchTab>(defaultTab);

  const visibleInvitations = useMemo(() => {
    if (activeTab === "pending") return groups.pending;
    if (activeTab === "accepted") return groups.accepted;
    if (activeTab === "declined") return groups.declined;
    return expired;
  }, [activeTab, expired, groups.accepted, groups.declined, groups.pending]);

  const tabs: { id: MatchTab; label: string }[] = [
    { id: "pending", label: t.pending(counts.pending) },
    { id: "accepted", label: t.accepted(counts.accepted) },
    { id: "declined", label: t.declined(counts.declined) },
    { id: "expired", label: t.expired(counts.expired) }
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-zinc-950">{t.title}</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600"
        >
          {t.allStatus}
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-zinc-100 px-5 sm:px-6">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative shrink-0 px-1 py-3 text-xs font-medium transition sm:text-sm",
                active ? "font-semibold text-violet-700" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              {tab.label}
              {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet-600" /> : null}
            </button>
          );
        })}
      </div>

      {visibleInvitations.length ? (
        <ul className="min-h-[280px] flex-1">
          {visibleInvitations.map((invitation) => (
            <CreatorReplyRow
              key={invitation.id}
              locale={locale}
              invitation={invitation}
              projectId={projectId}
              projectBudgetRange={projectBudgetRange}
              showActions={activeTab === "accepted" && !selectionLocked}
            />
          ))}
        </ul>
      ) : (
        <p className="px-6 py-12 text-center text-sm text-zinc-500">{t.empty}</p>
      )}

      <Link
        href={withLocale(`/brand/projects/${projectId}?tab=match`, locale)}
        className="mt-auto flex items-center gap-1 border-t border-zinc-100 px-5 py-3.5 text-sm font-medium text-violet-700 transition hover:bg-violet-50/50 sm:px-6"
      >
        {t.viewAll}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
