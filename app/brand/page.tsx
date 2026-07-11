import { getAppUiLocale } from "@/lib/app-language";
import { BrandWorkspaceOverview } from "@/components/studioos/brand-workspace-overview";
import type { SearchParams } from "@/lib/i18n";
import { getCurrentSession } from "@/lib/session-user";
import { getBrandPortalDisplayName, getBrandPortalOrders, getBrandPortalProjects } from "@/lib/studioos/brand-portal-data";
import { toBrandProjectRows } from "@/lib/studioos/brand-dashboard";
import { countActiveCampaignRows } from "@/lib/studioos/brand-active-campaign-limit";
import {
  brandCampaignLimitErrorMessage,
  brandCampaignRateLimitErrorMessage,
  resolveBrandCampaignCreationGate
} from "@/lib/studioos/brand-active-campaign.server";
import { fallbackProjectThumbnail } from "@/lib/studioos/project-thumbnail";
import { resolveThumbnailsByProjectId } from "@/lib/studioos/resolve-project-thumbnails";
import { pickLatestEphemeralWizardProject } from "@/lib/studioos/brand-wizard-session";

export default async function BrandHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const locale = await getAppUiLocale();
  const session = await getCurrentSession();
  const clientEmail = session!.email.toLowerCase();
  const [brandName, orders, projects] = await Promise.all([
    getBrandPortalDisplayName(clientEmail),
    getBrandPortalOrders(clientEmail),
    getBrandPortalProjects(clientEmail)
  ]);
  const wizardProject = pickLatestEphemeralWizardProject(projects);
  const thumbnailsByProjectId = await resolveThumbnailsByProjectId(projects.map((project) => project.id));
  const rows = toBrandProjectRows(orders, projects, locale).map((row) => {
    if (row.kind === "campaign") {
      return {
        ...row,
        thumbnailUrl:
          thumbnailsByProjectId[row.id] ?? fallbackProjectThumbnail(row.id)
      };
    }
    const linkedProjectId = orders.find((order) => order.id === row.id)?.project_id;
    return {
      ...row,
      thumbnailUrl: linkedProjectId
        ? thumbnailsByProjectId[linkedProjectId] ?? fallbackProjectThumbnail(linkedProjectId)
        : fallbackProjectThumbnail(row.id)
    };
  });
  const orderProjectMap = Object.fromEntries(orders.map((order) => [order.id, order.project_id]));
  const activeCampaignCount = countActiveCampaignRows(rows);
  const creationGateResult = await resolveBrandCampaignCreationGate(clientEmail);
  const rateLimitRedirectCode =
    typeof query.code === "string" && query.code === "10m" ? "rate_limit_10m" : "rate_limit_24h";
  const startBriefError =
    query.error === "wizard-access"
      ? locale === "zh"
        ? "无法打开该广告草稿。系统已阻止访问不属于当前账号的草稿，请重新点击发布广告需求。"
        : "Could not open that ad draft. VINCIS blocked access to a draft outside this account. Click Publish ad brief again."
      : query.error === "start-brief" || query.error === "draft-failed"
        ? locale === "zh"
          ? "广告需求草稿创建失败，请刷新后重试。如果仍失败，请检查 production database。"
          : "Could not create the ad brief draft. Refresh and try again. If it still fails, check the production database."
        : query.error === "campaign-limit"
          ? brandCampaignLimitErrorMessage(locale)
          : query.error === "campaign-rate-limit"
            ? brandCampaignRateLimitErrorMessage(locale, rateLimitRedirectCode)
            : null;

  return (
    <div className="space-y-4">
      {startBriefError ? (
        <div
          className={
            query.error === "campaign-limit" || query.error === "campaign-rate-limit"
              ? "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
              : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          }
        >
          {startBriefError}
        </div>
      ) : null}
      <BrandWorkspaceOverview
        locale={locale}
        name={brandName}
        rows={rows}
        orderProjectMap={orderProjectMap}
        wizardProjectId={wizardProject?.id}
        activeCampaignCount={activeCampaignCount}
        creationGate={creationGateResult.gate}
        rateLimitCode={creationGateResult.rateLimitCode}
      />
    </div>
  );
}
