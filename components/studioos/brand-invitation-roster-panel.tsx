import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { creatorAvatarTone, creatorInitials } from "@/lib/studioos/creator-display";
import { brandInvitationStatusLabel } from "@/lib/studioos/invitation-lifecycle";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Invited creators",
    subtitle:
      "All matched creators and their response status. Select one accepted creator to start the project.",
    match: "Match",
    empty: "Invitations are being sent…"
  },
  zh: {
    title: "已邀请 Creator",
    subtitle:
      "AI 匹配后同时发出的邀请及回复状态。从已接受的候选中最终选定 1 位 Creator 后，项目才正式开始。",
    match: "匹配度",
    empty: "邀请发送中…"
  }
};

function statusTone(status: string) {
  if (status === "accepted") return "bg-emerald-50 text-emerald-700 ring-emerald-200/80";
  if (status === "selected") return "bg-violet-50 text-violet-700 ring-violet-200/80";
  if (status === "declined") return "bg-zinc-100 text-zinc-600 ring-zinc-200/80";
  if (status === "expired" || status === "not_selected") return "bg-zinc-100 text-zinc-500 ring-zinc-200/80";
  return "bg-amber-50 text-amber-700 ring-amber-200/80";
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
    return (
      (order[a.status as keyof typeof order] ?? 5) - (order[b.status as keyof typeof order] ?? 5) ||
      b.matchScore - a.matchScore
    );
  });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-5 sm:px-6">
        <h2 className="text-base font-semibold text-zinc-950 sm:text-lg">{t.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.subtitle}</p>
      </div>

      {sorted.length ? (
        <ul className="divide-y divide-zinc-100">
          {sorted.map((invitation) => {
            const creator = creators.find((item) => item.id === invitation.creatorId);
            const displayStatus = invitation.status === "not_selected" ? "expired" : invitation.status;
            const name = creator?.name ?? invitation.creatorId;

            return (
              <li key={invitation.id} className="flex items-start gap-3 px-5 py-4 sm:px-6">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    creatorAvatarTone(invitation.creatorId)
                  )}
                >
                  {creatorInitials(name, invitation.creatorId)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-950">{name}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 sm:text-sm">
                        {creator?.headline}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                      <span className="text-xs font-medium text-zinc-500">
                        {t.match} {Math.round(invitation.matchScore)}%
                      </span>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                          statusTone(displayStatus)
                        )}
                      >
                        {brandInvitationStatusLabel(displayStatus, locale)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-6 py-12 text-center text-sm text-zinc-500">{t.empty}</p>
      )}
    </div>
  );
}
