import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import { Button } from "@/components/ui/button";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { portalChrome, shellBg } from "@/lib/studioos/product-theme";
import { studioOS } from "@/lib/studioos/vocabulary";
import { cn } from "@/lib/utils";
import { BarChart3, Sparkles, UserRound } from "lucide-react";

export function BrandPortalShell({
  locale,
  pathname,
  search,
  children
}: {
  locale: Locale;
  pathname: string;
  search: string;
  children: React.ReactNode;
}) {
  const focus =
    pathname.includes("/review") ||
    pathname.includes("/projects/new") ||
    pathname.includes("/studios") ||
    pathname.includes("/checkout") ||
    /\/brand\/projects\/[^/]+$/.test(pathname);

  const onProfile = pathname.includes("/brand/profile");

  return (
    <div className={cn("min-h-screen", shellBg)}>
      <header className={cn("sticky top-0 z-40", portalChrome.header)}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <MarketingHomeLink locale={locale} className="flex items-center gap-2.5 font-semibold text-zinc-950">
            <span className={portalChrome.logo}>
              <Sparkles className="h-4 w-4" />
            </span>
            {studioOS.productName}
            <span className={cn("hidden sm:inline", portalChrome.badge)}>
              {locale === "zh" ? "广告主" : "Brand"}
            </span>
          </MarketingHomeLink>
          <div className="flex items-center gap-1.5">
            {!focus || onProfile ? (
              <>
                <Button asChild size="sm" variant="ghost" className={cn("hidden sm:inline-flex", portalChrome.ghost)}>
                  <Link href={withLocale("/brand/attribution", locale)}>
                    <BarChart3 className="h-4 w-4" />
                    {locale === "zh" ? "广告归因" : "Attribution"}
                  </Link>
                </Button>
                {!onProfile ? (
                  <Button asChild size="sm" variant="ghost" className={cn("hidden sm:inline-flex", portalChrome.ghost)}>
                    <Link href={withLocale("/brand/profile", locale)}>
                      <UserRound className="h-4 w-4" />
                      {locale === "zh" ? "我的主页" : "My page"}
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="ghost" className={cn("hidden sm:inline-flex", portalChrome.ghost)}>
                    <Link href={withLocale("/brand", locale)}>
                      {locale === "zh" ? "广告项目" : "Campaigns"}
                    </Link>
                  </Button>
                )}
                <BrandStartBriefButton
                  locale={locale}
                  size="sm"
                  className={portalChrome.cta}
                  label={locale === "zh" ? "发布广告" : "Create ad"}
                />
              </>
            ) : null}
            <LanguageSwitcher locale={locale} pathname={pathname} search={search} />
            <form action={signOutAction}>
              <input type="hidden" name="lang" value={locale} />
              <Button type="submit" variant="outline" size="sm" className="border-zinc-200 bg-white text-zinc-700">
                {locale === "zh" ? "退出" : "Sign out"}
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto px-4 py-8 sm:px-6 sm:py-10 lg:px-8 ${focus && !onProfile ? "max-w-[1600px]" : "max-w-7xl"}`}
      >
        {children}
      </main>
    </div>
  );
}
