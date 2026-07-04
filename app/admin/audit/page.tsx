import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auditService } from "@/features/admin/audit.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to admin",
    eyebrow: "Compliance",
    title: "Activity audit log",
    subtitle: "Platform-wide campaign actions, playback audits, and admin resolutions.",
    table: ["Time", "Campaign", "User", "Action", "Details"],
    empty: "No activity logs yet."
  },
  zh: {
    back: "返回管理后台",
    eyebrow: "合规审计",
    title: "活动审计日志",
    subtitle: "全平台 Campaign 操作、播放审计与管理端裁决记录。",
    table: ["时间", "Campaign", "用户", "操作", "详情"],
    empty: "暂无审计记录。"
  }
};

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const logs = user ? await auditService.list(user, { limit: 100 }) : [];

  return (
    <div>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={withLocale(adminPortalRoutes.dashboard, locale)}>
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={withLocale(adminPortalRoutes.activityLog, locale)}>
            {locale === "zh" ? "高级筛选" : "Advanced explorer"}
          </Link>
        </Button>
      </div>
      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
      </div>

      <Card className="mt-8 shadow-none">
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
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(log.createdAt)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{log.campaignTitle ?? log.campaignId}</div>
                    </TableCell>
                    <TableCell>{log.userEmail ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">{t.empty}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
