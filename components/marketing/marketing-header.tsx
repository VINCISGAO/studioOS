import Link from "next/link";
import { headers } from "next/headers";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  resolveMarketingPortalHref,
  resolveMarketingPortalLabel
} from "@/lib/marketing/portal-entry";
import { getCurrentSession } from "@/lib/session-user";
import { cn } from "@/lib/utils";

export async function MarketingHeader({ locale }: { locale: Locale }) {
  const nav = {
    studios: locale === "zh" ? "制作方作品库" : "Studios",
    pricing: locale === "zh" ? "价格" : "Pricing",
    howItWorks: locale === "zh" ? "如何运作" : "How it works"
  };

  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/";
  const search = headerList.get("x-search") ?? "";
  const session = await getCurrentSession();
  const isHome = pathname === "/";
  const portalHref = resolveMarketingPortalHref(locale, session);
  const portalLabel = resolveMarketingPortalLabel(locale, session);

  const links = [
    { href: "/creators", label: nav.studios },
    { href: "/how-it-works", label: nav.howItWorks },
    { href: "/pricing", label: nav.pricing }
  ];

  return (
    <header
      className={cn(
        "top-0 z-50 w-full",
        isHome
          ? "absolute inset-x-0 top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl"
          : "sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={withLocale("/", locale)}
          className={cn("flex items-center gap-2 font-semibold", isHome ? "text-white" : "text-zinc-950")}
        >
          <BrandLogoLockup
            contrastOn={isHome ? "dark" : "light"}
            markClassName="h-8 w-8 rounded-lg"
            wordmarkClassName="h-[17px] w-[106px]"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={withLocale(link.href, locale)}
              className={cn(
                "transition",
                isHome ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} pathname={pathname} search={search} />
          <Button
            asChild
            size="sm"
            variant="outline"
            className={cn(isHome && "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white")}
          >
            <Link href={portalHref}>{portalLabel}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
