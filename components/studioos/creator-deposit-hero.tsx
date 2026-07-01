import Link from "next/link";
import { BarChart3, Shield, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { tCertified } from "@/lib/studioos/deposit-copy";
import { creatorDepositHeroCopyFor } from "@/lib/studioos/creator-deposit-ui";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { cn } from "@/lib/utils";

const featureIcons = [Shield, Star, BarChart3];
const featureIconTones = [
  "bg-emerald-100 text-emerald-600",
  "bg-blue-100 text-blue-600",
  "bg-violet-100 text-violet-600"
];

export function CreatorDepositHero({
  locale,
  completedOrders,
  showActions = true,
  certifyHref
}: {
  locale: Locale;
  completedOrders: number;
  showActions?: boolean;
  certifyHref?: string;
}) {
  const t = tCertified(locale);
  const copy = creatorDepositHeroCopyFor(locale);
  const payLink = certifyHref ?? withLocale(`${creatorPortalRoutes.deposit}?scroll=pay`, locale);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-[linear-gradient(135deg,#f0fdf4_0%,#ecfdf5_45%,#ffffff_100%)] p-6 sm:p-8">
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
            {t.programName}
          </span>

          <div className="mt-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Shield className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[1.75rem]">{copy.title}</h1>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">{copy.body}</p>
          <p className="mt-3 text-sm font-medium text-zinc-500">{copy.completedMeta(completedOrders)}</p>

          {showActions ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="h-10 rounded-xl bg-zinc-900 px-5 text-sm font-medium hover:bg-zinc-800">
                <Link href={payLink}>{copy.certify}</Link>
              </Button>
              <Button asChild variant="outline" className="h-10 rounded-xl border-zinc-200 bg-white px-5 text-sm">
                <Link href={withLocale(creatorPortalRoutes.home, locale)}>{copy.later}</Link>
              </Button>
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {copy.features.map((feature, index) => {
              const Icon = featureIcons[index] ?? Shield;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      featureIconTones[index] ?? "bg-emerald-100 text-emerald-600"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-zinc-900">{feature.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{feature.body}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto flex h-44 w-44 shrink-0 items-center justify-center lg:mx-0 lg:mt-2 lg:h-52 lg:w-52">
          <div className="absolute inset-0 rounded-full bg-emerald-200/40 blur-2xl" />
          <div className="relative flex h-full w-full items-center justify-center rounded-[2rem] bg-[linear-gradient(145deg,#34d399_0%,#059669_100%)] shadow-[0_20px_50px_rgba(16,185,129,0.35)]">
            <Shield className="h-20 w-20 text-white/95 drop-shadow-sm sm:h-24 sm:w-24" strokeWidth={1.5} />
            <Sparkles className="absolute right-4 top-4 h-5 w-5 text-emerald-100" />
            <Sparkles className="absolute bottom-6 left-5 h-4 w-4 text-emerald-50/90" />
          </div>
        </div>
      </div>
    </section>
  );
}
