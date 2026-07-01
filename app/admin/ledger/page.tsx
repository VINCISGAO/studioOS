import Link from "next/link";
import { adminLedgerService } from "@/features/admin/ledger/admin-ledger.service";
import { getSessionUser } from "@/features/auth/session.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

export default async function AdminLedgerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = getLocale(params);
  const user = await getSessionUser();

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
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{locale === "zh" ? "账本浏览器" : "Ledger explorer"}</h1>
          <p className="mt-2 text-sm text-zinc-500">{result.total} entries</p>
        </div>
        <Button asChild variant="outline">
          <Link href={withLocale(`/api/admin/ledger/export?${exportQs.toString()}`, locale)}>
            {locale === "zh" ? "导出 CSV" : "Export CSV"}
          </Link>
        </Button>
      </div>

      <form method="get" className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <input type="hidden" name="lang" value={locale} />
        <Input name="userId" defaultValue={filters.userId} placeholder="userId" />
        <Input name="campaignId" defaultValue={filters.campaignId} placeholder="campaignId" />
        <Input name="entryType" defaultValue={filters.entryType} placeholder="entryType" />
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
                <TableHead>User</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.createdAt)}</TableCell>
                  <TableCell className="text-xs">{row.userEmail ?? row.userId}</TableCell>
                  <TableCell className="max-w-xs truncate">{row.campaignTitle ?? row.campaignId ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{row.entryType}</Badge></TableCell>
                  <TableCell>{row.direction} {row.amount} {row.assetCode}</TableCell>
                  <TableCell className="max-w-xs truncate">{row.description ?? row.referenceId ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
