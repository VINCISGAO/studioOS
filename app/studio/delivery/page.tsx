import { redirect } from "next/navigation";
import { StudioDeliveryHub, type DeliveryOrderRow } from "@/components/studioos/studio-delivery-hub";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, listOrdersForCreator } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { listReviewComments } from "@/lib/studioos/review-store";
import { runQualityChecksAsync } from "@/lib/studioos/quality";

export default async function StudioDeliveryPage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { order?: string }>;
}) {
  const query = await searchParams;
  const locale = getLocale(query);
  const creator = await getCurrentCreator();
  if (!creator) redirect(withLocale("/login?role=creator", locale));

  const orders = await listOrdersForCreator(creator.id);
  const rows: DeliveryOrderRow[] = await Promise.all(
    orders.map(async (order) => {
      const [deliverables, comments, project] = await Promise.all([
        getDeliverables(order.id),
        listReviewComments(order.id),
        order.project_id ? getProject(order.project_id) : Promise.resolve(null)
      ]);
      const latest = deliverables[0];
      const qualityReport = await runQualityChecksAsync(order.id, {
        hasDeliverable: deliverables.length > 0,
        videoUrl: latest?.file_url ?? null
      });
      return {
        order,
        deliverables,
        comments,
        openComments: comments.filter((item) => item.status === "open").length,
        totalComments: comments.length,
        qualityReport,
        projectDeadline: project?.deadline ?? null
      };
    })
  );

  const sortedRows = [...rows].sort((a, b) => {
    const priority = (status: string) => {
      if (["in_production", "revision", "review"].includes(status)) return 0;
      if (status === "waiting_payment") return 1;
      if (status === "completed") return 2;
      return 3;
    };
    const diff = priority(a.order.status) - priority(b.order.status);
    if (diff !== 0) return diff;
    return new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime();
  });

  const initialOrderId =
    typeof query.order === "string"
      ? query.order
      : Array.isArray(query.order)
        ? query.order[0]
        : undefined;

  return (
    <StudioDeliveryHub locale={locale} rows={sortedRows} initialOrderId={initialOrderId} />
  );
}
