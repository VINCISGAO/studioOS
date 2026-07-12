import { getAppUiLocale } from "@/lib/app-language";
import { QualityCenterPanel } from "@/components/studioos/quality-center-panel";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { getDeliverables } from "@/lib/order-service";
import { type SearchParams } from "@/lib/i18n";
import { runQualityChecksAsync } from "@/lib/studioos/quality";
import { promises as fs } from "fs";
import path from "path";

const copy = {
  en: {
    title: "Quality Center",
    subtitle: "Platform-wide AI quality — reads real deliverable metadata when available.",
    empty: "No real orders available for quality checks yet."
  },
  zh: {
    title: "质检中心",
    subtitle: "全平台智能质检，读取真实交付视频元数据。",
    empty: "暂无真实订单可质检。"
  }
} as const;

export default async function AdminQualityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];

  let orderIds: { id: string; title: string }[] = [];
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".data/order-store.json"), "utf8");
    const store = JSON.parse(raw) as { orders: { id: string; title: string }[] };
    orderIds = store.orders.slice(0, 3).map((o) => ({ id: o.id, title: o.title }));
  } catch {
    orderIds = [];
  }

  const sampleReports = await Promise.all(
    orderIds.map(async (order) => {
      const deliverables = await getDeliverables(order.id);
      const latest = deliverables[0];
      return {
        order,
        report: await runQualityChecksAsync(order.id, {
          hasDeliverable: deliverables.length > 0,
          videoUrl: latest?.file_url ?? null
        })
      };
    })
  );

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <div className="space-y-6">
        {sampleReports.length ? (
          sampleReports.map(({ order, report }) => (
            <Card key={order.id} className="border-zinc-200/80 shadow-none">
              <CardContent className="p-6">
                <p className="font-medium">{order.title || order.id}</p>
                <div className="mt-4">
                  <QualityCenterPanel locale={locale} report={report} />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-zinc-200/80 shadow-none">
            <CardContent className="p-6 text-sm text-zinc-500">{t.empty}</CardContent>
          </Card>
        )}
      </div>
    </AdminPageShell>
  );
}
