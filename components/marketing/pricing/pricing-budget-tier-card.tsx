import { BarChart3, Check, Send, Star } from "lucide-react";
import type { BudgetTierTheme } from "@/lib/marketing/pricing-copy";
import { cn } from "@/lib/utils";

const TIER_ICONS = [Send, Star, Star, BarChart3] as const;

const TIER_THEME_STYLES: Record<
  BudgetTierTheme,
  {
    title: string;
    iconWrap: string;
    check: string;
    border?: string;
    shadow?: string;
  }
> = {
  blue: {
    title: "text-sky-600",
    iconWrap: "bg-sky-50 text-sky-600",
    check: "text-sky-500"
  },
  purple: {
    title: "text-violet-600",
    iconWrap: "bg-violet-600 text-white",
    check: "text-violet-600",
    border: "border-2 border-violet-400",
    shadow: "shadow-[0_18px_44px_-28px_rgba(124,58,237,0.4)]"
  },
  orange: {
    title: "text-amber-600",
    iconWrap: "bg-amber-50 text-amber-600",
    check: "text-amber-500"
  },
  green: {
    title: "text-emerald-600",
    iconWrap: "bg-emerald-50 text-emerald-600",
    check: "text-emerald-500"
  }
};

export function PricingBudgetTierCard({
  title,
  subtitle,
  badge,
  audience,
  features,
  theme,
  index
}: {
  title: string;
  subtitle: string;
  badge?: string;
  audience: string;
  features: string[];
  theme: BudgetTierTheme;
  index: number;
}) {
  const Icon = TIER_ICONS[index] ?? Send;
  const styles = TIER_THEME_STYLES[theme];
  const isRecommended = Boolean(badge);

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-2xl border bg-white p-5",
        styles.border ?? "border-zinc-200/80",
        styles.shadow ?? "shadow-[0_12px_36px_-30px_rgba(0,0,0,0.18)]"
      )}
    >
      {badge ? (
        <span className="absolute right-4 top-4 rounded-full bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
      <span
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-xl",
          styles.iconWrap,
          isRecommended && "shadow-sm"
        )}
      >
        <Icon
          className={cn("h-5 w-5", index === 1 && "fill-current")}
          strokeWidth={index === 2 ? 2 : 1.75}
        />
      </span>
      <h3 className={cn("mt-4 text-base font-semibold", styles.title)}>{title}</h3>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      <p className="mt-4 text-sm text-zinc-500">{audience}</p>
      <ul className="mt-5 space-y-2.5 border-t border-zinc-100 pt-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-zinc-600">
            <Check className={cn("mt-0.5 h-4 w-4 shrink-0", styles.check)} strokeWidth={2.5} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
