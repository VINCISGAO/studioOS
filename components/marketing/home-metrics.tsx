import type { Locale } from "@/lib/i18n";

const copy = {
  en: {
    stats: [
      { value: "72h", label: "Brief to first cut" },
      { value: "40+", label: "Markets supported" },
      { value: "100%", label: "Escrow-backed payouts" },
      { value: "6-step", label: "Campaign wizard" }
    ]
  },
  zh: {
    stats: [
      { value: "72h", label: "Brief 到初剪" },
      { value: "40+", label: "覆盖市场" },
      { value: "100%", label: "托管结算" },
      { value: "6 步", label: "Campaign 向导" }
    ]
  }
};

export function HomeMetrics({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <section className="border-y border-zinc-200/80 bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {t.stats.map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <dt className="font-mono text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                {stat.value}
              </dt>
              <dd className="mt-2 text-sm text-zinc-500">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
