import { headers } from "next/headers";
import { BrandPortalShell } from "@/components/studioos/brand-portal-shell";
import { getLocale, type SearchParams } from "@/lib/i18n";

type BrandLayoutProps = {
  children: React.ReactNode;
  searchParams?: Promise<SearchParams>;
};

export default async function BrandLayout({ children }: BrandLayoutProps) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/brand";
  const search = headerList.get("x-search") ?? "";
  const locale = getLocale({ lang: new URLSearchParams(search).get("lang") ?? undefined });

  return (
    <BrandPortalShell locale={locale} pathname={pathname} search={search}>
      {children}
    </BrandPortalShell>
  );
}
