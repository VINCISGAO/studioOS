import Link from "next/link";
import { ArrowRight, Bell, Check, Clock, TimerOff, UserCheck, UserX } from "lucide-react";
import { rerollCreatorInvitationsAction } from "@/app/brand-selection-actions";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Invitation flow",
    steps: ["AI matching", "Creator responses", "Confirm collaboration"],
    bannerMatching: "AI matching complete — no invitations sent yet",
    bannerWaiting: "Invitations sent — creators are reviewing your brief",
    bannerAccepted: "Creators accepted — start selecting your partner",
    bannerConfirmed: "Collaboration confirmed — project starting soon",
    pending: "Awaiting response",
    accepted: "Accepted",
    declined: "Declined",
    expired: "Closed",
    viewMessages: "View notifications",
    reroll: "Show another batch"
  },
  zh: {
    title: "邀请流程",
    steps: ["AI 匹配创作者", "创作者响应", "确认合作"],
    bannerMatching: "AI 匹配已完成，尚未向创作者发出邀请",
    bannerWaiting: "邀请已发出，创作者正在查看你的需求",
    bannerAccepted: "已有创作者接受邀请，请开始选择合作对象",
    bannerConfirmed: "已确认合作，项目即将开始",
    pending: "等待回复",
    accepted: "已接受",
    declined: "已拒绝",
    expired: "已失效",
    viewMessages: "查看通知",
    reroll: "换一批创作者"
  }
};

function resolveFlowStep(input: {
  invitations: StoredCreatorInvitation[];
  selectedCreatorId: string | null;
}) {
  const accepted = input.invitations.filter((item) => item.status === "accepted").length;
  if (input.selectedCreatorId) return 3;
  if (accepted > 0) return 2;
  if (input.invitations.length > 0) return 2;
  return 1;
}

function resolveBanner(
  locale: Locale,
  input: { invitations: StoredCreatorInvitation[]; selectedCreatorId: string | null }
) {
  const t = copy[locale];
  if (input.selectedCreatorId) return t.bannerConfirmed;
  const accepted = input.invitations.filter((item) => item.status === "accepted").length;
  if (accepted > 0) return t.bannerAccepted;
  if (input.invitations.length > 0) return t.bannerWaiting;
  return t.bannerMatching;
}

function FlowSteps({ locale, activeStep }: { locale: Locale; activeStep: number }) {
  const t = copy[locale];
  return (
    <div className="flex items-start gap-2 sm:gap-3">
      {t.steps.map((label, index) => {
        const step = index + 1;
        const done = step < activeStep;
        const active = step === activeStep;
        return (
          <div key={label} className="flex min-w-0 flex-1 items-start gap-2">
            {index > 0 ? (
              <div
                className={cn(
                  "mt-4 hidden h-px flex-1 sm:block",
                  done || active ? "bg-violet-300" : "bg-zinc-200"
                )}
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done
                    ? "bg-violet-600 text-white"
                    : active
                      ? "bg-violet-600 text-white ring-4 ring-violet-100"
                      : "border border-zinc-200 bg-white text-zinc-400"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium leading-tight sm:text-xs",
                  done || active ? "text-violet-700" : "text-zinc-400"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BrandInvitationStatusPanel({
  locale,
  invitations,
  selectedCreatorId = null
}: {
  locale: Locale;
  invitations: StoredCreatorInvitation[];
  selectedCreatorId?: string | null;
}) {
  const t = copy[locale];
  const activeStep = resolveFlowStep({ invitations, selectedCreatorId });
  const banner = resolveBanner(locale, { invitations, selectedCreatorId });

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="px-5 py-5 sm:px-6">
        <h2 className="text-base font-semibold text-zinc-950">{t.title}</h2>

        <div className="mt-5">
          <FlowSteps locale={locale} activeStep={activeStep} />
        </div>

        <div className="mt-5 rounded-xl border border-violet-200/80 bg-violet-50/60 px-4 py-3.5">
          <p className="text-sm font-medium leading-relaxed text-violet-900">{banner}</p>
        </div>
      </div>
    </div>
  );
}

export function BrandInvitationStatsPanel({
  locale,
  projectId,
  invitations,
  notificationCount = 0,
  canReroll = false
}: {
  locale: Locale;
  projectId: string;
  invitations: StoredCreatorInvitation[];
  notificationCount?: number;
  canReroll?: boolean;
}) {
  const t = copy[locale];
  const pending = invitations.filter((item) => item.status === "pending").length;
  const accepted = invitations.filter((item) => item.status === "accepted").length;
  const declined = invitations.filter((item) => item.status === "declined").length;
  const expired = invitations.filter(
    (item) => item.status === "expired" || item.status === "not_selected"
  ).length;

  const stats = [
    { icon: Clock, label: t.pending, value: pending, tone: "bg-amber-50 text-amber-600" },
    { icon: UserCheck, label: t.accepted, value: accepted, tone: "bg-emerald-50 text-emerald-600" },
    { icon: UserX, label: t.declined, value: declined, tone: "bg-violet-50 text-violet-600" },
    { icon: TimerOff, label: t.expired, value: expired, tone: "bg-zinc-100 text-zinc-500" }
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="px-5 py-5 sm:px-6">
        {canReroll ? (
          <form action={rerollCreatorInvitationsAction}>
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              {t.reroll}
            </button>
          </form>
        ) : null}

        <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", canReroll ? "mt-4" : "")}>
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-xl border border-zinc-200/80 bg-zinc-50/20 px-4 py-3.5"
              >
                <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", item.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-2.5 text-xs text-zinc-500">{item.label}</p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums leading-none text-zinc-950">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <Link
        href={withLocale(`${brandPortalRoutes.messages}?tab=project`, locale)}
        className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/40 px-5 py-3.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 sm:px-6"
      >
        <span className="inline-flex items-center gap-2">
          <Bell className="h-4 w-4 text-zinc-500" />
          {t.viewMessages}
          {notificationCount > 0 ? (
            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-violet-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {notificationCount}
            </span>
          ) : null}
        </span>
        <ArrowRight className="h-4 w-4 text-zinc-400" />
      </Link>
    </div>
  );
}
