import { Check, Sparkles } from "lucide-react";
import { selectCreatorFromInvitationsAction } from "@/app/brand-selection-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { buildBrandMatchRecommendation } from "@/lib/studioos/brand-match-display";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    eyebrow: "AI recommendation",
    heading: "Start selecting a creator",
    pickLine: (name: string, score: number) => `We recommend ${name} (score ${score})`,
    match: "Match",
    collaborate: "Start collaboration",
    reasonsTitle: "Why this creator"
  },
  zh: {
    eyebrow: "AI 推荐",
    heading: "开始选择 Creator",
    pickLine: (name: string, score: number) => `推荐选择 ${name}（综合评分 ${score}）`,
    match: "匹配度",
    collaborate: "立即合作",
    reasonsTitle: "推荐理由"
  }
};

export function BrandMatchRecommendationPanel({
  locale,
  projectId,
  accepted,
  projectBudgetRange
}: {
  locale: Locale;
  projectId: string;
  accepted: StoredCreatorInvitation[];
  projectBudgetRange?: string | null;
}) {
  if (accepted.length === 0) return null;

  const t = copy[locale];
  const recommendation = buildBrandMatchRecommendation(accepted, locale, projectBudgetRange);
  if (!recommendation) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-white shadow-sm">
      <div className="border-b border-violet-100/80 px-5 py-4 sm:px-6">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-violet-600">
          <Sparkles className="h-3.5 w-3.5" />
          {t.eyebrow}
        </p>
        <h2 className="mt-2 text-base font-semibold text-zinc-950 sm:text-lg">{t.heading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          {t.pickLine(recommendation.creatorName, recommendation.compositeScore)}
        </p>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-zinc-950">{recommendation.creatorName}</span>
          <span className="text-xs text-amber-600">{recommendation.starDisplay}</span>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-medium text-violet-700">
            {t.match} {recommendation.matchPercent}%
          </span>
        </div>

        {recommendation.headline ? (
          <p className="text-sm leading-relaxed text-zinc-500">{recommendation.headline}</p>
        ) : null}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{t.reasonsTitle}</p>
          <ul className="mt-3 space-y-2">
            {recommendation.reasons.map((reason) => (
              <li
                key={reason.key}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  reason.matched ? "text-zinc-800" : "text-zinc-400"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                    reason.matched ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400"
                  )}
                >
                  {reason.matched ? "✓" : "·"}
                </span>
                {reason.label}
              </li>
            ))}
          </ul>
        </div>

        <form action={selectCreatorFromInvitationsAction}>
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="creatorId" value={recommendation.invitation.creatorId} />
          <Button type="submit" className="h-11 w-full rounded-xl bg-zinc-900 sm:w-auto sm:min-w-[180px]">
            <Check className="h-4 w-4" />
            {t.collaborate}
          </Button>
        </form>
      </div>
    </div>
  );
}
