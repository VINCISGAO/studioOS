import { LUCIEN_BIG_SRC } from "@/components/ai-copilot/lucien-avatar";
import type { Locale } from "@/lib/i18n";

/** Head overflows above the CTA card; card height follows text + button only. */
export function FaqLucienCtaGraphic({ locale }: { locale: Locale }) {
  return (
    <img
      src={LUCIEN_BIG_SRC}
      alt={locale === "zh" ? "卢西恩" : "Lucien"}
      className="pointer-events-none absolute bottom-0 right-4 z-10 h-[min(220px,54vw)] w-auto max-w-none object-contain object-bottom sm:right-36 sm:h-[min(252px,46vw)] lg:right-48 lg:h-[276px]"
    />
  );
}
