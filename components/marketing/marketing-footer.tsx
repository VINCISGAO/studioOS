import Image from "next/image";
import Link from "next/link";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { footerProductName, getFooterCopy } from "@/lib/marketing/footer-copy";
import { cn } from "@/lib/utils";
import { ArrowRight, BookOpen, Box, Globe2, Shield, Sparkles, Users, Zap, type LucideIcon } from "lucide-react";

const footerSocialIcons = [
  { label: "X", src: "/images/social-sources/x.svg", href: "/contact" },
  { label: "YouTube", src: "/images/social-sources/youtube.svg", href: "/contact" },
  { label: "Instagram", src: "/images/social-sources/instagram.svg", href: "/contact" }
] as const;

const navIcons = [Box, Users, BookOpen] as const;
const featureIcons = [Globe2, Sparkles, Shield, Zap] as const;

type FooterNavGroup = {
  title: string;
  icon: LucideIcon;
  items: { label: string; href: string }[];
};

function FooterNavSections({
  locale,
  groups,
  className
}: {
  locale: Locale | MarketingLocale;
  groups: FooterNavGroup[];
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-zinc-200 border-y border-zinc-200", className)}>
      {groups.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.title} className="py-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm leading-6">
              <span className="inline-flex shrink-0 items-center gap-4">
                <Icon className="h-5 w-5 text-indigo-600" strokeWidth={1.8} />
                <span className="text-lg font-semibold tracking-[-0.03em] text-zinc-950">{group.title}</span>
              </span>
              <span className="text-zinc-300">|</span>
              {group.items.map((item, index) => (
                <span key={item.label} className="inline-flex items-center gap-3">
                  <Link href={withLocale(item.href, locale)} className="text-zinc-500 transition hover:text-zinc-950">
                    {item.label}
                  </Link>
                  {index < group.items.length - 1 ? <span className="text-zinc-300">|</span> : null}
                </span>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function FooterBottomBar({
  locale,
  rights,
  className
}: {
  locale: Locale | MarketingLocale;
  rights: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex shrink-0 items-center gap-3">
        {footerSocialIcons.map((item) => (
          <Link
            key={item.label}
            href={withLocale(item.href, locale)}
            aria-label={item.label}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition hover:opacity-80"
          >
            <Image src={item.src} alt="" width={24} height={24} className="h-6 w-6" />
          </Link>
        ))}
        <LanguageSwitcher locale={locale} tone="light" variant="icon" menuPlacement="top" />
      </div>
      <p className="whitespace-nowrap text-sm leading-6 text-zinc-500">
        © {new Date().getFullYear()} {footerProductName()} {rights}
      </p>
    </div>
  );
}

function FooterCta({
  locale,
  title,
  subtitle,
  button,
  compact = false
}: {
  locale: Locale | MarketingLocale;
  title: string;
  subtitle: string;
  button: string;
  compact?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:rounded-[1.35rem] sm:p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-200/55 blur-xl sm:-right-10 sm:-top-10 sm:h-36 sm:w-36 sm:blur-2xl" />
      <div className={cn("relative", compact ? "flex items-center justify-between gap-4 text-left" : "sm:flex sm:items-center sm:justify-between sm:gap-8")}>
        <div className={cn("flex min-w-0 items-start gap-3", !compact && "gap-5")}>
          <Sparkles className={cn("shrink-0 text-indigo-600", compact ? "mt-1 h-6 w-6" : "mt-1 h-8 w-8")} strokeWidth={1.8} />
          <div className="min-w-0">
            <p className={cn("font-semibold leading-snug text-zinc-950", compact ? "text-base" : "text-xl")}>{title}</p>
            <p className={cn("text-zinc-500", compact ? "mt-1 text-sm leading-6" : "mt-2 max-w-xl text-base leading-7")}>{subtitle}</p>
          </div>
        </div>
        <Link
          href={withLocale("/login?role=brand", locale)}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm transition hover:bg-zinc-800",
            compact ? "px-5 py-3 text-sm font-medium" : "mt-5 gap-2 rounded-2xl px-9 py-3 text-lg font-medium sm:mt-0"
          )}
        >
          {button}
          {!compact ? <ArrowRight className="h-5 w-5" strokeWidth={2} /> : null}
        </Link>
      </div>
    </div>
  );
}

export function MarketingFooter({
  locale,
  tone = "light"
}: {
  locale: Locale | MarketingLocale;
  tone?: "light" | "dark";
}) {
  const copy = getFooterCopy(locale);
  void tone;

  const navGroups: FooterNavGroup[] = [
    { title: copy.nav.product.title, icon: navIcons[0], items: copy.nav.product.items },
    { title: copy.nav.creators.title, icon: navIcons[1], items: copy.nav.creators.items },
    { title: copy.nav.resources.title, icon: navIcons[2], items: copy.nav.resources.items }
  ];

  const featureBadges = copy.features.map((feature, index) => ({
    ...feature,
    icon: featureIcons[index] ?? Globe2
  }));

  return (
    <footer className="bg-[#fbfaf7]">
      <div className="px-7 pb-8 pt-6 text-zinc-950 md:hidden">
        <div className="flex items-center justify-center">
          <Link href={withLocale("/", locale)} className="inline-flex transition hover:opacity-80">
            <BrandLogoLockup contrastOn="light" markClassName="h-6 w-6 rounded-lg" wordmarkClassName="h-[14px] w-[92px]" />
          </Link>
        </div>

        <div className="mt-4 text-center">
          <p className="mx-auto max-w-full whitespace-nowrap text-center text-[clamp(0.72rem,3.2vw,1rem)] font-semibold leading-snug tracking-[-0.02em]">
            {copy.story.lead}<span className="text-indigo-600">{copy.story.highlight}</span>
          </p>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2">
          {featureBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.label} className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-3 text-center shadow-sm">
                <Icon className="h-6 w-6 text-indigo-600" strokeWidth={1.8} />
                <span className="text-[11px] font-medium leading-snug text-zinc-700">{badge.label}</span>
              </div>
            );
          })}
        </div>

        <FooterNavSections locale={locale} groups={navGroups} className="mt-6" />
        <div className="mt-6">
          <FooterCta locale={locale} title={copy.cta.title} subtitle={copy.cta.subtitle} button={copy.cta.button} compact />
        </div>
        <FooterBottomBar locale={locale} rights={copy.rights} className="mt-8" />
      </div>

      <div className="mx-auto hidden max-w-[1240px] px-6 py-10 text-zinc-950 md:block sm:px-10 lg:px-14 lg:py-12">
        <div className="flex items-center justify-between gap-8">
          <Link href={withLocale("/", locale)} className="inline-flex shrink-0 transition hover:opacity-80">
            <BrandLogoLockup contrastOn="light" markClassName="h-10 w-10 rounded-[14px]" wordmarkClassName="h-[22px] w-[138px]" />
          </Link>
          <p className="max-w-none whitespace-nowrap text-right text-[clamp(0.85rem,1.2vw,1.25rem)] font-medium leading-snug tracking-[-0.02em]">
            {copy.story.lead}<span className="text-indigo-600">{copy.story.highlight}</span>
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
          <FooterNavSections locale={locale} groups={navGroups} />
          <div className="grid grid-cols-2 gap-3">
            {featureBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div key={badge.label} className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <Icon className="h-7 w-7 shrink-0 text-indigo-600" strokeWidth={1.8} />
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug text-zinc-950">{badge.label}</p>
                    <p className="mt-0.5 text-sm leading-5 text-zinc-500">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10">
          <FooterCta locale={locale} title={copy.cta.title} subtitle={copy.cta.subtitle} button={copy.cta.button} />
        </div>

        <div className="mt-10 border-t border-zinc-200 pt-7">
          <FooterBottomBar locale={locale} rights={copy.rights} />
        </div>
      </div>
    </footer>
  );
}
