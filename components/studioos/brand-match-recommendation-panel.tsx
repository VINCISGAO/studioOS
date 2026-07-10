"use client";

import { useState } from "react";
import { BadgeCheck, RefreshCw } from "lucide-react";
import { selectCreatorFromInvitationsAction } from "@/app/brand-selection-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { creatorAvatarTone, creatorInitials } from "@/lib/studioos/creator-display";
import type { BrandRecommendedCreator } from "@/lib/studioos/brand-match-recommendation-types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Recommended creator",
    refresh: "Refresh",
    match: "Match",
    invite: "Invite to collaborate",
    confirm: "Confirm collaboration",
    pastWork: "Past collaborations",
    workStyle: "Work style"
  },
  zh: {
    title: "为你推荐的创作者",
    refresh: "换一批",
    match: "匹配度",
    invite: "邀请合作",
    confirm: "确认合作",
    pastWork: "过往合作",
    workStyle: "作品风格"
  }
};

export function BrandMatchRecommendationPanel({
  locale,
  projectId,
  recommendedCreators,
  selectionLocked = false
}: {
  locale: Locale;
  projectId: string;
  recommendedCreators: BrandRecommendedCreator[];
  selectionLocked?: boolean;
}) {
  const t = copy[locale];
  const [index, setIndex] = useState(0);

  if (recommendedCreators.length === 0) return null;

  const activeIndex = index % recommendedCreators.length;
  const pick = recommendedCreators[activeIndex];
  const canSelect = pick.invitationStatus === "accepted" && !selectionLocked;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-zinc-950">{t.title}</h2>
        <button
          type="button"
          onClick={() => setIndex((value) => value + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-100"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t.refresh}
        </button>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="flex gap-4">
          <span
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              creatorAvatarTone(pick.creatorId)
            )}
          >
            {creatorInitials(pick.creatorName, pick.creatorId)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-base font-semibold text-zinc-950">{pick.creatorName}</p>
              {pick.verified ? (
                <BadgeCheck className="h-4 w-4 shrink-0 text-violet-500" aria-label="Verified" />
              ) : null}
            </div>
            {pick.tags.length ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {pick.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {pick.pastBrands.length ? (
          <p className="text-sm text-zinc-500">
            <span className="text-zinc-400">{t.pastWork}：</span>
            {pick.pastBrands.join("、")}
          </p>
        ) : null}

        {pick.workStyle ? (
          <p className="text-sm text-zinc-500">
            <span className="text-zinc-400">{t.workStyle}：</span>
            {pick.workStyle}
          </p>
        ) : null}

        <div className="flex items-end gap-4 pt-1">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-600">
              {t.match} {pick.matchPercent}%
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, pick.matchPercent)}%` }}
              />
            </div>
          </div>

          {canSelect ? (
            <form action={selectCreatorFromInvitationsAction} className="shrink-0">
              <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="creatorId" value={pick.creatorId} />
              <Button
                type="submit"
                className="h-10 rounded-xl bg-violet-600 px-5 text-sm font-semibold hover:bg-violet-700"
              >
                {t.confirm}
              </Button>
            </form>
          ) : (
            <Button
              type="button"
              className="h-10 shrink-0 rounded-xl bg-violet-600 px-5 text-sm font-semibold hover:bg-violet-700"
            >
              {t.invite}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 border-t border-zinc-100 px-5 py-3">
        {recommendedCreators.map((item, dotIndex) => (
          <button
            key={item.creatorId}
            type="button"
            aria-label={locale === "zh" ? `创作者 ${dotIndex + 1}` : `Creator ${dotIndex + 1}`}
            onClick={() => setIndex(dotIndex)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              dotIndex === activeIndex ? "w-4 bg-violet-600" : "w-1.5 bg-zinc-300"
            )}
          />
        ))}
      </div>
    </div>
  );
}
