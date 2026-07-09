import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

/** Legacy route — ad list lives on the overview dashboard. */
export default async function BrandCampaignsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  redirect(withLocale(brandPortalRoutes.dashboard, locale));
}
