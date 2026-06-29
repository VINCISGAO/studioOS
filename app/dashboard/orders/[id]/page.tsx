import { PageShell } from "@/components/page-shell";
import { BrandOrderView } from "@/components/order/brand-order-view";
import { getLocale, type SearchParams } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type OrderPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function ClientOrderPage({ params, searchParams }: OrderPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);

  return (
    <PageShell locale={locale}>
      <BrandOrderView orderId={id} locale={locale} searchParams={query} />
    </PageShell>
  );
}
