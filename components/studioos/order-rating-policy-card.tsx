import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";
import { getAiMatchingPolicyCopy } from "@/lib/studioos/ai-matching-policy";

export function OrderRatingPolicyCard({
  locale,
  rating,
  orderReviewCount = 0,
  variant = "card"
}: {
  locale: Locale;
  rating: number;
  orderReviewCount?: number;
  variant?: "card" | "inline";
}) {
  const t = getAiMatchingPolicyCopy(locale);
  const reviewLabel = orderReviewCount > 0 ? t.reviews(orderReviewCount) : t.noReviews;

  const content = (
    <>
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-500" />
        <h2 className="font-semibold text-zinc-900">{t.title}</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{t.body}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{t.footnote}</p>
      <p className="mt-3 text-sm font-medium text-zinc-900">
        {t.currentRating}: {rating} · {reviewLabel}
      </p>
    </>
  );

  if (variant === "inline") {
    return (
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        {content}
      </div>
    );
  }

  return (
    <Card className="shadow-none ring-1 ring-zinc-200">
      <CardContent className="p-5">{content}</CardContent>
    </Card>
  );
}
