import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { AdMetric, AnalyticsDataSource, CreativeInsight } from "@/lib/studioos/analytics";
import { formatMetric } from "@/lib/studioos/analytics";
import { insightToQueryParams } from "@/lib/studioos/insight-engine";
import type { StoredCreativeInsight } from "@/lib/studioos/creative-performance-types";
import { formatCurrency } from "@/lib/utils";
import { Lightbulb, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  locale: Locale;
  summary: {
    avgCtr: number;
    avgHookScore: number;
    avgRetention: number;
    avgWatchTime: number;
    totalAds: number;
    monthSpend: number;
  };
  ads: AdMetric[];
  insights: CreativeInsight[];
  dataSource?: AnalyticsDataSource;
  connectedPlatforms?: string[];
  rawInsights?: StoredCreativeInsight[];
};

export function CreativeAnalyticsDashboard({
  locale,
  summary,
  ads,
  insights,
  dataSource = "empty",
  connectedPlatforms = [],
  rawInsights = []
}: Props) {
  const metrics = [
    {
      label: locale === "zh" ? "平均 CTR" : "Avg CTR",
      value: formatMetric(summary.avgCtr, "%", locale)
    },
    {
      label: locale === "zh" ? "Hook Score" : "Hook score",
      value: `${Math.round(summary.avgHookScore)}`
    },
    {
      label: locale === "zh" ? "3s 留存" : "3s retention",
      value: formatMetric(summary.avgRetention, "%", locale)
    },
    {
      label: locale === "zh" ? "观看时长" : "Watch time",
      value: formatMetric(summary.avgWatchTime, "s", locale)
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={dataSource === "live" ? "success" : dataSource === "mixed" || dataSource === "attributed" ? "warning" : "secondary"}>
          {dataSource === "live"
            ? locale === "zh"
              ? "实时 API"
              : "Live API"
            : dataSource === "mixed"
              ? locale === "zh"
                ? "混合数据"
                : "Mixed"
              : dataSource === "attributed"
                ? locale === "zh"
                  ? "归因数据"
                  : "Attributed"
                : locale === "zh"
                  ? "暂无数据"
                  : "No data"}
        </Badge>
        {connectedPlatforms.map((p) => (
          <Badge key={p} variant="outline">
            {p}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-zinc-200/80 shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-500">{m.label}</p>
              <p className="mt-2 text-3xl font-semibold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="border-b p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-lg font-semibold">
              {locale === "zh" ? "广告表现" : "Ad performance"}
            </h2>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {summary.totalAds} {locale === "zh" ? "条广告" : "ads"} ·{" "}
            {locale === "zh" ? "本月支出" : "month spend"} {formatCurrency(summary.monthSpend)}
          </p>
        </CardContent>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-zinc-500">
                  <th className="px-6 py-3 font-medium">{locale === "zh" ? "广告" : "Ad"}</th>
                  <th className="px-4 py-3 font-medium">CTR</th>
                  <th className="px-4 py-3 font-medium">Hook</th>
                  <th className="px-4 py-3 font-medium">{locale === "zh" ? "留存" : "Retention"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "zh" ? "转化" : "Conv."}</th>
                </tr>
              </thead>
              <tbody>
                {ads.length ? (
                  ads.map((ad) => (
                    <tr key={ad.id} className="border-b last:border-0">
                      <td className="px-6 py-4">
                        <p className="font-medium">{ad.name}</p>
                        <p className="text-xs text-zinc-500">{ad.platform}</p>
                      </td>
                      <td className="px-4 py-4">{ad.ctr.toFixed(1)}%</td>
                      <td className="px-4 py-4">{ad.hookScore}</td>
                      <td className="px-4 py-4">{ad.retention3s}%</td>
                      <td className="px-4 py-4">{ad.conversion.toFixed(1)}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-zinc-500">
                      {locale === "zh" ? "上传归因数据或连接广告平台后，这里会显示真实广告表现。" : "Upload attribution data or connect an ad platform to see real ad performance here."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">
            {locale === "zh" ? "Creative Intelligence" : "Creative Intelligence"}
          </h2>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {locale === "zh"
            ? "订阅价值：数据驱动的下一次 Campaign 建议。"
            : "Subscription value — data-driven recommendations for your next campaign."}
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {insights.length ? (
            insights.map((insight) => {
            const raw = rawInsights.find((item) => item.id === insight.id);
            const params = raw ? insightToQueryParams(raw) : {};
            const applyHref = withLocale(
              `/brand/projects/new?${new URLSearchParams(params).toString()}`,
              locale
            );

            return (
            <Card key={insight.id} className="border-zinc-200/80 shadow-none">
              <CardContent className="p-5">
                <span
                  className={
                    insight.impact === "high"
                      ? "text-xs font-semibold uppercase text-emerald-600"
                      : "text-xs font-semibold uppercase text-zinc-500"
                  }
                >
                  {insight.impact === "high"
                    ? locale === "zh"
                      ? "高影响"
                      : "High impact"
                    : locale === "zh"
                      ? "建议"
                      : "Insight"}
                </span>
                <h3 className="mt-2 font-semibold">{insight.title[locale]}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{insight.body[locale]}</p>
                {Object.keys(params).length ? (
                  <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
                    <Link href={applyHref}>
                      {locale === "zh" ? "应用到新 Campaign" : "Apply to new campaign"}
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
            );
          })
          ) : (
            <Card className="border-zinc-200/80 shadow-none lg:col-span-2">
              <CardContent className="p-6 text-sm text-zinc-500">
                {locale === "zh" ? "暂无真实洞察。导入表现数据后，系统会生成可复用建议。" : "No real insights yet. Import performance data to generate reusable recommendations."}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
