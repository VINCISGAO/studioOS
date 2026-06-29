import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { MarketingHomeLink } from "@/components/studioos/marketing-home-link";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function PortalMobileNav({
  locale,
  pathname,
  items
}: {
  locale: Locale;
  pathname: string;
  items: { id: string; href: string; label: string; icon: LucideIcon }[];
}) {
  return (
    <nav
      className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
      aria-label={locale === "zh" ? "门户导航" : "Portal navigation"}
    >
      {items.map(({ id, href, label, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);
        const className = cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition",
          active ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"
        );

        if (href === "/") {
          return (
            <MarketingHomeLink key={id} locale={locale} className={className}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </MarketingHomeLink>
          );
        }

        return (
          <Link key={id} href={withLocale(href, locale)} className={className}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
