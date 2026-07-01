import { retryNotificationAction } from "@/app/admin-actions";
import { adminNotificationService } from "@/features/admin/notification/admin-notification.service";
import { getSessionUser } from "@/features/auth/session.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

export default async function AdminNotificationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = getLocale(params);
  const user = await getSessionUser();

  const filters = {
    failed: params.failed === "1",
    userId: typeof params.userId === "string" ? params.userId : undefined,
    campaignId: typeof params.campaignId === "string" ? params.campaignId : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined
  };

  const items = user ? await adminNotificationService.list(user, filters) : [];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{locale === "zh" ? "通知中心" : "Notification center"}</h1>
      <form method="get" className="mt-6 grid gap-3 sm:grid-cols-4">
        <input type="hidden" name="lang" value={locale} />
        <Input name="userId" defaultValue={filters.userId} placeholder="userId" />
        <Input name="campaignId" defaultValue={filters.campaignId} placeholder="campaignId" />
        <Input name="from" type="date" defaultValue={filters.from} />
        <Input name="to" type="date" defaultValue={filters.to} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="failed" value="1" defaultChecked={filters.failed} />
          {locale === "zh" ? "仅失败" : "Failed only"}
        </label>
        <Button type="submit">{locale === "zh" ? "筛选" : "Filter"}</Button>
      </form>
      <Card className="mt-6 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.createdAt)}</TableCell>
                  <TableCell className="text-xs">{row.userEmail ?? row.userId}</TableCell>
                  <TableCell className="max-w-xs truncate">{row.title}</TableCell>
                  <TableCell>
                    {!row.isSent && <Badge variant="warning">unsent</Badge>}
                    {row.isRead && <Badge variant="outline">read</Badge>}
                  </TableCell>
                  <TableCell>
                    {!row.isSent && (
                      <form action={retryNotificationAction}>
                        <input type="hidden" name="lang" value={locale} />
                        <input type="hidden" name="notification_id" value={row.id} />
                        <Button type="submit" size="sm" variant="outline">{locale === "zh" ? "重试" : "Retry"}</Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
