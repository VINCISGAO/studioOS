import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminCreditService } from "@/features/admin/credits/admin-credit.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { adminUserRoleLabel } from "@/lib/studioos/admin-enum-labels";

const copy = {
  en: {
    title: "Credit wallets",
    subtitle: "Search users and inspect VINCIS Credits balances.",
    search: "Search user",
    submit: "Search"
  },
  zh: {
    title: "Credits 用户钱包",
    subtitle: "搜索用户并查看 VINCIS Credits 余额与累计数据。",
    search: "搜索用户",
    submit: "搜索"
  }
} as const;

export default async function AdminCreditWalletsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const search = typeof params.search === "string" ? params.search : undefined;
  const result = user ? await adminCreditService.listWallets(user, search) : { items: [], total: 0 };

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
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead>Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell>
                    <Link
                      href={withLocale(adminPortalRoutes.creditsWalletDetail(row.userId), locale)}
                      className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                    >
                      {row.name ?? row.email}
                    </Link>
                    <div className="text-xs text-zinc-500">{row.email}</div>
                  </TableCell>
                  <TableCell>{adminUserRoleLabel(row.role, locale)}</TableCell>
                  <TableCell className="tabular-nums">{row.availableCredits}</TableCell>
                  <TableCell className="tabular-nums">{row.reservedCredits}</TableCell>
                  <TableCell className="tabular-nums">{row.lifetimePurchased}</TableCell>
                  <TableCell className="tabular-nums">{row.lifetimeSpent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="mt-4 text-xs text-zinc-500">
        <Link href={withLocale(adminPortalRoutes.credits, locale)} className="underline">
          Back to credits overview
        </Link>
      </p>
    </AdminPageShell>
  );
}
