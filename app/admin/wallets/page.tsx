import Link from "next/link";
import { adminWalletService } from "@/features/admin/wallet/admin-wallet.service";
import { getSessionUser } from "@/features/auth/session.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { formatCurrency } from "@/lib/utils";

export default async function AdminWalletsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = getLocale(params);
  const user = await getSessionUser();
  const search = typeof params.search === "string" ? params.search : undefined;
  const result = user ? await adminWalletService.list(user, search) : { items: [], total: 0 };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{locale === "zh" ? "钱包管理" : "Wallet admin"}</h1>
      <form method="get" className="mt-6 flex gap-2">
        <input type="hidden" name="lang" value={locale} />
        <Input name="search" defaultValue={search} placeholder={locale === "zh" ? "搜索用户" : "Search user"} />
        <Button type="submit">{locale === "zh" ? "搜索" : "Search"}</Button>
      </form>
      <Card className="mt-6 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Legacy wallet</TableHead>
                <TableHead>Assets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell>
                    <Link href={withLocale(adminPortalRoutes.walletDetail(row.userId), locale)} className="font-medium hover:underline">
                      {row.name ?? row.email ?? row.userId}
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant="outline">{row.role}</Badge></TableCell>
                  <TableCell>{formatCurrency(row.legacyAvailable)}</TableCell>
                  <TableCell className="text-xs">
                    {row.assets.map((a) => `${a.assetCode}: ${a.available}`).join(" · ") || "—"}
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
