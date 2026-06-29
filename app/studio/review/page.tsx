import Link from "next/link";
import { redirect } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/studioos/ui/page-header";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { listOrdersForCreator } from "@/lib/order-service";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { listStudioProjects } from "@/lib/mvp/store";
import { getMvpProfile } from "@/lib/mvp/session";

export default async function StudioReviewHubPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const creator = await getCurrentCreator();
  if (!creator) redirect(withLocale("/login?role=creator", locale));

  const profile = await getMvpProfile();
  const [orders, mvpProjects] = await Promise.all([
    listOrdersForCreator(creator.id),
    profile ? listStudioProjects(profile.id) : Promise.resolve([])
  ]);

  const reviewOrders = orders.filter((o) =>
    ["in_production", "review", "revision", "waiting_payment"].includes(o.status)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={locale === "zh" ? "审片中心" : "Review center"}
        description={
          locale === "zh"
            ? "上传审片版本、查看品牌反馈、管理改稿轮次。"
            : "Upload review versions, read brand feedback, and manage revision rounds."
        }
      />

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-zinc-950">
            {locale === "zh" ? "分配订单" : "Assigned orders"}
          </h2>
        </div>
        {reviewOrders.length ? (
          <ul className="divide-y divide-zinc-100">
            {reviewOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div>
                  <p className="font-medium text-zinc-900">{order.title || order.company_name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{order.status}</p>
                </div>
                <Button asChild size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                  <Link href={withLocale(creatorPortalRoutes.review(order.id), locale)}>
                    <Clapperboard className="h-4 w-4" />
                    {locale === "zh" ? "进入审片" : "Open review"}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-zinc-500">
            {locale === "zh" ? "暂无审片中的订单。" : "No orders in review yet."}
          </p>
        )}
      </section>

      {mvpProjects.length ? (
        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-zinc-950">
              {locale === "zh" ? "审片项目" : "Review projects"}
            </h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {mvpProjects.map((project) => (
              <li
                key={project.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div>
                  <p className="font-medium text-zinc-900">{project.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{project.brand_name}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href={withLocale(`/workspace/projects/${project.id}/review`, locale)}>
                    <Clapperboard className="h-4 w-4" />
                    {locale === "zh" ? "审片" : "Review"}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
