import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageActionLink, AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminCampaignService } from "@/features/admin/campaign/admin-campaign.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
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
    <AdminPageShell
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      actions={
        <AdminPageActionLink href={withLocale(adminPortalRoutes.dashboard, locale)}>← {t.back}</AdminPageActionLink>
      }
    >
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <ul className="divide-y divide-zinc-100">
            {result.items.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <Link
                    href={withLocale(adminPortalRoutes.campaignDetail(project.id), locale)}
                    className="font-medium hover:underline"
                  >
                    {project.brandName ?? project.title}
                  </Link>
                  <p className="text-sm text-zinc-500">{project.title}</p>
                  <p className="text-xs text-zinc-400">{formatDate(project.updatedAt, locale)}</p>
                </div>
                <StatusBadge status={project.status} locale={locale} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
