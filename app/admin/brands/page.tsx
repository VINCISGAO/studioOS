import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminBrandService } from "@/features/admin/brand/admin-brand.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

export default async function AdminBrandsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const user = await getAdminSessionUser();
  const brands = user ? await adminBrandService.list(user) : [];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Brands</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh" ? "所有 Brand 账户与 Campaign 活动。" : "All brand accounts and campaigns."}
      </p>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === "zh" ? "品牌" : "Brand"}</TableHead>
                <TableHead>{locale === "zh" ? "行业" : "Industry"}</TableHead>
                <TableHead>{locale === "zh" ? "Campaign" : "Campaigns"}</TableHead>
                <TableHead>{locale === "zh" ? "状态" : "Status"}</TableHead>
                <TableHead>{locale === "zh" ? "创建时间" : "Created"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.length ? (
                brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="font-medium">{brand.companyName}</div>
                      <div className="text-xs text-zinc-500">{brand.email}</div>
                    </TableCell>
                    <TableCell>{brand.industry ?? "—"}</TableCell>
                    <TableCell>{brand.campaignCount}</TableCell>
                    <TableCell>{brand.status}</TableCell>
                    <TableCell>{formatDate(brand.createdAt)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-zinc-500">
                    {locale === "zh" ? "暂无真实 Brand 账户。" : "No brand accounts yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
