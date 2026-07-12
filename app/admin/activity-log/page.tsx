import { getAppUiLocale } from "@/lib/app-language";
import { adminActivityLogService } from "@/features/admin/admin-activity-log.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageActionLink, AdminPageShell } from "@/components/studioos/admin-page-shell";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { adminFields } from "@/lib/studioos/admin-copy";
import { adminActivityLabel } from "@/lib/studioos/admin-i18n";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    title: "Activity log explorer",
    subtitle: "Filter campaign actions and metadata across the platform.",
    auditView: "Audit view",
    filter: "Filter",
    placeholders: {
      action: "Action",
      userId: "User ID",
      campaignId: "Campaign ID",
      search: "Search"
    }
  },
  zh: {
    title: "活动日志",
    subtitle: "筛选全平台活动操作与元数据。",
    auditView: "审计视图",
    filter: "筛选",
    placeholders: {
      action: "操作类型",
      userId: "用户编号",
      campaignId: "活动编号",
      search: "搜索"
    }
  }
} as const;

export default async function AdminActivityLogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const f = adminFields(locale);
  const user = await getAdminSessionUser();

  const filters = {
    campaignId: typeof params.campaignId === "string" ? params.campaignId : undefined,
    userId: typeof params.userId === "string" ? params.userId : undefined,
    action: typeof params.action === "string" ? params.action : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined
  };

  const logs = user ? await adminActivityLogService.list(user, { ...filters, limit: 200 }) : [];

  return (
    <AdminPageShell
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      actions={
        <AdminPageActionLink href={withLocale(adminPortalRoutes.audit, locale)}>{t.auditView}</AdminPageActionLink>
      }
    >
      <form method="get" className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <input type="hidden" name="lang" value={locale} />
        <Input name="action" defaultValue={filters.action} placeholder={t.placeholders.action} />
        <Input name="userId" defaultValue={filters.userId} placeholder={t.placeholders.userId} />
        <Input name="campaignId" defaultValue={filters.campaignId} placeholder={t.placeholders.campaignId} />
        <Input name="search" defaultValue={filters.search} placeholder={t.placeholders.search} />
        <Input name="from" type="date" defaultValue={filters.from} />
        <Input name="to" type="date" defaultValue={filters.to} />
        <Button type="submit">{t.filter}</Button>
      </form>
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{f.time}</TableHead>
                <TableHead>{f.campaign}</TableHead>
                <TableHead>{f.user}</TableHead>
                <TableHead>{f.action}</TableHead>
                <TableHead>{f.metadata}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.createdAt, locale)}</TableCell>
                  <TableCell>{log.campaignTitle ?? log.campaignId}</TableCell>
                  <TableCell>{log.userEmail ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{adminActivityLabel(log.action, locale)}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate text-xs">{log.metadata ? JSON.stringify(log.metadata) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
