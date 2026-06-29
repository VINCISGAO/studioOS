import Link from "next/link";
import { HomeScrollReveal } from "@/components/marketing/home-scroll-reveal";
import { Button } from "@/components/ui/button";
import { homeCopy } from "@/lib/marketing/home-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

export function HomeCta({ locale, portalHref }: { locale: Locale; portalHref: string }) {
  const t = homeCopy("cta", locale);

  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HomeScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 px-8 py-16 text-center text-white sm:px-16 sm:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h2>
              <p className="mt-4 text-base leading-7 text-zinc-400">{t.subtitle}</p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 rounded-lg bg-white px-8 text-zinc-950 hover:bg-zinc-100">
                  <Link href={portalHref}>{t.primary}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-lg border-white/20 bg-transparent px-6 text-white hover:bg-white/10"
                >
                  <Link href={withLocale("/contact", locale)}>{t.secondary}</Link>
                </Button>
              </div>
            </div>
          </div>
        </HomeScrollReveal>
      </div>
    </section>
  );
}
