import Link from "next/link";
import { redirect } from "next/navigation";
import { StudioCreativeWorkspace } from "@/components/studioos/studio-creative-workspace";
import { getCreativeBrief, listPackItems } from "@/lib/campaign-store";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { listReviewComments } from "@/lib/studioos/review-store";

export default async function StudioProjectPage({
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
    redirect(withLocale("/studio", locale));
  }

  const project = order.project_id ? await getProject(order.project_id) : null;
  const [deliverables, comments, brief, pack] = await Promise.all([
    getDeliverables(order.id),
    listReviewComments(order.id),
    order.project_id ? getCreativeBrief(order.project_id) : Promise.resolve(null),
    order.project_id ? listPackItems(order.project_id) : Promise.resolve([])
  ]);

  const canUpload = ["in_production", "revision", "review"].includes(order.status);

  return (
    <div>
      <Link href={withLocale("/studio", locale)} className="text-sm text-zinc-500 hover:text-zinc-900">
        ← {locale === "zh" ? "返回制作台" : "Back to workspace"}
      </Link>
      <div className="mt-6">
        <StudioCreativeWorkspace
          locale={locale}
          studioName={creator.name}
          order={order}
          project={project}
          brief={brief}
          pack={pack}
          deliverables={deliverables}
          comments={comments}
          canUpload={canUpload}
        />
      </div>
    </div>
  );
}
