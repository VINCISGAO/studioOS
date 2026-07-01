import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

export default async function StudioProfileRedirectPage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { publish?: string; onboarding?: string }>;
}) {
  const params = await searchParams;
  const locale = getLocale(params);
  const query = new URLSearchParams();
  if (params.publish === "1") query.set("publish", "1");
  if (params.onboarding === "1") query.set("onboarding", "1");
  const qs = query.toString();
  redirect(withLocale(qs ? `${creatorPortalRoutes.works}?${qs}` : creatorPortalRoutes.works, locale));
}
