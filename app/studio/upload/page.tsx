import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

/** Legacy route — delivery now lives inside each project under My projects. */
export default async function StudioUploadRedirectPage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { order?: string }>;
}) {
  const query = await searchParams;
  const locale = getLocale(query);
  if (query.order) {
    redirect(withLocale(creatorPortalRoutes.project(query.order), locale));
  }
  redirect(withLocale(creatorPortalRoutes.projects, locale));
}
