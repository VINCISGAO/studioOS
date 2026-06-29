import { Card, CardContent } from "@/components/ui/card";
import { creators, deposits } from "@/lib/data";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default async function AdminStudiosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Studios</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh" ? "制作合作伙伴 — 不是 Freelancer 列表。" : "Production partners — not a freelancer list."}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {creators.map((studio) => {
          const deposit = deposits.find((d) => d.creator_id === studio.id);
          return (
            <Card key={studio.id} className="border-zinc-200/80 shadow-none">
              <CardContent className="p-5">
                <p className="font-medium">{studio.name}</p>
                <p className="mt-1 text-sm text-zinc-500">{studio.country} · {studio.specialties.join(", ")}</p>
                <p className="mt-3 text-xs text-zinc-500">
                  {locale === "zh" ? "保证金" : "Deposit"}: {formatCurrency(deposit?.amount ?? 0)} ({deposit?.status ?? "—"})
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
