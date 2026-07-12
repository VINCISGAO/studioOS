import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { adminCampaignService } from "@/features/admin/campaign/admin-campaign.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    title: "Projects",
    subtitle: "All platform campaigns and briefs.",
    back: "Back to overview"
  },
  zh: {
    title: "项目",
    subtitle: "全平台活动与简报。",
    back: "返回总览"
  }
} as const;

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const result = user ? await adminCampaignService.list(user, {}) : { items: [], total: 0 };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <ul className="divide-y">
            {result.items.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="font-medium">{project.brandName ?? project.title}</p>
                  <p className="text-sm text-zinc-500">{project.title}</p>
                  <p className="text-xs text-zinc-400">{formatDate(project.updatedAt)}</p>
                </div>
                <StatusBadge status={project.status.toLowerCase()} locale={locale} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-zinc-500">
        <Link href={withLocale("/admin", locale)} className="hover:underline">
          ← {t.back}
        </Link>
      </p>
    </div>
  );
}
