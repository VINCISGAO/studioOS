import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CalendarClock, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { creatorWorks } from "@/lib/data";
import { matchProjectsForCreator } from "@/lib/matching-engine";
import { listApplicationsForProject, listOpenProjects } from "@/lib/project-service";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    eyebrow: "Project desk",
    title: "Brand briefs with AI match scores for creators.",
    subtitle:
      "Brands submit briefs and get creator matches. Creators browse open briefs here and see how well each project fits their portfolio.",
    apply: "View & apply",
    details: "Creator desk",
    budget: "Budget",
    deadline: "Deadline",
    applications: "Applications",
    format: "Format",
    match: "AI match",
    loginHint: "Sign in as a creator to see personalized match scores.",
    trust: ["Bidirectional AI matching", "Escrow-backed orders", "Creator deposit required"]
  },
  zh: {
    eyebrow: "项目大厅",
    title: "品牌简报 + 创作者 AI 匹配分",
    subtitle:
      "品牌提交简报后会获得创作者推荐；创作者在这里浏览开放项目，并查看与自己作品集的匹配度。",
    apply: "查看并申请",
    details: "进入工作台",
    budget: "预算",
    deadline: "截止",
    applications: "申请数",
    format: "格式",
    match: "AI 匹配",
    loginHint: "以创作者身份登录后，可看到个性化匹配分数。",
    trust: ["双向 AI 匹配", "订单资金平台托管", "承接人需缴纳保证金"]
  }
};

type ProjectsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const creator = await getCurrentCreator();
  const openProjects = await listOpenProjects();
  const applicationCounts = Object.fromEntries(
    await Promise.all(
      openProjects.map(async (project) => [project.id, (await listApplicationsForProject(project.id)).length] as const)
    )
  );
  const creatorWorksForMatch = creator
    ? creatorWorks.filter((work) => work.creator_id === creator.id)
    : [];
  const projectMatches = creator
    ? matchProjectsForCreator(creator, creatorWorksForMatch, openProjects)
    : [];

  return (
    <PageShell locale={locale}>
      <main className="bg-[#f6f6f3]">
        <section className="border-b">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_0.28fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
                  <ClipboardList className="h-4 w-4 text-foreground" />
                  {t.eyebrow}
                </div>
                <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-tight sm:text-6xl">
                  {t.title}
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{t.subtitle}</p>
                {!creator ? (
                  <p className="mt-4 text-sm text-muted-foreground">{t.loginHint}</p>
                ) : null}
              </div>
              <Card className="bg-white shadow-luxe">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="mt-5 grid gap-3">
                    {t.trust.map((item) => (
                      <div key={item} className="border-t pt-3 text-sm font-medium text-muted-foreground">
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {openProjects.map((project) => {
              const applicationCount = applicationCounts[project.id] ?? 0;
              const match = projectMatches.find((item) => item.project_id === project.id);

              return (
                <Card key={project.id} className="bg-white shadow-none">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{project.category}</p>
                        <h2 className="mt-2 text-2xl font-semibold">{project.company_name}</h2>
                      </div>
                      <StatusBadge status={project.status} locale={locale} />
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {project.campaign_goal}
                    </p>
                    <div className="mt-6 grid gap-3 text-sm">
                      <Meta icon={BadgeDollarSign} label={t.budget} value={project.budget_range} />
                      <Meta icon={CalendarClock} label={t.deadline} value={formatDate(project.deadline)} />
                      <Meta
                        icon={ClipboardList}
                        label={t.format}
                        value={`${project.video_count} / ${project.video_format}`}
                      />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {project.target_platform.split(",").map((platform) => (
                        <Badge key={platform.trim()} variant="secondary">
                          {platform.trim()}
                        </Badge>
                      ))}
                      <Badge variant="outline">
                        {t.applications}: {applicationCount}
                      </Badge>
                      {match ? (
                        <Badge className="gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          {t.match}: {match.score}%
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-auto pt-6">
                      <Button asChild className="w-full">
                        <Link href={withLocale(`/projects/${project.id}`, locale)}>
                          {t.apply} <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline">
              <Link href={withLocale("/creator", locale)}>
                {t.details} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof BadgeDollarSign; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-muted/30 px-3 py-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
