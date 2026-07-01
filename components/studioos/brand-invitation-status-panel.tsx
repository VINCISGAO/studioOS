import Link from "next/link";
import { ArrowRight, Bell, Clock, TimerOff, UserCheck, UserX } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Intent invitations sent",
    subtitle:
      "Matched creators received intent orders. Acceptances join the shortlist — pick one candidate to officially start the project.",
    pending: "Awaiting response",
    accepted: "Accepted",
    declined: "Declined",
    expired: "Closed",
    viewMessages: "View notifications",
    startSelecting: "Creators are ready — start selecting"
  },
  zh: {
    title: "意向邀请已发出",
    subtitle:
      "AI 匹配后已同时向多位 Creator 发出邀请。接受者进入候选名单，你再最终选定 1 位 Creator 后项目才正式开始。",
    pending: "等待回复",
    accepted: "已接受",
    declined: "已拒绝",
    expired: "已失效",
    viewMessages: "查看通知",
    startSelecting: "开始选择 Creator"
  }
};

export function BrandInvitationStatusPanel({
  locale,
  invitations,
  notificationCount = 0
}: {
  locale: Locale;
  invitations: StoredCreatorInvitation[];
  notificationCount?: number;
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
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <h2 className="text-base font-semibold text-zinc-950 sm:text-lg">{t.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.subtitle}</p>

        {accepted > 0 ? (
          <div className="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-800">{t.startSelecting}</p>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-xl border border-zinc-200/80 bg-zinc-50/30 px-4 py-4"
              >
                <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", item.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-xs text-zinc-500">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <Link
        href={withLocale(`${brandPortalRoutes.messages}?tab=project`, locale)}
        className="mt-auto flex items-center justify-between border-t border-zinc-200/80 bg-zinc-50/50 px-5 py-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 sm:px-6"
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
