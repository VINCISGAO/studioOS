import { notFound, redirect } from "next/navigation";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { resolveMvpReviewProjectForOrder } from "@/lib/mvp/campaign-review-bridge";
import { getDeliverables, getOrder } from "@/lib/order-service";

export default async function StudioReviewOrderPage({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const creator = await getCurrentCreator();
  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const order = await getOrder(orderId);
  if (!order || order.creator_id !== creator.id) {
    notFound();
  }

  const deliverables = await getDeliverables(orderId);
  const mvpProjectId = await resolveMvpReviewProjectForOrder(order, { deliverables });

  redirect(withLocale(`/workspace/projects/${mvpProjectId}/review`, locale));
}
