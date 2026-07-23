import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

export default async function StudioDeliveryRedirectPage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { order?: string; order_id?: string }>;
}) {
  const [locale, query] = await Promise.all([getAppUiLocale(), searchParams]);
  const orderId =
    (typeof query.order === "string" && query.order.trim()) ||
    (typeof query.order_id === "string" && query.order_id.trim()) ||
    null;

  const destination = orderId
    ? creatorPortalRoutes.deliveryForOrder(orderId)
    : creatorPortalRoutes.projects;

  redirect(withLocale(destination, locale));
}
