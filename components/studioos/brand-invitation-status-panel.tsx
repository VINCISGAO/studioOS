import Link from "next/link";
import { Bell, Clock, TimerOff, UserCheck, UserX } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Intent invitations sent",
    subtitle: "Matched creators received intent orders. Accept and decline both notify you; acceptances join the shortlist for your final pick.",
    pending: "Awaiting response",
    accepted: "Accepted",
    declined: "Declined",
    expired: "Closed",
    viewMessages: "View notifications"
  },
  zh: {
    title: "意向邀请已发出",
    subtitle:
      "AI 匹配后已同时向多位 Creator 发出邀请。接受者进入候选名单，你再最终选定 1 位 Creator 后项目才正式开始。",
    pending: "等待回复",
    accepted: "已接受",
    declined: "已拒绝",
    expired: "已失效",
    viewMessages: "查看通知"
  }
};

export function BrandInvitationStatusPanel({
  locale,
  invitations
}: {
  locale: Locale;
  invitations: StoredCreatorInvitation[];
}) {
  const t = copy[locale];
  const pending = invitations.filter((item) => item.status === "pending").length;
  const accepted = invitations.filter((item) => item.status === "accepted").length;
  const declined = invitations.filter((item) => item.status === "declined").length;
  const expired = invitations.filter(
    (item) => item.status === "expired" || item.status === "not_selected"
  ).length;

  const stats = [
    { icon: Clock, label: t.pending, value: pending, tone: "text-amber-700 bg-amber-50" },
    { icon: UserCheck, label: t.accepted, value: accepted, tone: "text-emerald-700 bg-emerald-50" },
    { icon: UserX, label: t.declined, value: declined, tone: "text-zinc-600 bg-zinc-100" },
    { icon: TimerOff, label: t.expired, value: expired, tone: "text-zinc-500 bg-zinc-100" }
  ];

  return (
    <div className={cn(portalChrome.card, "p-5 sm:p-6")}>
      <h2 className="text-lg font-semibold text-zinc-950">{t.title}</h2>
      <p className={cn("mt-2 max-w-2xl", portalChrome.body)}>{t.subtitle}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", item.tone)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {item.label}
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      <Link
        href={withLocale(`${brandPortalRoutes.messages}?tab=project`, locale)}
        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-900 hover:underline"
      >
        <Bell className="h-4 w-4" />
        {t.viewMessages}
      </Link>
    </div>
  );
}
