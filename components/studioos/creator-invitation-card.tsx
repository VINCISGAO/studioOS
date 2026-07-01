"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { BadgeCheck, Calendar, Check, Clock, Sparkles, Tag, Wallet, X } from "lucide-react";
import {
  acceptDemoInvitationAction,
  declineDemoInvitationAction
} from "@/app/creator-invitation-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { invitationStatusLabel } from "@/lib/studioos/campaign-closed-loop";
import type { CreatorInvitationCardModel } from "@/lib/studioos/creator-invitation-display";
import { formatInvitationDeadline } from "@/lib/studioos/creator-invitation-display";
import type { CreatorInvitationTab } from "@/lib/studioos/creator-invitation-utils";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    accept: "Accept invitation",
    decline: "Not now",
    acceptedLabel: "Invitation accepted",
    waitingBrand: "Waiting for brand",
    selectedTitle: "Congratulations — you were selected",
    awaitingPaymentHint: "Waiting for brand payment before production",
    enterProject: "Open project",
    expired: "Closed",
    expiredHint: "Another creator was selected for this project.",
    ended: "Ended",
    budget: "Budget",
    deadline: "Deadline",
    acceptHint: "Accepting shows interest — the brand will receive your response."
  },
  zh: {
    accept: "接受邀请",
    decline: "暂不接受",
    acceptedLabel: "已接受邀请",
    waitingBrand: "等待品牌确认",
    selectedTitle: "🎉 恭喜，你已被品牌选中",
    awaitingPaymentHint: "等待品牌付款后再开始制作",
    enterProject: "进入项目",
    expired: "已失效",
    expiredHint: "本项目已由其他 Creator 成功接单。",
    ended: "已结束",
    budget: "预算",
    deadline: "截止时间",
    acceptHint: "接受后表示你对该项目感兴趣，品牌将收到你的回复。"
  }
} as const;

function budgetLine(locale: Locale, label: string, value: string) {
  return locale === "zh" ? `${label}：${value}` : `${label}: ${value}`;
}

const mutedActionClass =
  "rounded-xl border-zinc-200 bg-zinc-100 text-zinc-400 shadow-none hover:bg-zinc-100 hover:text-zinc-400";

function CardActions({
  locale,
  invitation,
  orderId,
  actingId,
  onActing,
  onRespond,
  onActionError
}: {
  locale: Locale;
  invitation: CreatorInvitationCardModel;
  orderId?: string | null;
  actingId: string | null;
  onActing: (id: string | null) => void;
  onRespond: (tab: CreatorInvitationTab) => void;
  onActionError: (message: string) => void;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isActing = actingId === invitation.id || isPending;
  const status = invitation.status === "not_selected" ? "expired" : invitation.status;

  function runAction(action: "accept" | "decline") {
    onActing(invitation.id);
    const formData = new FormData();
    formData.set("lang", locale);
    formData.set("invitationId", invitation.id);

    startTransition(async () => {
      const result =
        action === "accept"
          ? await acceptDemoInvitationAction(formData)
          : await declineDemoInvitationAction(formData);

      if (result.ok) {
        onRespond(result.nextTab);
        router.refresh();
        return;
      }

      onActionError(result.error);
    });
  }

  if (status === "selected") {
    const href = orderId
      ? withLocale(creatorPortalRoutes.project(orderId), locale)
      : withLocale(creatorPortalRoutes.projects, locale);
    return (
      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[168px]">
        <p className="text-xs font-medium text-violet-700">{t.selectedTitle}</p>
        <p className="text-xs leading-relaxed text-zinc-500">{t.awaitingPaymentHint}</p>
        <Button asChild size="sm" className="h-10 w-full rounded-xl bg-violet-600 hover:bg-violet-700">
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
      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[168px]">
        <Button type="button" disabled size="sm" className={cn("pointer-events-none h-10 w-full", mutedActionClass)}>
          <Check className="h-4 w-4" />
          {t.acceptedLabel}
        </Button>
        <Button type="button" disabled size="sm" variant="outline" className={cn("pointer-events-none h-10 w-full", mutedActionClass)}>
          <Clock className="h-4 w-4" />
          {t.waitingBrand}
        </Button>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex w-full shrink-0 flex-col gap-1 sm:w-[168px] sm:items-end">
        <Button type="button" disabled size="sm" className={cn("pointer-events-none h-10 w-full", mutedActionClass)}>
          {t.expired}
        </Button>
        <p className="text-right text-xs leading-relaxed text-zinc-500">{t.expiredHint}</p>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <Button type="button" disabled size="sm" variant="outline" className={cn("pointer-events-none h-10 w-full sm:w-[168px]", mutedActionClass)}>
        <X className="h-4 w-4" />
        {t.ended}
      </Button>
    );
  }

  if (status !== "pending") return null;

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[168px]">
      <Button
        type="button"
        size="sm"
        disabled={isActing}
        onClick={() => runAction("accept")}
        className={cn(
          "h-10 w-full rounded-xl",
          isActing ? mutedActionClass : "bg-violet-600 hover:bg-violet-700"
        )}
      >
        <Check className="h-4 w-4" />
        {t.accept}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isActing}
        onClick={() => runAction("decline")}
        className={cn("h-10 w-full rounded-xl border-zinc-300 bg-white text-zinc-900", isActing && mutedActionClass)}
      >
        <X className="h-4 w-4" />
        {t.decline}
      </Button>
      <p className="text-xs leading-relaxed text-zinc-500">{t.acceptHint}</p>
    </div>
  );
}

export function CreatorInvitationCard({
  locale,
  invitation,
  orderId,
  actingId,
  onActing,
  onRespond,
  onActionError
}: {
  locale: Locale;
  invitation: CreatorInvitationCardModel;
  orderId?: string | null;
  actingId: string | null;
  onActing: (id: string | null) => void;
  onRespond: (tab: CreatorInvitationTab) => void;
  onActionError: (message: string) => void;
}) {
  const t = copy[locale];
  const status = invitation.status === "not_selected" ? "expired" : invitation.status;

  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
            <Image src={invitation.thumbnailUrl} alt="" fill className="object-cover" sizes="96px" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {invitation.brandName}
              </p>
              <BadgeCheck className="h-4 w-4 text-sky-500" aria-hidden />
            </div>
            <h2 className="mt-1 text-lg font-semibold text-zinc-950">{invitation.title}</h2>
            <p className="mt-2 inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
              {invitationStatusLabel(status, locale)}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-600">
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-zinc-400" />
                {budgetLine(locale, t.budget, invitation.budgetLabel)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-400" />
                {budgetLine(locale, t.deadline, formatInvitationDeadline(invitation.deadline, locale))}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-zinc-400" />
                {invitation.categoryLabel}
              </span>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-500">{invitation.description}</p>
          </div>
        </div>
        <CardActions
          locale={locale}
          invitation={invitation}
          orderId={orderId}
          actingId={actingId}
          onActing={onActing}
          onRespond={onRespond}
          onActionError={onActionError}
        />
      </div>
    </article>
  );
}
