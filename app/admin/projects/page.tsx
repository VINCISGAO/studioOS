import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { projects } from "@/lib/data";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh" ? "全平台 Campaign 与 Brief。" : "All platform campaigns and briefs."}
      </p>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          <ul className="divide-y">
            {projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="font-medium">{project.company_name}</p>
                  <p className="text-sm text-zinc-500">{project.campaign_goal}</p>
                  <p className="text-xs text-zinc-400">{formatDate(project.created_at)}</p>
                </div>
                <StatusBadge status={project.status} locale={locale} />
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
