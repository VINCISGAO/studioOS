import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Receipt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/studioos/ui/page-header";
import { brandPortalService } from "@/features/brand/brand-portal.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { formatCurrency } from "@/lib/utils";

export default async function BrandSettlementPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getAppUiLocale();
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) redirect(withLocale("/login?role=brand", locale));

  const user = await getSessionUser();
  const escrows =
    user && !user.id.startsWith("demo_")
      ? await brandPortalService.listSettlementItems({ id: user.id, role: user.role })
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={locale === "zh" ? "托管与结算" : "Escrow & settlement"}
        description={
          locale === "zh"
            ? "查看每笔 Campaign 的托管状态。批准交付后，资金会从托管释放给制作团队。"
            : "Track escrow for each campaign. After approval, held funds release to the studio."
        }
      />

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        {escrows.length ? (
          <ul className="divide-y divide-zinc-100">
            {escrows.map((item) => {
              const projectId = item.legacyProjectId ?? item.campaignId;
              return (
              <li
                key={item.campaignId}
                className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <Wallet className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-zinc-900">{item.campaignTitle}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {item.status} · {formatCurrency(item.amount, locale)} {item.currency}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {locale === "zh" ? "剩余托管" : "Remaining"}:{" "}
                      {formatCurrency(item.remainingAmount, locale)} · {locale === "zh" ? "已释放" : "Released"}:{" "}
                      {formatCurrency(item.releasedAmount, locale)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link href={withLocale(brandPortalRoutes.project(projectId), locale)}>
                      {locale === "zh" ? "项目详情" : "Project"}
                    </Link>
                  </Button>
                  {item.remainingAmount > 0 && item.status === "HELD" ? (
                    <Button asChild size="sm" className="rounded-xl bg-zinc-900">
                      <Link href={withLocale(brandPortalRoutes.projectReview(projectId), locale)}>
                        <Receipt className="h-4 w-4" />
                        {locale === "zh" ? "审片并结算" : "Review & settle"}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </li>
            );
            })}
          </ul>
        ) : (
          <p className="px-6 py-12 text-center text-sm text-zinc-500">
            {locale === "zh"
              ? "暂无托管记录。完成付款后，托管信息会显示在这里。"
              : "No escrow records yet. After checkout, escrow details appear here."}
          </p>
        )}
      </section>
    </div>
  );
}
