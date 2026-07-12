import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminWalletService } from "@/features/admin/wallet/admin-wallet.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { adminFields } from "@/lib/studioos/admin-copy";
import { adminUserRoleLabel } from "@/lib/studioos/admin-enum-labels";
import { formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    title: "Wallet admin",
    subtitle: "Search users and inspect legacy wallets and asset balances.",
    search: "Search user",
    submit: "Search"
  },
  zh: {
    title: "钱包管理",
    subtitle: "搜索用户并查看旧版钱包与资产余额。",
    search: "搜索用户",
    submit: "搜索"
  }
} as const;

export default async function AdminWalletsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const f = adminFields(locale);
  const user = await getAdminSessionUser();
  const search = typeof params.search === "string" ? params.search : undefined;
  const result = user ? await adminWalletService.list(user, search) : { items: [], total: 0 };

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <form method="get" className="mb-6 flex gap-2">
        <input type="hidden" name="lang" value={locale} />
        <Input name="search" defaultValue={search} placeholder={t.search} />
        <Button type="submit">{t.submit}</Button>
      </form>
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{f.user}</TableHead>
                <TableHead>{f.type}</TableHead>
                <TableHead>{f.legacyWallet}</TableHead>
                <TableHead>{f.assets}</TableHead>
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
                  <TableCell><Badge variant="outline">{adminUserRoleLabel(row.role, locale)}</Badge></TableCell>
                  <TableCell>{formatCurrency(row.legacyAvailable, locale)}</TableCell>
                  <TableCell className="text-xs">
                    {row.assets.map((a) => `${a.assetCode}: ${a.available}`).join(" · ") || "—"}
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
