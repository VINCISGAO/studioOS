"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, FileText, Flower2, Info, Menu, Tag, User, X } from "lucide-react";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import { marketingHomeHref, buildLocalizedHref } from "@/lib/marketing/localized-href";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type WorkspaceCta = {
  href: string;
  label: string;
};

type MobileNavItemKey = "login" | "about" | "process" | "cases" | "pricing" | "resources";

const MOBILE_NAV_ICONS: Record<MobileNavItemKey, typeof User> = {
  login: User,
  about: Info,
  process: Flower2,
  cases: FileText,
  pricing: Tag,
  resources: Box
};

function MobileNavCard({
  href,
  useAnchor,
  title,
  description,
  icon: Icon,
  onClose
}: {
  href: string;
  useAnchor: boolean;
  title: string;
  description: string;
  icon: typeof User;
  onClose: () => void;
}) {
  const className =
    "flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-4 backdrop-blur-md transition hover:border-white/[0.14] hover:bg-white/[0.07]";

  const content = (
    <>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-zinc-900/90 to-black ring-1 ring-white/10">
        <Icon className="h-5 w-5 text-violet-300" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-base font-semibold leading-snug text-white">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-zinc-400 text-pretty">{description}</span>
      </span>
    </>
  );

  if (useAnchor) {
    return (
      <a href={href} onClick={onClose} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={false} onClick={onClose} className={className}>
      {content}
    </Link>
  );
}

function MobileNavMenu({
  open,
  onClose,
  copyLocale,
  labels,
  workspaceCta
}: {
  open: boolean;
  onClose: () => void;
  copyLocale: Locale | MarketingLocale;
  labels: {
    process: string;
    cases: string;
    pricing: string;
    resources: string;
    about: string;
    login: string;
  };
  workspaceCta: WorkspaceCta | null;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const mobileNav = cinematicText("mobileNav", copyLocale);

  const items: Array<{
    key: MobileNavItemKey;
    href: string;
    title: string;
    description: string;
    useAnchor: boolean;
    icon: typeof User;
  }> = [
    {
      key: "login",
      href: workspaceCta?.href ?? marketingHomeHref.login(copyLocale),
      title: workspaceCta?.label ?? labels.login,
      description: workspaceCta
        ? mobileNav.descriptions.workspace
        : mobileNav.descriptions.login,
      useAnchor: false,
      icon: MOBILE_NAV_ICONS.login
    },
    {
      key: "about",
      href: marketingHomeHref.contact(copyLocale),
      title: labels.about,
      description: mobileNav.descriptions.about,
      useAnchor: false,
      icon: MOBILE_NAV_ICONS.about
    },
    {
      key: "process",
      href: "#how-it-works",
      title: labels.process,
      description: mobileNav.descriptions.process,
      useAnchor: true,
      icon: MOBILE_NAV_ICONS.process
    },
    {
      key: "cases",
      href: buildLocalizedHref("/case-studies", copyLocale),
      title: labels.cases,
      description: mobileNav.descriptions.cases,
      useAnchor: false,
      icon: MOBILE_NAV_ICONS.cases
    },
    {
      key: "pricing",
      href: buildLocalizedHref("/pricing", copyLocale),
      title: labels.pricing,
      description: mobileNav.descriptions.pricing,
      useAnchor: false,
      icon: MOBILE_NAV_ICONS.pricing
    },
    {
      key: "resources",
      href: "#network",
      title: labels.resources,
      description: mobileNav.descriptions.resources,
      useAnchor: true,
      icon: MOBILE_NAV_ICONS.resources
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black sm:hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(88,28,135,0.28),transparent_58%)]"
      />
      <div className="relative flex items-center justify-end px-4 pb-2 pt-3">
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="relative flex-1 overflow-y-auto px-4 pb-10 pt-2">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <MobileNavCard
              key={item.key}
              href={item.href}
              useAnchor={item.useAnchor}
              title={item.title}
              description={item.description}
              icon={item.icon}
              onClose={onClose}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

export function CinematicNav({
  locale,
  copyLocale = locale,
  workspaceCta = null
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  workspaceCta?: WorkspaceCta | null;
}) {
  const t = cinematicText("nav", copyLocale);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 120], ["rgba(0,0,0,0)", "rgba(0,0,0,0.82)"]);
  const border = useTransform(scrollY, [0, 120], ["rgba(255,255,255,0)", "rgba(255,255,255,0.06)"]);

  return (
    <>
      <motion.header
        style={{ backgroundColor: bg, borderBottomColor: border }}
        className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl"
      >
        <div className="relative mx-auto flex min-h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:min-h-16 sm:px-8">
          <Link href={marketingHomeHref.home(copyLocale)} prefetch={false} className="flex min-w-0 items-center text-white">
            <BrandLogoLockup
              contrastOn="dark"
              markClassName="h-6 w-6 rounded-md ring-1 ring-white/15 sm:h-9 sm:w-9 sm:rounded-xl"
              wordmarkClassName="h-[13px] w-[81px] sm:h-[21px] sm:w-[134px]"
              priority
            />
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-sm text-zinc-400 lg:flex">
            <a href="#how-it-works" className="transition hover:text-white">
              {t.process}
            </a>
            <Link href={buildLocalizedHref("/case-studies", copyLocale)} prefetch={false} className="transition hover:text-white">
              {t.cases}
            </Link>
            <Link href={buildLocalizedHref("/pricing", copyLocale)} prefetch={false} className="transition hover:text-white">
              {t.pricing}
            </Link>
            <a href="#network" className="transition hover:text-white">
              {t.resources}
            </a>
            <Link href={marketingHomeHref.contact(copyLocale)} className="transition hover:text-white">
              {t.about}
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher locale={copyLocale} tone="dark" navPill />
            <Link
              href={workspaceCta?.href ?? marketingHomeHref.login(copyLocale)}
              prefetch={workspaceCta ? true : false}
              className="hidden h-9 items-center rounded-full border border-white/25 px-4 text-sm text-white transition hover:bg-white/10 sm:inline-flex sm:px-5"
            >
              {workspaceCta?.label ?? t.login}
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 sm:hidden"
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      <MobileNavMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        copyLocale={copyLocale}
        labels={t}
        workspaceCta={workspaceCta}
      />
    </>
  );
}
