import type { Locale } from "@/lib/i18n";

const brands = ["Arc & Alloy", "BrightSip", "Northline", "Nova Motion", "Signal Frame"];

const copy = {
  en: "Trusted by modern consumer brands",
  zh: "服务新一代消费品牌"
};

/** Compact logo strip — sits at the bottom of the dark hero, before the fade to light. */
export function HomeTrustStrip({ locale }: { locale: Locale }) {
  return (
    <div className="relative z-10 mx-auto mt-14 max-w-5xl border-t border-white/[0.08] pb-12 pt-8 sm:mt-16 sm:pb-14">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
        {copy[locale]}
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-0">
        {brands.map((name) => (
          <li key={name} className="text-center">
            <span className="text-sm font-medium tracking-tight text-zinc-400">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
