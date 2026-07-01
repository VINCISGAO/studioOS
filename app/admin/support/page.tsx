import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { adminSupportService } from "@/features/admin/support/admin-support.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const user = await getSessionUser();
  const overview = user ? await adminSupportService.getOverview(user) : { openItems: 0 };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Support</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh" ? "争议、退款与 Brand / Studio 支持工单。" : "Disputes, refunds, and brand/studio support."}
      </p>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <p className="text-sm text-zinc-500">{locale === "zh" ? "待处理事项" : "Open items"}</p>
          <p className="mt-2 text-4xl font-semibold">{overview.openItems}</p>
          <div className="mt-6 flex gap-3">
            <Link
              href={withLocale("/admin/disputes", locale)}
              className="text-sm font-medium text-zinc-900 hover:underline"
            >
              {locale === "zh" ? "争议与退款" : "Disputes & refunds"} →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
