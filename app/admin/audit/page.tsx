import { getAppUiLocale } from "@/lib/app-language";
import { ScrollText } from "lucide-react";
import { AdminPageActionLink, AdminPageShell } from "@/components/studioos/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auditService } from "@/features/admin/audit.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { adminActivityLabel } from "@/lib/studioos/admin-i18n";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    title: "Activity audit log",
    subtitle: "Platform-wide campaign actions, playback audits, and admin resolutions.",
    explorer: "Advanced explorer",
    table: ["Time", "Campaign", "User", "Action", "Details"],
    empty: "No activity logs yet."
  },
  zh: {
    title: "活动审计日志",
    subtitle: "全平台活动操作、播放审计与管理端裁决记录。",
    explorer: "高级筛选",
    table: ["时间", "活动", "用户", "操作", "详情"],
    empty: "暂无审计记录。"
  }
} as const;

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const logs = user ? await auditService.list(user, { limit: 100 }) : [];

  return (
    <AdminPageShell
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      actions={
        <AdminPageActionLink href={withLocale(adminPortalRoutes.activityLog, locale)}>{t.explorer}</AdminPageActionLink>
      }
    >
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <div className="border-b p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ScrollText className="h-5 w-5" />
              {t.title}
            </h2>
          </div>
          {logs.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {t.table.map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(log.createdAt, locale)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{log.campaignTitle ?? log.campaignId}</div>
                    </TableCell>
                    <TableCell>{log.userEmail ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{adminActivityLabel(log.action, locale)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-zinc-500">
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-sm text-zinc-500">{t.empty}</p>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
