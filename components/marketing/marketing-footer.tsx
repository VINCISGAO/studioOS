import Image from "next/image";
import Link from "next/link";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { marketingHomeHref, buildLocalizedHref } from "@/lib/marketing/localized-href";
import type { MarketingLocale } from "@/lib/i18n";
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

type FooterTone = "light" | "dark";

type FooterNavGroup = {
  title: string;
  icon: LucideIcon;
  items: { label: string; href: string }[];
};

function footerAccentClass(dark: boolean) {
  return dark ? "text-[#e8e0d0]" : "text-indigo-600";
}

function footerGlassCardClass(dark: boolean) {
  return dark
    ? "border border-white/[0.08] bg-white/[0.035]"
    : "border border-zinc-200/90 bg-white shadow-sm";
}

function FooterNavSections({
  locale,
  groups,
  tone,
  className
}: {
  locale: MarketingLocale;
  groups: FooterNavGroup[];
  tone: FooterTone;
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "divide-y border-y",
        dark ? "divide-white/[0.08] border-white/[0.08]" : "divide-zinc-200 border-zinc-200",
        className
      )}
    >
      {groups.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.title} className="py-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm leading-6">
              <span className="inline-flex shrink-0 items-center gap-4">
                <Icon className={cn("h-5 w-5", footerAccentClass(dark))} strokeWidth={1.8} />
                <span className={cn("text-lg font-semibold tracking-[-0.03em]", dark ? "text-white" : "text-zinc-950")}>
                  {group.title}
                </span>
              </span>
              <span className={dark ? "text-white/15" : "text-zinc-300"}>|</span>
              {group.items.map((item, index) => (
                <span key={item.label} className="inline-flex items-center gap-3">
                  <Link
                    href={buildLocalizedHref(item.href, locale)}
                    className={cn(
                      "transition",
                      dark ? "text-zinc-500 hover:text-[#e8e0d0]" : "text-zinc-500 hover:text-zinc-950"
                    )}
                  >
                    {item.label}
                  </Link>
                  {index < group.items.length - 1 ? (
                    <span className={dark ? "text-white/15" : "text-zinc-300"}>|</span>
                  ) : null}
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
  tone,
  className
}: {
  locale: MarketingLocale;
  rights: string;
  tone: FooterTone;
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex shrink-0 items-center gap-3">
        {footerSocialIcons.map((item) => (
          <Link
            key={item.label}
            href={buildLocalizedHref(item.href, locale)}
            aria-label={item.label}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border transition hover:opacity-80",
              dark ? "border-white/10 bg-white/[0.04]" : "border-zinc-200 bg-white shadow-sm"
            )}
          >
            <Image src={item.src} alt="" width={24} height={24} className="h-6 w-6" />
          </Link>
        ))}
        <LanguageSwitcher locale={locale} tone={dark ? "dark" : "light"} variant="icon" menuPlacement="top" />
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
  tone,
  compact = false
}: {
  locale: MarketingLocale;
  title: string;
  subtitle: string;
  button: string;
  tone: FooterTone;
  compact?: boolean;
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 sm:rounded-[1.35rem] sm:p-6",
        dark ? "border-white/[0.08] bg-white/[0.03]" : "border-indigo-100 bg-white shadow-sm"
      )}
    >
      {dark ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e8e0d0]/30 to-transparent"
          aria-hidden
        />
      ) : (
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-200/55 blur-xl sm:-right-10 sm:-top-10 sm:h-36 sm:w-36 sm:blur-2xl" />
      )}
      <div className={cn("relative", compact ? "flex items-center justify-between gap-4 text-left" : "sm:flex sm:items-center sm:justify-between sm:gap-8")}>
        <div className={cn("flex min-w-0 items-start gap-3", !compact && "gap-5")}>
          <Sparkles
            className={cn("shrink-0", footerAccentClass(dark), compact ? "mt-1 h-6 w-6" : "mt-1 h-8 w-8")}
            strokeWidth={1.8}
          />
          <div className="min-w-0">
            <p className={cn("font-semibold leading-snug", dark ? "text-white" : "text-zinc-950", compact ? "text-base" : "text-xl")}>
              {title}
            </p>
            <p
              className={cn(
                dark ? "text-zinc-500" : "text-zinc-500",
                compact ? "mt-1 text-sm leading-6" : "mt-2 max-w-xl text-base leading-7"
              )}
            >
              {subtitle}
            </p>
          </div>
        </div>
        <Link
          href={marketingHomeHref.brand(locale)}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full font-medium transition",
            dark
              ? "bg-[#e8e0d0] text-zinc-950 hover:bg-[#f4f0e7]"
              : "rounded-xl bg-zinc-950 text-white shadow-sm hover:bg-zinc-800",
            compact ? "px-5 py-3 text-sm" : "mt-5 gap-2 px-8 py-3 text-base sm:mt-0"
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
  locale: MarketingLocale;
  tone?: FooterTone;
}) {
  const copy = getFooterCopy(locale);
  const dark = tone === "dark";

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
    <footer
      className={cn(
        dark ? "border-t border-white/[0.06] bg-[#050505] text-white" : "bg-[#fbfaf7] text-zinc-950"
      )}
    >
      <div className={cn("px-7 pb-8 pt-6 md:hidden", dark ? "text-white" : "text-zinc-950")}>
        <div className="flex items-center justify-center">
          <Link href={marketingHomeHref.home(locale)} className="inline-flex transition hover:opacity-80">
            <BrandLogoLockup
              contrastOn={dark ? "dark" : "light"}
              markClassName="h-6 w-6 rounded-lg"
              wordmarkClassName="h-[14px] w-[92px]"
            />
          </Link>
        </div>

        <div className="mt-4 text-center">
          <p className="mx-auto max-w-full whitespace-nowrap text-center text-[clamp(0.72rem,3.2vw,1rem)] font-semibold leading-snug tracking-[-0.02em]">
            {copy.story.lead}
            <span className={footerAccentClass(dark)}>{copy.story.highlight}</span>
          </p>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2">
          {featureBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.label}
                className={cn(
                  "flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-center",
                  footerGlassCardClass(dark)
                )}
              >
                <Icon className={cn("h-6 w-6", footerAccentClass(dark))} strokeWidth={1.8} />
                <span className={cn("text-[11px] font-medium leading-snug", dark ? "text-zinc-400" : "text-zinc-700")}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>

        <FooterNavSections locale={locale} groups={navGroups} tone={tone} className="mt-6" />
        <div className="mt-6">
          <FooterCta locale={locale} title={copy.cta.title} subtitle={copy.cta.subtitle} button={copy.cta.button} tone={tone} compact />
        </div>
        <FooterBottomBar locale={locale} rights={copy.rights} tone={tone} className="mt-8" />
      </div>

      <div className={cn("mx-auto hidden max-w-[1240px] px-6 py-10 md:block sm:px-10 lg:px-14 lg:py-12", dark ? "text-white" : "text-zinc-950")}>
        <div className="flex items-center justify-between gap-8">
          <Link href={marketingHomeHref.home(locale)} className="inline-flex shrink-0 transition hover:opacity-80">
            <BrandLogoLockup
              contrastOn={dark ? "dark" : "light"}
              markClassName="h-10 w-10 rounded-[14px]"
              wordmarkClassName="h-[22px] w-[138px]"
            />
          </Link>
          <p className="max-w-none whitespace-nowrap text-right text-[clamp(0.85rem,1.2vw,1.25rem)] font-medium leading-snug tracking-[-0.02em]">
            {copy.story.lead}
            <span className={footerAccentClass(dark)}>{copy.story.highlight}</span>
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
          <FooterNavSections locale={locale} groups={navGroups} tone={tone} />
          <div className="grid grid-cols-2 gap-3">
            {featureBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div key={badge.label} className={cn("flex items-start gap-3 rounded-2xl p-4", footerGlassCardClass(dark))}>
                  <Icon className={cn("h-7 w-7 shrink-0", footerAccentClass(dark))} strokeWidth={1.8} />
                  <div className="min-w-0">
                    <p className={cn("font-semibold leading-snug", dark ? "text-white" : "text-zinc-950")}>{badge.label}</p>
                    <p className={cn("mt-0.5 text-sm leading-5", dark ? "text-zinc-500" : "text-zinc-500")}>{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10">
          <FooterCta locale={locale} title={copy.cta.title} subtitle={copy.cta.subtitle} button={copy.cta.button} tone={tone} />
        </div>

        <div className={cn("mt-10 border-t pt-7", dark ? "border-white/[0.08]" : "border-zinc-200")}>
          <FooterBottomBar locale={locale} rights={copy.rights} tone={tone} />
        </div>
      </div>
    </footer>
  );
}
