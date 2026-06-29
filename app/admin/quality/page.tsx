import { QualityCenterPanel } from "@/components/studioos/quality-center-panel";
import { Card, CardContent } from "@/components/ui/card";
import { getDeliverables } from "@/lib/order-service";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { runQualityChecksAsync } from "@/lib/studioos/quality";
import { promises as fs } from "fs";
import path from "path";

export default async function AdminQualityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);

  let orderIds: { id: string; title: string }[] = [];
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".data/order-store.json"), "utf8");
    const store = JSON.parse(raw) as { orders: { id: string; title: string }[] };
    orderIds = store.orders.slice(0, 3).map((o) => ({ id: o.id, title: o.title }));
  } catch {
    orderIds = [{ id: "demo", title: "Demo campaign" }];
  }

  const sampleReports = await Promise.all(
    orderIds.map(async (order) => {
      const deliverables = order.id === "demo" ? [] : await getDeliverables(order.id);
      const latest = deliverables[0];
      return {
        order,
        report: await runQualityChecksAsync(order.id, {
          hasDeliverable: deliverables.length > 0,
          videoUrl: latest?.file_url ?? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        })
      };
    })
  );

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Quality Center</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh"
          ? "全平台 AI 质检 — ffprobe 读取真实交付视频元数据。"
          : "Platform-wide AI quality — ffprobe reads real deliverable metadata when available."}
      </p>
      <div className="mt-8 space-y-6">
        {sampleReports.map(({ order, report }) => (
          <Card key={order.id} className="border-zinc-200/80 shadow-none">
            <CardContent className="p-6">
              <p className="font-medium">{order.title || order.id}</p>
              <div className="mt-4">
                <QualityCenterPanel locale={locale} report={report} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
