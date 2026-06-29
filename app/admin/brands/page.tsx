import { Card, CardContent } from "@/components/ui/card";
import { DEMO_USERS } from "@/lib/demo-auth";
import { getLocale, type SearchParams } from "@/lib/i18n";

export default async function AdminBrandsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const brands = DEMO_USERS.filter((u) => u.role === "client");

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Brands</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh" ? "所有 Brand 账户与 Campaign 活动。" : "All brand accounts and campaigns."}
      </p>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <ul className="divide-y">
            {brands.map((brand) => (
              <li key={brand.email} className="px-6 py-4">
                <p className="font-medium">{brand.label}</p>
                <p className="text-sm text-zinc-500">{brand.email}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
