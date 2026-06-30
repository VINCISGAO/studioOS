import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";

export function CinematicTrustStrip({ locale }: { locale: Locale }) {
  const t = cinematicText("trust", locale);

  return (
    <section className="border-y border-white/[0.06] bg-black py-8">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-600">{t.label}</p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {t.brands.map((brand) => (
            <li key={brand} className="text-sm font-medium tracking-wide text-zinc-600">
              {brand}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
