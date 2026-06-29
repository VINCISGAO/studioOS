import Link from "next/link";
import { redirect } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { wsCopy } from "@/lib/mvp/workspace-copy";
import { getMvpProfile } from "@/lib/mvp/session";
import { listStudioProjects } from "@/lib/mvp/store";

export default async function StudioWorkspacePage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const t = wsCopy("studio", locale);
  const profile = await getMvpProfile();
  if (!profile) redirect(withLocale("/login?role=creator", locale));
  if (profile.role !== "studio" && profile.role !== "admin") {
    redirect(withLocale("/workspace/brand", locale));
  }

  const projects = await listStudioProjects(profile.id);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t.eyebrow}</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-500">{t.subtitle}</p>

      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-0">
          {projects.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === "zh" ? "项目" : "Project"}</TableHead>
                  <TableHead>{t.brand}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.issues}</TableHead>
                  <TableHead className="w-[1%] text-right">{t.action}</TableHead>
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
                      {t.issuesCount(project.open_issues, project.latest_version ?? 0)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button asChild size="sm" className="whitespace-nowrap">
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
