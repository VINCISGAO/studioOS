import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { StudioReviewHubBoard } from "@/components/studioos/studio-review-hub-board";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { repairSelectedCreatorCampaignOrders } from "@/lib/order-service";
import { listCreatorReviewHubItems } from "@/lib/studioos/review-hub";

export default async function StudioReviewHubPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getAppUiLocale();
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    redirect(withLocale("/login?role=creator", locale));
  }

  await repairSelectedCreatorCampaignOrders(creatorId);
  const items = await listCreatorReviewHubItems(creatorId);

  return <StudioReviewHubBoard locale={locale} items={items} />;
}
