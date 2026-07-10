import Link from "next/link";
import { ArrowRight, Bell, Clock, TimerOff, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Intent invitations sent",
    body: "AI matched creators and sent intent invitations. Creators are reviewing your brief — you'll be notified when they respond.",
    cta: "View invitation details",
    pending: "Awaiting reply",
    accepted: "Accepted",
    declined: "Declined",
    expired: "Closed",
    notifications: (n: number) => `You have ${n} new notification${n === 1 ? "" : "s"}`,
    viewAll: "View all"
  },
  zh: {
    title: "意向邀请已发出",
    body: "AI 已完成创作者匹配，并向合适的创作者发出了意向邀请。创作者正在查看您的需求，回复后您将收到通知。",
    cta: "查看邀请详情",
    pending: "等待回复",
    accepted: "已接受",
    declined: "已拒绝",
    expired: "已失效",
    notifications: (n: number) => `您有 ${n} 条新通知`,
    viewAll: "查看全部"
  }
};

export function BrandProjectInvitationOverviewCard({
  locale,
  projectId,
  invitations,
  notificationCount = 0
}: {
  locale: Locale;
  projectId: string;
  invitations: StoredCreatorInvitation[];
  notificationCount?: number;
}) {
  const t = copy[locale];
  const pending = invitations.filter((item) => item.status === "pending").length;
  const accepted = invitations.filter((item) => item.status === "accepted").length;
  const declined = invitations.filter((item) => item.status === "declined").length;
  const expired = invitations.filter((item) => item.status === "expired" || item.status === "not_selected").length;

  const stats = [
    { icon: Clock, label: t.pending, value: pending, tone: "text-amber-600 bg-amber-50" },
    { icon: UserCheck, label: t.accepted, value: accepted, tone: "text-emerald-600 bg-emerald-50" },
    { icon: UserX, label: t.declined, value: declined, tone: "text-violet-600 bg-violet-50" },
    { icon: TimerOff, label: t.expired, value: expired, tone: "text-zinc-500 bg-zinc-100" }
  ];

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
        <h2 className="text-base font-semibold text-zinc-950">{t.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.body}</p>
        <Button asChild className="mt-4 h-10 w-fit rounded-xl bg-violet-600 px-5 hover:bg-violet-700">
          <Link href={`#creator-responses`}>
            {t.cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-xl border border-zinc-100 bg-zinc-50/40 px-4 py-3">
                <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg", item.tone)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <p className="mt-2 text-xs text-zinc-500">{item.label}</p>
                <p className="text-xl font-semibold tabular-nums text-zinc-950">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {notificationCount > 0 ? (
        <Link
          href={withLocale(`${brandPortalRoutes.messages}?tab=project`, locale)}
          className="flex items-center justify-between border-t border-violet-100 bg-violet-50/60 px-5 py-3.5 text-sm font-medium text-violet-900 transition hover:bg-violet-50 sm:px-6"
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
            <Bell className="h-4 w-4" />
            {t.notifications(notificationCount)}
          </span>
          <span className="inline-flex items-center gap-1 text-violet-700">
            {t.viewAll}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ) : null}
    </section>
  );
}
