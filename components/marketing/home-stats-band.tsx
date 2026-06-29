import { HomeScrollReveal } from "@/components/marketing/home-scroll-reveal";
import type { Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Impact",
    title: "Ship faster without breaking brand standards.",
    stats: [
      { value: "72h", label: "Brief to first cut", detail: "Median for paid social packs" },
      { value: "59%", label: "Less review chaos", detail: "Structured timeline vs email threads" },
      { value: "2.2×", label: "Faster approvals", detail: "Versioned review with checklists" },
      { value: "100%", label: "Escrow-backed", detail: "Dual-sign contracts & audit trail" }
    ]
  },
  zh: {
    eyebrow: "成效",
    title: "更快交付，同时守住品牌标准。",
    stats: [
      { value: "72h", label: "简报到初剪", detail: "付费社交素材包中位周期" },
      { value: "59%", label: "减少审片混乱", detail: "时间轴审片 vs 邮件来回" },
      { value: "2.2×", label: "审批提速", detail: "版本化审片 + 清单" },
      { value: "100%", label: "托管结算", detail: "双签合约与审计留痕" }
    ]
  }
};

export function HomeStatsBand({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <section className="relative overflow-hidden border-y border-zinc-200 bg-zinc-950 py-20 text-white sm:py-28">
      <div className="pointer-events-none absolute inset-0 premium-grid-bg opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HomeScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h2>
        </HomeScrollReveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.stats.map((stat, index) => (
            <HomeScrollReveal key={stat.label} delay={(index % 3) as 0 | 1 | 2}>
              <article className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition hover:border-white/[0.14] hover:bg-white/[0.05]">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl transition group-hover:bg-violet-500/20" />
                <p className="font-mono text-4xl font-semibold tracking-tight">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-zinc-200">{stat.label}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{stat.detail}</p>
              </article>
            </HomeScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
