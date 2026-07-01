import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

/** Legacy route — ad list lives on the overview dashboard. */
export default async function BrandCampaignsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  redirect(withLocale(brandPortalRoutes.dashboard, locale));
}
