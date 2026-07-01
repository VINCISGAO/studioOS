import { Suspense } from "react";
import { BrandSettingsHub } from "@/components/studioos/brand-settings-hub";
import { getLocale, type SearchParams } from "@/lib/i18n";

export default async function BrandSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />}>
      <BrandSettingsHub locale={locale} />
    </Suspense>
  );
}
