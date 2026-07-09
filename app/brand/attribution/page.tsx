import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { BrandAttributionHub } from "@/components/studioos/brand-attribution-hub";
import { getCurrentClientEmail } from "@/lib/client-session";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { getBrandAttributionWorkspace } from "@/lib/studioos/attribution-service";

export default async function BrandAttributionPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getAppUiLocale();
  const clientEmail = await getCurrentClientEmail();

  if (!clientEmail) {
    redirect(withLocale("/login?role=brand", locale));
  }

  const workspace = await getBrandAttributionWorkspace(clientEmail);

  return (
    <BrandAttributionHub
      locale={locale}
      rows={workspace.rows}
      insights={workspace.insights}
      sources={workspace.sources}
      campaignOptions={workspace.campaignOptions}
      pendingCount={workspace.pendingCount}
      attributedCount={workspace.attributedCount}
    />
  );
}
