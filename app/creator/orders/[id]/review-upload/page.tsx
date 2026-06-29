import { redirect } from "next/navigation";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function LegacyCreatorReviewUploadRedirect({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  redirect(withLocale(creatorPortalRoutes.review(id), locale));
}
