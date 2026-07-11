import { PortalNotFoundPanel } from "@/components/studioos/portal-not-found-panel";
import { getAppUiLocale } from "@/lib/app-language";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

export default async function StudioNotFound() {
  const locale = await getAppUiLocale();
  return <PortalNotFoundPanel locale={locale} backHref={creatorPortalRoutes.projects} />;
}
