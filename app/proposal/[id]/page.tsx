import { notFound, permanentRedirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { resolveLegacyProposalRedirectPath } from "@/lib/studioos/legacy-route-redirect";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function LegacyProposalRedirectPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const destination = await resolveLegacyProposalRedirectPath(id);
  if (!destination) notFound();
  permanentRedirect(withLocale(destination, locale));
}
