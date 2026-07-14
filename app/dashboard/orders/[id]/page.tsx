import { permanentRedirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { resolveLegacyOrderRedirectPath } from "@/lib/studioos/legacy-route-redirect";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function LegacyDashboardOrderRedirectPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const result = await resolveLegacyOrderRedirectPath(id);

  if (result.kind === "login") {
    permanentRedirect(withLocale(`/login?next=${encodeURIComponent(result.nextPath)}`, locale));
  }

  permanentRedirect(withLocale(result.path, locale));
}
