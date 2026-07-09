import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { CreativeAnalyticsDashboard } from "@/components/studioos/creative-analytics-dashboard";
import { IntegrationStatus } from "@/components/studioos/integration-status";
import { Button } from "@/components/ui/button";
import { getCurrentClientEmail } from "@/lib/client-session";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { getCreativeAnalyticsAsync } from "@/lib/studioos/analytics";
import { getInsightsForOrg, orgIdFromEmail } from "@/lib/studioos/creative-performance-store";
import { BarChart3 } from "lucide-react";

export default async function BrandAnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const email = await getCurrentClientEmail();
  const { ads, insights, summary, dataSource, connectedPlatforms } = await getCreativeAnalyticsAsync(
    email ?? undefined
  );
  const rawInsights = email ? await getInsightsForOrg(orgIdFromEmail(email)) : [];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Creative Analytics</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh"
          ? "每条广告的 CTR、Hook、留存与转化 — 在归因中心上传后台数据，或配置 Meta/TikTok API。"
          : "CTR, hook, retention, conversion — upload platform data in Attribution, or connect Meta/TikTok APIs."}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <IntegrationStatus locale={locale} show={["meta", "tiktok"]} />
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={withLocale("/brand/attribution", locale)}>
            <BarChart3 className="h-4 w-4" />
            {locale === "zh" ? "上传归因数据" : "Upload attribution data"}
          </Link>
        </Button>
      </div>
      <div className="mt-8">
        <CreativeAnalyticsDashboard
          locale={locale}
          summary={summary}
          ads={ads}
          insights={insights}
          dataSource={dataSource}
          connectedPlatforms={connectedPlatforms}
          rawInsights={rawInsights}
        />
      </div>
    </div>
  );
}
