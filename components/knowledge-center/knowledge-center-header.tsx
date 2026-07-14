"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import type { KnowledgePathPrefix } from "@/features/knowledge-center/knowledge-center.constants";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
import { knowledgeCenterHomeCopy } from "@/lib/knowledge/knowledge-center-home-copy";
import type { Locale } from "@/lib/i18n";

type KnowledgeCenterHeaderProps = {
  locale: Locale;
  pathPrefix: KnowledgePathPrefix;
};

function KnowledgeCenterBackButton({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();

  function handleBack() {
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const sameOrigin = referrer.startsWith(window.location.origin);
    if (sameOrigin) {
      router.back();
      return;
    }
    router.push(marketingHomeHref.home(locale));
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
      <span>{label}</span>
    </button>
  );
}

export function KnowledgeCenterHeader({ locale, pathPrefix }: KnowledgeCenterHeaderProps) {
  const copy = knowledgeCenterHomeCopy(locale);
  const homeHref = `/${pathPrefix}/resources`;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-5 lg:px-8">
        <Link href={homeHref} className="flex shrink-0 items-center gap-2 py-2.5 sm:gap-3 sm:py-3">
          <BrandLogoLockup
            contrastOn="light"
            markClassName="h-7 w-7 rounded-lg"
            wordmarkClassName="h-[15px] w-[94px]"
          />
          <span className="hidden text-sm font-semibold text-zinc-950 sm:inline">{copy.brandLabel}</span>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
            {copy.beta}
          </span>
        </Link>

        <KnowledgeCenterBackButton locale={locale} label={copy.back} />
      </div>
    </header>
  );
}
