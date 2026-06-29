import { notFound, redirect } from "next/navigation";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { resolveMvpReviewProjectForOrder } from "@/lib/mvp/campaign-review-bridge";
import { getDeliverables, getOrder } from "@/lib/order-service";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export const dynamic = "force-dynamic";

export default async function CreatorReviewUploadPage({ params, searchParams }: PageProps) {
  const [{ id: orderId }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);

  if (!order || !creatorId || order.creator_id !== creatorId) {
    notFound();
  }

  const deliverables = await getDeliverables(orderId);
  const mvpProjectId = await resolveMvpReviewProjectForOrder(order, { deliverables });

  redirect(withLocale(`/workspace/projects/${mvpProjectId}/review`, locale));
}
