"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Clock, Sparkles, X } from "lucide-react";
import {
  acceptDemoInvitationAction,
  declineDemoInvitationAction
} from "@/app/creator-invitation-actions";
import { Button } from "@/components/ui/button";
import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { invitationStatusLabel } from "@/lib/studioos/campaign-closed-loop";
import {
  countInvitationsByTab,
  creatorInvitationTabLabels,
  creatorInvitationTabs,
  filterInvitationsByTab,
  type CreatorInvitationTab
} from "@/lib/studioos/creator-invitation-utils";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn, formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    title: "Project invitations",
    subtitle:
      "Accepting an invitation puts you on the brand shortlist — not a confirmed booking. Production starts only after the brand selects you.",
    accept: "Accept invitation",
    decline: "Not now",
    acceptedLabel: "Invitation accepted",
    waitingBrand: "Waiting for brand",
    selectedTitle: "Congratulations — you were selected",
    enterProject: "Open project",
    expired: "Closed",
    expiredHint: "Another creator was selected for this project.",
    ended: "Ended",
    budget: "Budget",
    deadline: "Deadline",
    empty: "No invitations in this tab."
  },
  zh: {
    title: "项目邀请",
    subtitle: "接受邀请只表示合作意向，不等于正式中标。品牌最终选定你后，项目才会正式开始。",
    accept: "接受邀请",
    decline: "暂不接受",
    acceptedLabel: "已接受邀请",
    waitingBrand: "等待品牌确认",
    selectedTitle: "🎉 恭喜，你已被品牌选中",
    enterProject: "进入项目",
    expired: "已过期",
    expiredHint: "本项目已由其他 Creator 成功接单。",
    ended: "已结束",
    budget: "预算",
    deadline: "截止时间",
    empty: "当前分类下没有邀请。"
  }
};

const mutedActionClass =
  "rounded-xl border-zinc-200 bg-zinc-100 text-zinc-400 shadow-none hover:bg-zinc-100 hover:text-zinc-400";

function formatDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function InvitationActions({
  locale,
  invitation,
  orderId,
  actingId,
  onActing
}: {
  locale: Locale;
  invitation: CreatorPortalInvitationView;
  orderId?: string | null;
  actingId: string | null;
  onActing: (id: string) => void;
}) {
  const t = copy[locale];
  const isActing = actingId === invitation.id;
  const status = invitation.status === "not_selected" ? "expired" : invitation.status;

  if (status === "selected") {
    const href = orderId
      ? withLocale(creatorPortalRoutes.project(orderId), locale)
      : withLocale(creatorPortalRoutes.projects, locale);
    return (
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <p className="text-xs font-medium text-violet-700">{t.selectedTitle}</p>
        <Button asChild size="sm" className="rounded-xl bg-violet-600 hover:bg-violet-700">
          <Link href={href}>
            <Sparkles className="h-4 w-4" />
            {t.enterProject}
          </Link>
        </Button>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <Button type="button" disabled size="sm" className={cn("pointer-events-none", mutedActionClass)}>
          <Check className="h-4 w-4" />
          {t.acceptedLabel}
        </Button>
        <Button type="button" disabled size="sm" variant="outline" className={cn("pointer-events-none", mutedActionClass)}>
          <Clock className="h-4 w-4" />
          {t.waitingBrand}
        </Button>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end">
        <Button type="button" disabled size="sm" className={cn("pointer-events-none", mutedActionClass)}>
          {t.expired}
        </Button>
        <p className="max-w-[220px] text-right text-xs text-zinc-500">{t.expiredHint}</p>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <Button type="button" disabled size="sm" variant="outline" className={cn("pointer-events-none shrink-0", mutedActionClass)}>
        <X className="h-4 w-4" />
        {t.ended}
      </Button>
    );
  }

  if (status !== "pending") return null;

  return (
    <div className="flex shrink-0 gap-2">
      <form action={acceptDemoInvitationAction} onSubmit={() => onActing(invitation.id)}>
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="invitationId" value={invitation.id} />
        <Button
          type="submit"
          size="sm"
          disabled={isActing}
          className={cn("rounded-xl", isActing ? mutedActionClass : "bg-indigo-600 hover:bg-indigo-600")}
        >
          <Check className="h-4 w-4" />
          {t.accept}
        </Button>
      </form>
      <form action={declineDemoInvitationAction} onSubmit={() => onActing(invitation.id)}>
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="invitationId" value={invitation.id} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={isActing}
          className={cn("rounded-xl", isActing && mutedActionClass)}
        >
          <X className="h-4 w-4" />
          {t.decline}
        </Button>
      </form>
    </div>
  );
}

export function CreatorInvitationsBoard({
  locale,
  invitations,
  orderByProjectId = {},
  initialTab = "pending"
}: {
  locale: Locale;
  invitations: CreatorPortalInvitationView[];
  orderByProjectId?: Record<string, string>;
  initialTab?: CreatorInvitationTab;
}) {
  const t = copy[locale];
  const labels = creatorInvitationTabLabels[locale];
  const [tab, setTab] = useState<CreatorInvitationTab>(initialTab);
  const [actingId, setActingId] = useState<string | null>(null);
  const counts = useMemo(() => countInvitationsByTab(invitations), [invitations]);
  const filtered = useMemo(() => filterInvitationsByTab(invitations, tab), [invitations, tab]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{t.title}</h1>
        <p className={cn("mt-2 max-w-2xl", portalChrome.body)}>{t.subtitle}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {creatorInvitationTabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              tab === item
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900"
            )}
          >
            {labels[item]}
            <span className="ml-1.5 tabular-nums opacity-70">{counts[item]}</span>
          </button>
        ))}
      </div>

      <section className="space-y-3">
        {filtered.length ? (
          filtered.map((invitation) => (
            <article key={invitation.id} className={cn(portalChrome.card, "p-4 sm:p-5")}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                    {invitation.brandName}
                  </p>
                  <h2 className="mt-1 truncate text-base font-semibold text-zinc-950">{invitation.title}</h2>
                  <p className="mt-2 inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                    {invitationStatusLabel(
                      invitation.status === "not_selected" ? "expired" : invitation.status,
                      locale
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                    <span>
                      {t.budget}: {formatCurrency(invitation.budget)} {invitation.currency}
                    </span>
                    <span>
                      {t.deadline}: {formatDate(invitation.deadline, locale)}
                    </span>
                  </div>
                </div>

                <InvitationActions
                  locale={locale}
                  invitation={invitation}
                  orderId={orderByProjectId[invitation.campaignId]}
                  actingId={actingId}
                  onActing={setActingId}
                />
              </div>
            </article>
          ))
        ) : (
          <div className={cn(portalChrome.card, "px-6 py-16 text-center")}>
            <p className={portalChrome.body}>{t.empty}</p>
          </div>
        )}
      </section>
    </div>
  );
}
