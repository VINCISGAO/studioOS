import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale, MarketingLocale } from "@/lib/i18n";

export function HomeHeroMetrics({
  copyLocale = "en"
}: {
  copyLocale?: Locale | MarketingLocale;
}) {
  const t = landingText("hero", copyLocale);

  return (
    <section className="bg-black px-0 py-0 lg:px-8 lg:py-0" aria-label={t.statBudget}>
      <div className="mx-auto w-full max-w-[1216px]">
        <div className="grid w-full grid-cols-3 gap-2 border-y border-white/10 py-3.5 text-center sm:gap-3 sm:py-5">
          <div className="text-center">
            <p className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white sm:text-xl">$200+</p>
            <p className="mt-1 text-[10px] leading-4 text-zinc-500 sm:text-xs sm:text-white">{t.statBudget}</p>
          </div>
          <div className="text-center">
            <p className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white sm:text-xl">72h</p>
            <p className="mt-1 text-[10px] leading-4 text-zinc-500 sm:text-xs sm:text-white">{t.statWindow}</p>
          </div>
          <div className="text-center">
            <p className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white sm:text-xl">1080P/4K</p>
            <p className="mt-1 text-[10px] leading-4 text-zinc-500 sm:text-xs sm:text-white">{t.statDelivery}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
