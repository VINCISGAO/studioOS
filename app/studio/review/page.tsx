import { redirect } from "next/navigation";
import { StudioReviewHubBoard } from "@/components/studioos/studio-review-hub-board";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { listCreatorReviewHubItems } from "@/lib/studioos/review-hub";

export default async function StudioReviewHubPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const creator = await getCurrentCreator();
  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const items = await listCreatorReviewHubItems(creator.id);

  return <StudioReviewHubBoard locale={locale} items={items} />;
}
