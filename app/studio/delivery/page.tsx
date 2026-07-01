import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

export default async function StudioDeliveryRedirectPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  redirect(withLocale(creatorPortalRoutes.projects, locale));
}
