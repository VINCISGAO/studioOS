import { Suspense } from "react";
import { BrandMessagesHub } from "@/components/studioos/brand-messages-hub";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { listNotificationsForBrand } from "@/lib/studioos/brand-notification-service";

export default async function BrandMessagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const locale = getLocale(query);
  const clientEmail = await getCurrentClientEmail();
  const projectNotifications = clientEmail ? await listNotificationsForBrand(clientEmail) : [];

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />}>
      <BrandMessagesHub locale={locale} projectNotifications={projectNotifications} />
    </Suspense>
  );
}
