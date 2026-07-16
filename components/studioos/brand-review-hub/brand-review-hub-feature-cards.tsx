import { Clock3, Lock, ShieldCheck, Users } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { brandReviewHubText } from "@/components/studioos/brand-review-hub/brand-review-hub-copy";
import { cn } from "@/lib/utils";

const featureIcons = {
  shield: ShieldCheck,
  lock: Lock,
  clock: Clock3,
  users: Users
} as const;

export function BrandReviewHubFeatureCards({ locale }: { locale: Locale }) {
  const t = brandReviewHubText(locale);

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {t.features.map((feature) => {
        const Icon = featureIcons[feature.iconKey];
        return (
          <article
            key={feature.title}
            className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start gap-3">
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", feature.tone)}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-zinc-900">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 sm:text-sm">{feature.body}</p>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
