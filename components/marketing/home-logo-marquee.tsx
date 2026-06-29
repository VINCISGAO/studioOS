import type { Locale } from "@/lib/i18n";

const brands = [
  "Arc & Alloy",
  "BrightSip",
  "Northline",
  "Nova Motion",
  "Signal Frame",
  "Copperwing",
  "Everyday Health",
  "Vista"
];

const copy = {
  en: "Trusted by modern consumer brands",
  zh: "服务新一代消费品牌"
};

export function HomeLogoMarquee({ locale }: { locale: Locale }) {
  const items = [...brands, ...brands];

  return (
    <div className="relative z-10 mx-auto mt-14 max-w-6xl border-t border-white/[0.08] pb-10 pt-8 sm:mt-16 sm:pb-12">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
        {copy[locale]}
      </p>
      <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="animate-marquee flex w-max min-w-full items-center gap-12 whitespace-nowrap px-4">
          {items.map((name, index) => (
            <li
              key={`${name}-${index}`}
              className="text-sm font-medium tracking-tight text-zinc-500 transition hover:text-zinc-300"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
