import { PortalNotFoundPanel } from "@/components/studioos/portal-not-found-panel";
import { getAppUiLocale } from "@/lib/app-language";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

export default async function BrandNotFound() {
  const locale = await getAppUiLocale();
  return <PortalNotFoundPanel locale={locale} backHref={brandPortalRoutes.dashboard} />;
}
