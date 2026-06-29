import Link from "next/link";
import { redirect } from "next/navigation";
import { Clapperboard, Plus } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { wsCopy } from "@/lib/mvp/workspace-copy";
import { getMvpProfile } from "@/lib/mvp/session";
import { listAllProjects, listBrandProjects } from "@/lib/mvp/store";

export default async function BrandWorkspacePage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const t = wsCopy("brand", locale);
  const profile = await getMvpProfile();
  if (!profile) redirect(withLocale("/login?role=brand", locale));
  if (profile.role !== "brand" && profile.role !== "admin") {
    redirect(withLocale("/workspace/studio", locale));
  }

  const projects =
    profile.role === "admin" ? await listAllProjects() : await listBrandProjects(profile.id);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t.eyebrow}</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">{t.subtitle}</p>
        </div>
        <Button asChild className="rounded-md bg-zinc-900">
          <Link href={withLocale("/workspace/projects/new", locale)}>
            <Plus className="h-4 w-4" /> {t.newProject}
          </Link>
        </Button>
      </div>

      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          {projects.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === "zh" ? "项目" : "Project"}</TableHead>
                  <TableHead>{locale === "zh" ? "品牌" : "Brand"}</TableHead>
                  <TableHead>{locale === "zh" ? "状态" : "Status"}</TableHead>
                  <TableHead>{locale === "zh" ? "进度" : "Progress"}</TableHead>
                  <TableHead className="w-[1%] text-right">{locale === "zh" ? "操作" : "Action"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{project.brand_name}</TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} locale={locale} />
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {t.meta(project.latest_version ?? "—", project.open_issues)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button asChild size="sm" variant="outline" className="whitespace-nowrap">
                        <Link href={withLocale(`/workspace/projects/${project.id}/review`, locale)}>
                          <Clapperboard className="h-4 w-4" />
                          {t.review}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-10 text-center text-sm text-zinc-500">{t.empty}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
