import { Award, BadgeCheck, Shield, Star } from "lucide-react";
import { HomeScrollReveal } from "@/components/marketing/home-scroll-reveal";
import { homeCopy } from "@/lib/marketing/home-copy";
import type { Locale } from "@/lib/i18n";

const icons = [Award, BadgeCheck, Star, Shield];

export function HomeCreatorNetwork({ locale }: { locale: Locale }) {
  const t = homeCopy("creatorNetwork", locale);

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HomeScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            {t.title}
          </h2>
        </HomeScrollReveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.items.map((item, index) => {
            const Icon = icons[index] ?? Award;
            return (
              <HomeScrollReveal key={item.title} delay={(index % 3) as 0 | 1 | 2}>
                <article className="h-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 transition hover:border-zinc-300 hover:bg-white hover:shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{item.body}</p>
                </article>
              </HomeScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
