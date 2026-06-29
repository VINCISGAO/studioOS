"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitOrderRatingAction } from "@/app/order-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Rate this studio",
    body: "Your rating feeds into AI matching. Weights are fixed system rules — not editable in admin.",
    comment: "Optional feedback",
    submit: "Submit rating",
    thanks: "Thanks — AI will update this studio's match rank on the next brief."
  },
  zh: {
    title: "为 Studio 打分",
    body: "您的评分会进入 AI 匹配计算。权重由系统内置规则决定，后台无法修改。",
    comment: "补充评价（选填）",
    submit: "提交评分",
    thanks: "感谢评价 — AI 将在下次匹配时更新该 Studio 的排序。"
  }
};

export function OrderRatingPanel({
  locale,
  orderId,
  existingRating,
  submitted
}: {
  locale: Locale;
  orderId: string;
  existingRating: number | null;
  submitted?: boolean;
}) {
  const t = copy[locale];
  const [rating, setRating] = useState(existingRating ?? 0);
  const [comment, setComment] = useState("");

  if (existingRating || submitted) {
    return (
      <Card className="mt-6 border-amber-200 bg-amber-50 shadow-none">
        <CardContent className="p-5 text-sm text-amber-950">
          {t.thanks}
          {existingRating ? (
            <p className="mt-2 font-medium">
              {existingRating}/5 {locale === "zh" ? "星" : "stars"}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 shadow-none ring-1 ring-zinc-200">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.body}</p>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={cn(
                "rounded-lg border p-2 transition",
                rating >= value ? "border-amber-400 bg-amber-50" : "border-zinc-200"
              )}
            >
              <Star
                className={cn("h-5 w-5", rating >= value ? "fill-amber-400 text-amber-400" : "text-zinc-300")}
              />
            </button>
          ))}
        </div>
        <form action={submitOrderRatingAction} className="mt-4 grid gap-3">
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="order_id" value={orderId} />
          <input type="hidden" name="rating" value={String(rating)} />
          <Textarea
            name="comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t.comment}
            rows={3}
          />
          <Button type="submit" disabled={rating < 1}>
            {t.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
