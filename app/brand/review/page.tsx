import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { BrandReviewHubBoard } from "@/components/studioos/brand-review-hub/brand-review-hub-board";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { listBrandReviewHubItems } from "@/lib/studioos/review-hub";

export default async function BrandReviewHubPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getAppUiLocale();
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) redirect(withLocale("/login?role=brand", locale));

  void searchParams;
  const items = await listBrandReviewHubItems(clientEmail);

  return <BrandReviewHubBoard locale={locale} items={items} />;
}
