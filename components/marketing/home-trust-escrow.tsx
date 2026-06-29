import { Droplets, FileStack, Lock, Wallet } from "lucide-react";
import { HomeScrollReveal } from "@/components/marketing/home-scroll-reveal";
import { homeCopy } from "@/lib/marketing/home-copy";
import type { Locale } from "@/lib/i18n";

const icons = [Wallet, Droplets, FileStack, Lock];

export function HomeTrustEscrow({ locale }: { locale: Locale }) {
  const t = homeCopy("trustEscrow", locale);

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24 text-white sm:py-32">
      <div className="pointer-events-none absolute inset-0 premium-grid-bg opacity-25" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HomeScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h2>
        </HomeScrollReveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {t.items.map((item, index) => {
            const Icon = icons[index] ?? Lock;
            return (
              <HomeScrollReveal key={item.title} delay={(index % 3) as 0 | 1 | 2}>
                <article className="flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition hover:border-white/[0.14] hover:bg-white/[0.05]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                    <Icon className="h-5 w-5 text-zinc-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-zinc-400">{item.body}</p>
                  </div>
                </article>
              </HomeScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
