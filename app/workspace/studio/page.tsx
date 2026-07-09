import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

export default async function WorkspaceStudioRedirect({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getAppUiLocale();
  redirect(withLocale(creatorPortalRoutes.projects, locale));
}
