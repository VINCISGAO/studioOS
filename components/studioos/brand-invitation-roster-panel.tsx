import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { brandInvitationStatusLabel } from "@/lib/studioos/invitation-lifecycle";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Invited creators",
    subtitle: "All matched creators and their response status. Select one accepted creator to start the project.",
    creator: "Creator",
    match: "Match",
    status: "Status"
  },
  zh: {
    title: "已邀请 Creator",
    subtitle: "AI 匹配后同时发出的邀请及回复状态。从已接受的候选中最终选定 1 位 Creator 后，项目才正式开始。",
    creator: "Creator",
    match: "匹配度",
    status: "状态"
  }
};

function statusTone(status: string) {
  if (status === "accepted") return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
  if (status === "selected") return "bg-violet-50 text-violet-800 ring-violet-200/80";
  if (status === "declined") return "bg-zinc-100 text-zinc-600 ring-zinc-200/80";
  if (status === "expired" || status === "not_selected") return "bg-zinc-100 text-zinc-500 ring-zinc-200/80";
  return "bg-amber-50 text-amber-800 ring-amber-200/80";
}

export function BrandInvitationRosterPanel({
  locale,
  invitations
}: {
  locale: Locale;
  invitations: StoredCreatorInvitation[];
}) {
  const t = copy[locale];
  const sorted = [...invitations].sort((a, b) => {
    const order = { selected: 0, accepted: 1, pending: 2, declined: 3, expired: 4, not_selected: 4 };
    return (order[a.status as keyof typeof order] ?? 5) - (order[b.status as keyof typeof order] ?? 5);
  });

  return (
    <div className={cn(portalChrome.card, "overflow-hidden")}>
      <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-zinc-950">{t.title}</h2>
        <p className={cn("mt-2 max-w-2xl", portalChrome.body)}>{t.subtitle}</p>
      </div>

      {sorted.length ? (
        <ul className="divide-y divide-zinc-100">
          {sorted.map((invitation) => {
            const creator = creators.find((item) => item.id === invitation.creatorId);
            const displayStatus =
              invitation.status === "not_selected" ? "expired" : invitation.status;
            return (
              <li
                key={invitation.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-950">{creator?.name ?? invitation.creatorId}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{creator?.headline}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {t.match} {Math.round(invitation.matchScore)}%
                  </span>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                      statusTone(displayStatus)
                    )}
                  >
                    {brandInvitationStatusLabel(displayStatus, locale)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={cn("px-6 py-10 text-center", portalChrome.body)}>
          {locale === "zh" ? "邀请发送中…" : "Invitations are being sent…"}
        </p>
      )}
    </div>
  );
}
