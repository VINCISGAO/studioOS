import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

export default async function BrandCampaignDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  redirect(withLocale(brandPortalRoutes.project(id), locale));
}
