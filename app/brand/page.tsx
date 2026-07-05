import { redirect } from "next/navigation";
import { BrandWorkspaceOverview } from "@/components/studioos/brand-workspace-overview";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getCurrentSession } from "@/lib/session-user";
import { getBrandPortalDisplayName, getBrandPortalOrders, getBrandPortalProjects } from "@/lib/studioos/brand-portal-data";
import { toBrandProjectRows } from "@/lib/studioos/brand-dashboard";
import { pickLatestEphemeralWizardProject } from "@/lib/studioos/brand-wizard-session";

export default async function BrandHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const locale = getLocale(query);
  const session = await getCurrentSession();

  if (!session || session.role !== "client") {
    redirect(withLocale("/login?role=brand", locale));
  }

  const clientEmail = session.email.toLowerCase();
  const [brandName, orders, projects] = await Promise.all([
    getBrandPortalDisplayName(clientEmail),
    getBrandPortalOrders(clientEmail),
    getBrandPortalProjects(clientEmail)
  ]);
  const wizardProject = pickLatestEphemeralWizardProject(projects);
  const rows = toBrandProjectRows(orders, projects, locale);
  const orderProjectMap = Object.fromEntries(orders.map((order) => [order.id, order.project_id]));
  const startBriefError =
    query.error === "wizard-access"
      ? locale === "zh"
        ? "无法打开该广告草稿。系统已阻止访问不属于当前账号的草稿，请重新点击发布广告需求。"
        : "Could not open that ad draft. VINCIS blocked access to a draft outside this account. Click Publish ad brief again."
      : query.error === "start-brief" || query.error === "draft-failed"
      ? locale === "zh"
        ? "广告需求草稿创建失败，请刷新后重试。如果仍失败，请检查 production database。"
        : "Could not create the ad brief draft. Refresh and try again. If it still fails, check the production database."
      : null;

  return (
    <div className="space-y-4">
      {startBriefError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {startBriefError}
        </div>
      ) : null}
      <BrandWorkspaceOverview
        locale={locale}
        name={brandName}
        rows={rows}
        orderProjectMap={orderProjectMap}
        wizardProjectId={wizardProject?.id}
      />
    </div>
  );
}
