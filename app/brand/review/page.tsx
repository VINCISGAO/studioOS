import Link from "next/link";
import { redirect } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/studioos/ui/page-header";
import { brandPortalService } from "@/features/brand/brand-portal.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { listOrdersForClient } from "@/lib/order-service";
import { listProjectsForClient } from "@/lib/project-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { toBrandProjectRows } from "@/lib/studioos/brand-dashboard";

export default async function BrandReviewHubPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) redirect(withLocale("/login?role=brand", locale));

  const user = await getSessionUser();
  const [orders, projects] = await Promise.all([
    listOrdersForClient(clientEmail),
    listProjectsForClient(clientEmail)
  ]);
  const rows = toBrandProjectRows(orders, projects, locale).filter(
    (row) => row.phase === "active" && (row.status === "in_review" || row.status === "review" || row.status === "revision")
  );

  const prismaReview =
    user && !user.id.startsWith("demo_")
      ? await brandPortalService.listReviewItems({ id: user.id, role: user.role })
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={locale === "zh" ? "审片中心" : "Review center"}
        description={
          locale === "zh"
            ? "查看制作团队提交的版本，添加时间码反馈并批准交付。"
            : "Review studio submissions, leave timed feedback, and approve delivery."
        }
      />

      {prismaReview.length ? (
        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-zinc-950">Campaigns</h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {prismaReview.map((campaign) => (
              <li
                key={campaign.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div>
                  <p className="font-medium text-zinc-900">{campaign.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{campaign.status}</p>
                </div>
                <Button asChild size="sm" className="rounded-xl bg-zinc-900">
                  <Link href={withLocale(brandPortalRoutes.projectReview(campaign.id), locale)}>
                    <Clapperboard className="h-4 w-4" />
                    {locale === "zh" ? "进入审片" : "Open review"}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-zinc-950">
            {locale === "zh" ? "广告项目" : "Ad projects"}
          </h2>
        </div>
        {rows.length ? (
          <ul className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div>
                  <p className="font-medium text-zinc-900">{row.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{String(row.status)}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href={withLocale(row.href, locale)}>
                    <Clapperboard className="h-4 w-4" />
                    {locale === "zh" ? "审片" : "Review"}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-zinc-500">
            {locale === "zh" ? "暂无待审片项目。" : "No projects awaiting review."}
          </p>
        )}
      </section>
    </div>
  );
}
