import Link from "next/link";
import { redirect } from "next/navigation";
import { adminActivityLogService } from "@/features/admin/admin-activity-log.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { formatDate } from "@/lib/utils";

export default async function AdminActivityLogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = getLocale(params);
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
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{locale === "zh" ? "活动日志" : "Activity log explorer"}</h1>
        <Button asChild variant="outline" size="sm">
          <Link href={withLocale(adminPortalRoutes.audit, locale)}>{locale === "zh" ? "审计视图" : "Audit view"}</Link>
        </Button>
      </div>
      <form method="get" className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <input type="hidden" name="lang" value={locale} />
        <Input name="action" defaultValue={filters.action} placeholder="action" />
        <Input name="userId" defaultValue={filters.userId} placeholder="userId" />
        <Input name="campaignId" defaultValue={filters.campaignId} placeholder="campaignId" />
        <Input name="search" defaultValue={filters.search} placeholder="search" />
        <Input name="from" type="date" defaultValue={filters.from} />
        <Input name="to" type="date" defaultValue={filters.to} />
        <Button type="submit">{locale === "zh" ? "筛选" : "Filter"}</Button>
      </form>
      <Card className="mt-6 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.createdAt)}</TableCell>
                  <TableCell>{log.campaignTitle ?? log.campaignId}</TableCell>
                  <TableCell>{log.userEmail ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate text-xs">{log.metadata ? JSON.stringify(log.metadata) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
