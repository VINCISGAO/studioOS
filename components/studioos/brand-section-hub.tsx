import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn } from "@/lib/utils";

export type BrandSectionLink = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
};

type Props = {
  locale: Locale;
  title: string;
  description: string;
  sections: BrandSectionLink[];
};

export function BrandSectionHub({ locale, title, description, sections }: Props) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{title}</h1>
        <p className={cn("mt-2 max-w-2xl", portalChrome.body)}>{description}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          if (section.disabled) {
            return (
              <div
                key={section.href}
                className={cn(
                  portalChrome.card,
                  "flex cursor-not-allowed flex-col gap-4 p-5 opacity-60 sm:p-6"
                )}
                aria-disabled="true"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-200 text-zinc-500">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500">
                    {locale === "zh" ? "暂未开放" : "Coming soon"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-base font-semibold text-zinc-600">{section.title}</p>
                  <p className={cn("text-sm leading-relaxed", portalChrome.body)}>{section.description}</p>
                </div>
              </div>
            );
          }
          return (
            <Link
              key={section.href}
              href={withLocale(section.href, locale)}
              className={cn(
                portalChrome.card,
                "group flex flex-col gap-4 p-5 transition hover:border-zinc-300 hover:shadow-md sm:p-6"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                {section.badge ? (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600">
                    {section.badge}
                  </span>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <p className="text-base font-semibold text-zinc-950">{section.title}</p>
                <p className={cn("text-sm leading-relaxed", portalChrome.body)}>{section.description}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-900">
                {locale === "zh" ? "进入" : "Open"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
