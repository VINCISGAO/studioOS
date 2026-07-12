import { getAppUiLocale } from "@/lib/app-language";
import { retryNotificationAction } from "@/app/admin-actions";
import { AdminFormCsrf } from "@/components/studioos/admin-form-csrf";
import { adminNotificationService } from "@/features/admin/notification/admin-notification.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type SearchParams } from "@/lib/i18n";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminFields } from "@/lib/studioos/admin-copy";
import {
  adminNotificationCategoryLabel,
  adminNotificationReadLabel,
  adminNotificationSentLabel
} from "@/lib/studioos/admin-enum-labels";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    title: "Notification center",
    subtitle: "Inspect delivery status and retry failed notifications.",
    failedOnly: "Failed only",
    filter: "Filter",
    retry: "Retry",
    placeholders: {
      userId: "User ID",
      campaignId: "Campaign ID"
    }
  },
  zh: {
    title: "通知中心",
    subtitle: "查看发送状态并重试失败通知。",
    failedOnly: "仅失败",
    filter: "筛选",
    retry: "重试",
    placeholders: {
      userId: "用户编号",
      campaignId: "活动编号"
    }
  }
} as const;

export default async function AdminNotificationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const f = adminFields(locale);
  const user = await getAdminSessionUser();

  const filters = {
    failed: params.failed === "1",
    userId: typeof params.userId === "string" ? params.userId : undefined,
    campaignId: typeof params.campaignId === "string" ? params.campaignId : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined
  };

  const items = user ? await adminNotificationService.list(user, filters) : [];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <form method="get" className="mb-6 grid gap-3 sm:grid-cols-4">
        <input type="hidden" name="lang" value={locale} />
        <Input name="userId" defaultValue={filters.userId} placeholder={t.placeholders.userId} />
        <Input name="campaignId" defaultValue={filters.campaignId} placeholder={t.placeholders.campaignId} />
        <Input name="from" type="date" defaultValue={filters.from} />
        <Input name="to" type="date" defaultValue={filters.to} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="failed" value="1" defaultChecked={filters.failed} />
          {t.failedOnly}
        </label>
        <Button type="submit">{t.filter}</Button>
      </form>
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{f.time}</TableHead>
                <TableHead>{f.user}</TableHead>
                <TableHead>{f.category}</TableHead>
                <TableHead>{f.title}</TableHead>
                <TableHead>{f.status}</TableHead>
                <TableHead>{f.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.createdAt, locale)}</TableCell>
                  <TableCell className="text-xs">{row.userEmail ?? row.userId}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline">{adminNotificationCategoryLabel(row.category, locale)}</Badge>
                      <p className="text-[11px] text-zinc-400">{row.type}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{row.title}</TableCell>
                  <TableCell>
                    {!row.isSent && <Badge variant="warning">{adminNotificationSentLabel(false, locale)}</Badge>}
                    {row.isRead && <Badge variant="outline">{adminNotificationReadLabel(true, locale)}</Badge>}
                  </TableCell>
                  <TableCell>
                    {!row.isSent && (
                      <form action={retryNotificationAction}>
                        <AdminFormCsrf />
                        <input type="hidden" name="lang" value={locale} />
                        <input type="hidden" name="notification_id" value={row.id} />
                        <Button type="submit" size="sm" variant="outline">{t.retry}</Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
