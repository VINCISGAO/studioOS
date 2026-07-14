import Link from "next/link";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

/**
 * Public profile chrome — logo + language only.
 * No pricing, login, signup, FAQ, or marketing CTAs.
 */
export function PublicHeader({ locale }: { locale: Locale }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={withLocale("/", locale)} className="flex items-center gap-2 text-sm font-semibold">
          <BrandLogoLockup
            contrastOn="light"
            markClassName="h-8 w-8 rounded-lg shadow-sm"
            wordmarkClassName="h-[17px] w-[106px]"
            priority
          />
        </Link>
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
