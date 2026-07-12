import { Check, Star, Users } from "lucide-react";
import { selectCreatorFromInvitationsAction } from "@/app/brand-selection-actions";
import { Button } from "@/components/ui/button";
import { creators } from "@/lib/data";
import { sanitizeCreatorDisplayName } from "@/lib/studioos/creator-display-name";
import type { Locale } from "@/lib/i18n";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn, formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    title: (count: number) => `Candidate creators (${count})`,
    subtitle:
      "These creators accepted your invitation and joined the shortlist. Pick one to officially start the project — all other invitations close automatically.",
    select: "Select creator",
    emptyTitle: "No creators have accepted yet",
    emptyBody: "System recommendations are still pending responses.",
    match: "Match",
    acceptedAt: "Accepted"
  },
  zh: {
    title: (count: number) => `候选 Creator（${count}）`,
    subtitle: "以下 Creator 已接受邀请并进入候选名单。选定 1 位后，项目才正式开始，其余邀请将自动失效。",
    select: "选定 Creator",
    emptyTitle: "还没有 Creator 接受邀请",
    emptyBody: "系统推荐已发出，等待回复中。",
    match: "匹配度",
    acceptedAt: "接受时间"
  }
};

export function BrandAcceptedCreatorsPanel({
  locale,
  projectId,
  accepted
}: {
  locale: Locale;
  projectId: string;
  accepted: StoredCreatorInvitation[];
}) {
  const t = copy[locale];

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-950">{t.title(accepted.length)}</h2>
      <p className={cn("mt-2 max-w-2xl", portalChrome.body)}>{t.subtitle}</p>

      {accepted.length ? (
        <ul className="mt-5 space-y-3">
          {accepted.map((invitation) => {
            const creator = creators.find((item) => item.id === invitation.creatorId);
            return (
              <li
                key={invitation.id}
                className={cn(portalChrome.card, "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5")}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-950">
                      {sanitizeCreatorDisplayName(invitation.creatorName ?? creator?.name, locale)}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                      <Star className="h-3 w-3 fill-current" />
                      {creator?.rating ?? "—"}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      {t.match} {Math.round(invitation.matchScore)}%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{creator?.headline}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {formatCurrency(invitation.budget, locale)} · {t.acceptedAt}{" "}
                    {new Date(invitation.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}
                  </p>
                </div>
                <form action={selectCreatorFromInvitationsAction}>
                  <input type="hidden" name="lang" value={locale} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="creatorId" value={invitation.creatorId} />
                  <Button type="submit" className="rounded-xl bg-zinc-900">
                    <Check className="h-4 w-4" />
                    {t.select}
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/40 px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-400 ring-1 ring-zinc-200">
            <Users className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm font-medium text-zinc-800">{t.emptyTitle}</p>
          <p className="mt-1 text-sm text-zinc-500">{t.emptyBody}</p>
        </div>
      )}
    </div>
  );
}
