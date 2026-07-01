import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { adminCampaignService } from "@/features/admin/campaign/admin-campaign.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const user = await getSessionUser();
  const result = user ? await adminCampaignService.list(user, {}) : { items: [], total: 0 };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh" ? "全平台 Campaign 与 Brief。" : "All platform campaigns and briefs."}
      </p>
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
          ← {locale === "zh" ? "返回总览" : "Back to overview"}
        </Link>
      </p>
    </div>
  );
}
