import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { adminLedgerService } from "@/features/admin/ledger/admin-ledger.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminCountLabel, adminFields } from "@/lib/studioos/admin-copy";
import { adminLedgerDirectionLabel, adminLedgerEntryTypeLabel } from "@/lib/studioos/admin-enum-labels";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    title: "Ledger explorer",
    subtitle: "Browse ledger entries across users and campaigns.",
    export: "Export CSV",
    filter: "Filter",
    placeholders: {
      userId: "User ID",
      campaignId: "Campaign ID",
      entryType: "Entry type",
      search: "Search"
    }
  },
  zh: {
    title: "账本浏览器",
    subtitle: "按用户与活动浏览账本记录。",
    export: "导出 CSV",
    filter: "筛选",
    placeholders: {
      userId: "用户编号",
      campaignId: "活动编号",
      entryType: "记录类型",
      search: "搜索"
    }
  }
} as const;

export default async function AdminLedgerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const f = adminFields(locale);
  const user = await getAdminSessionUser();

  const filters = {
    userId: typeof params.userId === "string" ? params.userId : undefined,
    campaignId: typeof params.campaignId === "string" ? params.campaignId : undefined,
    entryType: typeof params.entryType === "string" ? params.entryType : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined
  };

  const result = user ? await adminLedgerService.list(user, filters) : { items: [], total: 0 };
  const exportQs = new URLSearchParams({ ...filters, lang: locale } as Record<string, string>);

  return (
    <AdminPageShell
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      actions={
        <Button asChild variant="outline">
          <Link href={withLocale(`/api/admin/ledger/export?${exportQs.toString()}`, locale)}>{t.export}</Link>
        </Button>
      }
    >
      <p className="mb-6 text-sm text-zinc-500">{adminCountLabel(locale, result.total, "entries", "条记录")}</p>

      <form method="get" className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <input type="hidden" name="lang" value={locale} />
        <Input name="userId" defaultValue={filters.userId} placeholder={t.placeholders.userId} />
        <Input name="campaignId" defaultValue={filters.campaignId} placeholder={t.placeholders.campaignId} />
        <Input name="entryType" defaultValue={filters.entryType} placeholder={t.placeholders.entryType} />
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
                <TableHead>{f.user}</TableHead>
                <TableHead>{f.campaign}</TableHead>
                <TableHead>{f.type}</TableHead>
                <TableHead>{f.amount}</TableHead>
                <TableHead>{f.description}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.createdAt, locale)}</TableCell>
                  <TableCell className="text-xs">{row.userEmail ?? row.userId}</TableCell>
                  <TableCell className="max-w-xs truncate">{row.campaignTitle ?? row.campaignId ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{adminLedgerEntryTypeLabel(row.entryType, locale)}</Badge></TableCell>
                  <TableCell>
                    {adminLedgerDirectionLabel(row.direction, locale)} {row.amount} {row.assetCode}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{row.description ?? row.referenceId ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
