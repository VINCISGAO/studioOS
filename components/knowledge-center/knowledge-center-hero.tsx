import { KnowledgeCenterSearchTrigger } from "@/components/knowledge-center/knowledge-center-search-trigger";
import { knowledgeCenterHomeCopy } from "@/lib/knowledge/knowledge-center-home-copy";
import type { Locale } from "@/lib/i18n";

export function KnowledgeCenterHero({
  locale,
  languageCode
}: {
  locale: Locale;
  languageCode: string;
}) {
  const copy = knowledgeCenterHomeCopy(locale);

  return (
    <section className="relative overflow-hidden border-b border-zinc-200/70 bg-white px-3 py-8 sm:px-5 sm:py-10 lg:px-8 lg:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-full max-w-5xl bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.12)_0%,_rgba(255,255,255,0)_70%)]"
      />
      <div className="relative mx-auto max-w-5xl text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-4xl lg:text-[2.75rem]">
          {copy.heroTitle}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:mt-3 sm:text-base sm:leading-7 lg:text-lg">
          {copy.heroSubtitle}
        </p>
        <div className="mt-5 sm:mt-6">
          <KnowledgeCenterSearchTrigger locale={locale} languageCode={languageCode} />
        </div>
      </div>
    </section>
  );
}
