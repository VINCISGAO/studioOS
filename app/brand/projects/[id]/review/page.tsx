import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandCreativeReview } from "@/components/studioos/brand-creative-review";
import { PerformanceAttributionPanel } from "@/components/studioos/performance-attribution-panel";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder, getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { listPerformanceForOrder } from "@/lib/studioos/creative-performance-store";
import { listReviewComments } from "@/lib/studioos/review-store";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams & { version?: string; completed?: string; revision?: string }>;
};

export default async function BrandProjectReviewPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const clientEmail = await getCurrentClientEmail();

  const project = await getProject(id);
  const order = project ? await getOrderForProject(id) : await getOrder(id);

  if (!order) {
    notFound();
  }

  if (clientEmail && order.client_email !== clientEmail.toLowerCase()) {
    redirect(withLocale("/brand", locale));
  }

  const deliverables = await getDeliverables(order.id);
  const comments = await listReviewComments(order.id);
  const performanceRecords = await listPerformanceForOrder(order.id);
  const initialVersion = Number(query.version) || deliverables[deliverables.length - 1]?.version || 1;
  const campaignTitle = project?.title || order.title || order.company_name;
  const flash =
    query.completed === "1" ? ("completed" as const) : query.revision === "requested" ? ("revision" as const) : undefined;

  return (
    <div>
      <Link href={withLocale("/brand", locale)} className="text-sm text-zinc-500 hover:text-zinc-900">
        ← {locale === "zh" ? "返回首页" : "Back home"}
      </Link>
      <div className="mt-6">
        <BrandCreativeReview
          locale={locale}
          order={order}
          campaignTitle={campaignTitle}
          deliverables={deliverables}
          initialComments={comments}
          initialVersion={initialVersion}
          flash={flash}
        />

        {deliverables.length ? (
          <div className="mt-8">
            <PerformanceAttributionPanel
              locale={locale}
              orderId={order.id}
              deliverables={deliverables}
              existingRecords={performanceRecords}
              defaultCategory={project?.category ?? "CPG"}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
