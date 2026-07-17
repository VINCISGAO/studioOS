"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, User, X } from "lucide-react";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useMarketingHomePortalSession } from "@/components/marketing/use-marketing-home-portal-session";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
import {
  marketingSiteNavItems,
  marketingSiteNavHref,
  type MarketingSiteNavKey
} from "@/lib/marketing/marketing-site-nav";
import { MARKETING_SITE_NAV_ICONS } from "@/lib/marketing/marketing-site-nav-icons";
import { cn } from "@/lib/utils";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { asMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";

type WorkspaceCta = {
  href: string;
  label: string;
};

type MobileNavItemKey = "login" | MarketingSiteNavKey;

const MOBILE_NAV_ICONS: Record<MobileNavItemKey, typeof User> = {
  login: User,
  ...MARKETING_SITE_NAV_ICONS
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
    "flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white px-4 py-4 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50";

  const content = (
    <>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-zinc-100 ring-1 ring-zinc-200/80">
        <Icon className="h-5 w-5 text-zinc-900" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-base font-semibold leading-snug text-zinc-950">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-zinc-500 text-pretty">{description}</span>
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
    <Link href={href} onClick={onClose} className={className}>
      {content}
    </Link>
  );
}

function marketingSiteNavHrefForNav(key: MarketingSiteNavKey, copyLocale: Locale | MarketingLocale) {
  return marketingSiteNavHref(key, asMarketingLocale(copyLocale));
}

function MobileNavMenu({
  open,
  onClose,
  copyLocale,
  workspaceCta
}: {
  open: boolean;
  onClose: () => void;
  copyLocale: Locale | MarketingLocale;
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
  const navLabels = cinematicText("nav", copyLocale);
  const siteItems = marketingSiteNavItems(asMarketingLocale(copyLocale));

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
      title: workspaceCta?.label ?? navLabels.login,
      description: workspaceCta
        ? mobileNav.descriptions.workspace
        : mobileNav.descriptions.login,
      useAnchor: false,
      icon: MOBILE_NAV_ICONS.login
    },
    ...siteItems.map((item) => ({
      key: item.key,
      href: marketingSiteNavHrefForNav(item.key, copyLocale),
      title: item.label,
      description: item.description,
      useAnchor: false,
      icon: MARKETING_SITE_NAV_ICONS[item.key]
    }))
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white sm:hidden">
      <div className="relative flex items-center justify-end px-4 pb-2 pt-3">
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-950 shadow-sm transition hover:bg-zinc-50"
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
  workspaceCta: serverWorkspaceCta = null,
  hydratePortalSession = false,
  heroTone = "dark"
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  workspaceCta?: WorkspaceCta | null;
  hydratePortalSession?: boolean;
  heroTone?: "dark" | "light";
}) {
  const { workspaceCta: hydratedWorkspaceCta } = useMarketingHomePortalSession(
    copyLocale,
    null,
    hydratePortalSession
  );
  const workspaceCta = hydratePortalSession ? hydratedWorkspaceCta : serverWorkspaceCta;
  const siteNavItems = marketingSiteNavItems(asMarketingLocale(copyLocale));
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const bg = useTransform(
    scrollY,
    [0, 120],
    heroTone === "light"
      ? ["rgba(255,255,255,0)", "rgba(0,0,0,0.82)"]
      : ["rgba(0,0,0,0)", "rgba(0,0,0,0.82)"]
  );
  const border = useTransform(
    scrollY,
    [0, 120],
    heroTone === "light"
      ? ["rgba(0,0,0,0)", "rgba(255,255,255,0.06)"]
      : ["rgba(255,255,255,0)", "rgba(255,255,255,0.06)"]
  );

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 72);
  });

  const useLightNav = heroTone === "light" && !scrolled;

  return (
    <>
      <motion.header
        style={{ backgroundColor: bg, borderBottomColor: border }}
        className="fixed inset-x-0 top-0 z-50 border-b marketing-nav-backdrop"
      >
        <div className="relative mx-auto flex min-h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:min-h-16 sm:px-8">
          <Link
            href={marketingHomeHref.home(copyLocale)}
            className={cn("flex min-w-0 items-center", useLightNav ? "text-zinc-950" : "text-white")}
          >
            <BrandLogoLockup
              contrastOn={useLightNav ? "light" : "dark"}
              markClassName={cn(
                "h-6 w-6 rounded-md sm:h-9 sm:w-9 sm:rounded-xl",
                useLightNav ? "ring-1 ring-zinc-200" : "ring-1 ring-white/15"
              )}
              wordmarkClassName="h-[13px] w-[81px] sm:h-[21px] sm:w-[134px]"
              priority
            />
          </Link>

          <nav
            className={cn(
              "absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-sm lg:flex",
              useLightNav ? "text-zinc-600" : "text-zinc-400"
            )}
          >
            {siteNavItems.map((item) => (
              <Link
                key={item.key}
                href={marketingSiteNavHref(item.key, asMarketingLocale(copyLocale))}
                className={cn("transition", useLightNav ? "hover:text-zinc-950" : "hover:text-white")}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher locale={asMarketingLocale(copyLocale)} tone={useLightNav ? "light" : "dark"} navPill />
            <Link
              href={workspaceCta?.href ?? marketingHomeHref.login(copyLocale)}
              prefetch={workspaceCta ? true : false}
              className={cn(
                "hidden h-9 items-center rounded-full border px-4 text-sm font-semibold transition sm:inline-flex sm:h-10 sm:px-5",
                useLightNav
                  ? "border-zinc-200 bg-white text-zinc-950 shadow-sm hover:bg-zinc-50"
                  : "border-white/25 text-white hover:bg-white/10"
              )}
            >
              {workspaceCta?.label ?? cinematicText("nav", copyLocale).login}
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border transition sm:hidden",
                useLightNav
                  ? "border-zinc-200 bg-white text-zinc-950 shadow-sm hover:bg-zinc-50"
                  : "border-white/20 text-white hover:bg-white/10"
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
        workspaceCta={workspaceCta}
      />
    </>
  );
}
