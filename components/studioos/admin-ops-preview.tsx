import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminAuditLogView, AdminDisputeView } from "@/features/admin/admin.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { adminDisputeStatusLabel } from "@/lib/studioos/admin-enum-labels";
import { adminActivityLabel } from "@/lib/studioos/admin-i18n";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    recentDisputes: "Open disputes",
    recentAudit: "Recent audit",
    viewAll: "View all",
    emptyDisputes: "No open disputes.",
    emptyAudit: "No recent activity."
  },
  zh: {
    recentDisputes: "待处理争议",
    recentAudit: "最近审计",
    viewAll: "查看全部",
    emptyDisputes: "暂无待处理争议。",
    emptyAudit: "暂无最近活动。"
  }
};

export function AdminOpsPreview({
  locale,
  disputes,
  auditLogs
}: {
  locale: Locale;
  disputes: AdminDisputeView[];
  auditLogs: AdminAuditLogView[];
}) {
  const t = copy[locale];

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t.recentDisputes}</h2>
            <Link href={withLocale(adminPortalRoutes.disputes, locale)} className="text-sm text-zinc-500 hover:underline">
              {t.viewAll}
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {disputes.length ? (
              disputes.map((dispute) => (
                <li key={dispute.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={withLocale(adminPortalRoutes.disputeDetail(dispute.id), locale)}
                      className="font-medium hover:underline"
                    >
                      {dispute.campaignTitle}
                    </Link>
                    <Badge variant="warning">{adminDisputeStatusLabel(dispute.status, locale)}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{dispute.reason}</p>
                </li>
              ))
            ) : (
              <p className="text-sm text-zinc-500">{t.emptyDisputes}</p>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t.recentAudit}</h2>
            <Link href={withLocale(adminPortalRoutes.audit, locale)} className="text-sm text-zinc-500 hover:underline">
              {t.viewAll}
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {auditLogs.length ? (
              auditLogs.map((log) => (
                <li key={log.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline">{adminActivityLabel(log.action, locale)}</Badge>
                    <span className="text-xs text-zinc-500">{formatDate(log.createdAt, locale)}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{log.campaignTitle ?? log.campaignId}</p>
                </li>
              ))
            ) : (
              <p className="text-sm text-zinc-500">{t.emptyAudit}</p>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
