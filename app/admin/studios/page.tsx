import { getAppUiLocale } from "@/lib/app-language";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminStudioService } from "@/features/admin/studio/admin-studio.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";
import { adminFields } from "@/lib/studioos/admin-copy";
import { adminDepositStatusLabel } from "@/lib/studioos/admin-enum-labels";
import { formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    title: "Studios",
    subtitle: "Production partners — not a freelancer list."
  },
  zh: {
    title: "创作者",
    subtitle: "制作合作伙伴，不是自由职业者列表。"
  }
} as const;

export default async function AdminStudiosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const f = adminFields(locale);
  const user = await getAdminSessionUser();
  const studios = user ? await adminStudioService.list(user) : [];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <div className="grid gap-4 sm:grid-cols-2">
        {studios.map((studio) => (
          <Card key={studio.id} className="border-zinc-200/80 shadow-none transition hover:border-violet-200/80">
            <CardContent className="p-5">
              <p className="font-medium">{studio.displayName}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {studio.country ?? "—"} · {studio.specialties.join(", ") || "—"}
              </p>
              <p className="mt-3 text-xs text-zinc-500">
                {f.deposit}: {formatCurrency(studio.depositAmount, locale)} ({adminDepositStatusLabel(studio.depositStatus, locale)})
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
