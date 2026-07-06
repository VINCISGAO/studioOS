import Link from "next/link";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listCreatorsForMatching } from "@/lib/creator-service";
import { getWorksForCreator } from "@/lib/works-catalog";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getStudioPerformanceLiftForOrg, matchCreatorsForProject } from "@/lib/matching-engine";
import { resolveWorkThumbnail } from "@/lib/media-url";
import { getProject } from "@/lib/project-service";
import { orgIdFromEmail } from "@/lib/studioos/creative-performance-store";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    eyebrow: "Stage 2 · Studio Matching",
    title: "Studios matched to your brief",
    subtitle:
      "Scored by category, style, budget fit, delivery speed, rating, and deposit status — not random.",
    score: "Match",
    reasons: "Why matched",
    portfolio: "Relevant work",
    connect: "Open project match",
    viewProfile: "View studio",
    empty: "No studios matched yet.",
    brief: "Creative Brief V1",
    budget: "Budget",
    platform: "Platform",
    format: "Format",
    deadline: "Deadline",
    back: "New brief",
    projects: "All projects"
  },
  zh: {
    eyebrow: "Stage 2 · Studio 匹配",
    title: "为你的 Brief 匹配 Studio",
    subtitle: "按行业、风格、预算、交付速度、评分计算匹配度 — 不是随机推荐。",
    score: "匹配度",
    reasons: "匹配原因",
    portfolio: "相关作品",
    connect: "进入正式匹配页",
    viewProfile: "查看 Studio",
    empty: "暂时没有匹配的 Studio。",
    brief: "Creative Brief V1",
    budget: "预算",
    platform: "平台",
    format: "画幅",
    deadline: "截止",
    back: "新建 Brief",
    projects: "全部项目"
  }
};

type MatchPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function MatchPage({ params, searchParams }: MatchPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const t = copy[locale];
  const project = await getProject(id);

  if (!project) {
    return (
      <PageShell locale={locale}>
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-semibold">{locale === "zh" ? "未找到简报" : "Brief not found"}</h1>
          <Button asChild className="mt-6">
            <Link href={withLocale("/brand/brief/new", locale)}>{t.back}</Link>
          </Button>
        </main>
      </PageShell>
    );
  }

  const studioPerformanceLift = project.client_email
    ? await getStudioPerformanceLiftForOrg(orgIdFromEmail(project.client_email))
    : new Map<string, number>();
  const enrichedCreators = await listCreatorsForMatching();
  const allWorks = (
    await Promise.all(enrichedCreators.map((creator) => getWorksForCreator(creator.id)))
  ).flat();
  const matches = matchCreatorsForProject(project, enrichedCreators, allWorks, {
    studioPerformanceLift
  }).slice(0, 6);

  return (
    <PageShell locale={locale}>
      <main className="bg-[#f6f6f3]">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
              <Sparkles className="h-4 w-4" />
              {t.eyebrow}
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{t.title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t.subtitle}</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.32fr_0.68fr] lg:px-8">
          <Card className="h-fit shadow-none">
            <CardContent className="p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.brief}</p>
              <h2 className="mt-3 text-2xl font-semibold">{project.company_name}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{project.campaign_goal}</p>
              <div className="mt-6 grid gap-3 text-sm">
                <BriefMeta label={t.budget} value={project.budget_range} />
                <BriefMeta label={t.platform} value={project.target_platform} />
                <BriefMeta label={t.format} value={`${project.video_count} × ${project.video_format}`} />
                <BriefMeta label={t.deadline} value={formatDate(project.deadline)} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="secondary">{project.category}</Badge>
                {project.brand_style ? <Badge variant="outline">{project.brand_style}</Badge> : null}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            {matches.length ? (
              matches.map((match) => {
                const creator = enrichedCreators.find((item) => item.id === match.creator_id);
                if (!creator) {
                  return null;
                }

                const works = match.matched_work_ids
                  .map((workId) => allWorks.find((item) => item.id === workId))
                  .filter(Boolean);

                return (
                  <Card key={match.creator_id} className="overflow-hidden bg-white shadow-none">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-2xl font-semibold">{creator.name}</h3>
                            <Badge className="gap-1">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              {creator.rating}
                            </Badge>
                          </div>
                          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{creator.headline}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-center">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.score}</div>
                          <div className="text-3xl font-semibold">{match.score}%</div>
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="text-sm font-medium">{t.reasons}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {match.reasons.slice(0, 4).map((reason) => (
                            <Badge key={reason.en} variant="secondary">
                              {locale === "zh" ? reason.zh : reason.en}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {works.length ? (
                        <div className="mt-5">
                          <p className="mb-2 text-sm font-medium">{t.portfolio}</p>
                          <div className="grid grid-cols-3 gap-2">
                            {works.map((work) =>
                              work ? (
                                <div
                                  key={work.id}
                                  className="relative aspect-[9/16] overflow-hidden rounded-md bg-zinc-900"
                                >
                                  <WorkCoverImage
                                    src={resolveWorkThumbnail(work.video_url, work.thumbnail_url)}
                                    alt={work.title}
                                  />
                                </div>
                              ) : null
                            )}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-6 flex flex-wrap gap-2">
                        <Button asChild>
                          <Link href={withLocale(`/brand/projects/${project.id}?tab=match`, locale)}>
                            {t.connect}
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href={withLocale(`/creators/${creator.id}`, locale)}>
                            {t.viewProfile} <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="shadow-none">
                <CardContent className="p-10 text-center text-muted-foreground">{t.empty}</CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="border-t bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 py-8 sm:px-6 lg:px-8">
            <Button asChild variant="outline">
              <Link href={withLocale("/brand/brief/new", locale)}>{t.back}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={withLocale("/projects", locale)}>{t.projects}</Link>
            </Button>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function BriefMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
