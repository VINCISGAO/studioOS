import { LUCIEN_BIG_SRC } from "@/components/ai-copilot/lucien-avatar";
import type { Locale } from "@/lib/i18n";

/** Head overflows above the CTA card; card height follows text + button only. */
export function FaqLucienCtaGraphic({ locale }: { locale: Locale }) {
  return (
    <img
      src={LUCIEN_BIG_SRC}
      alt={locale === "zh" ? "卢西恩" : "Lucien"}
      width={918}
      height={1239}
      decoding="async"
      className="pointer-events-none mx-auto -mt-8 h-[min(200px,46vw)] w-auto max-w-none shrink-0 self-end object-contain object-bottom sm:-mt-12 sm:mr-6 sm:h-[min(252px,38vw)] lg:-mt-16 lg:mr-10 lg:h-[276px]"
    />
  );
}
