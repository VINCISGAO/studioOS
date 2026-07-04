import { AdminOverviewLoader, AdminPageHeader } from "@/components/studioos/admin-overview-loader";
import { AdminOverviewSkeleton } from "@/components/studioos/admin-overview-skeleton";

const copy = {
  en: { title: "Platform overview", analytics: "Analytics dashboard" },
  zh: { title: "平台总览", analytics: "分析仪表盘" }
};

export default function AdminLoading() {
  return (
    <div>
      <AdminPageHeader locale="zh" title={copy.zh.title} analyticsLabel={copy.zh.analytics} />
      <AdminOverviewSkeleton />
    </div>
  );
}
