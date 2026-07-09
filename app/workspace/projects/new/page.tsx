import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

export default async function WorkspaceNewProjectRedirect({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const locale = await getAppUiLocale();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "lang" || value == null) continue;
    params.set(key, String(value));
  }
  const suffix = params.toString();
  redirect(withLocale(`${brandPortalRoutes.newProject}${suffix ? `?${suffix}` : ""}`, locale));
}
