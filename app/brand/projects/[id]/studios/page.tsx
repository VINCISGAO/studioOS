import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Star } from "lucide-react";
import { connectCreatorFromMatchAction } from "@/app/project-actions";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentClientEmail } from "@/lib/client-session";
import { listCreatorsForMatching } from "@/lib/creator-service";
import { getWorksForCreator } from "@/lib/works-catalog";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getStudioPerformanceLiftForOrg, matchCreatorsForProject } from "@/lib/matching-engine";
import { resolveWorkThumbnail } from "@/lib/media-url";
import { getProject } from "@/lib/project-service";
import { orgIdFromEmail } from "@/lib/studioos/creative-performance-store";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function BrandStudiosPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const clientEmail = await getCurrentClientEmail();
  const project = await getProject(id);

  if (!project) notFound();
  if (clientEmail && project.client_email !== clientEmail.toLowerCase()) {
    redirect(withLocale("/brand", locale));
  }
  if (project.status === "draft") {
    redirect(withLocale(`/brand/projects/new?project=${id}&step=3`, locale));
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

  const title = locale === "zh" ? "推荐 Studio" : "Recommended Studios";

  return (
    <div className="space-y-8">
      <div>
        <Link href={withLocale("/brand", locale)} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {locale === "zh" ? "返回首页" : "Back home"}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {locale === "zh"
            ? "选择 Studio，查看主页并完成付款。"
            : "Choose a studio, view their profile, and complete payment."}
        </p>
      </div>

      <div className="grid gap-5">
        {matches.length ? (
          matches.map((match) => {
            const creator = enrichedCreators.find((item) => item.id === match.creator_id);
            if (!creator) return null;

            const works = match.matched_work_ids
              .map((workId) => allWorks.find((item) => item.id === workId))
              .filter(Boolean);

            return (
              <Card key={match.creator_id} className="border-zinc-200/80 shadow-none">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-amber-500">⭐</span>
                        <h2 className="text-xl font-semibold">{creator.name}</h2>
                        <Badge variant="secondary" className="gap-1">
                          {match.score}% {locale === "zh" ? "匹配" : "Match"}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {creator.rating}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-zinc-600">{creator.headline}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {match.reasons.slice(0, 3).map((reason) => (
                          <Badge key={reason.en} variant="secondary">
                            {locale === "zh" ? reason.zh : reason.en}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {works.length ? (
                    <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
                      {works.map((work) =>
                        work ? (
                          <div
                            key={work.id}
                            className="relative aspect-[9/16] overflow-hidden rounded-lg bg-zinc-900"
                          >
                            <WorkCoverImage
                              src={resolveWorkThumbnail(work.video_url, work.thumbnail_url)}
                              alt={work.title}
                            />
                          </div>
                        ) : null
                      )}
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-wrap gap-2">
                    <form action={connectCreatorFromMatchAction}>
                      <input type="hidden" name="lang" value={locale} />
                      <input type="hidden" name="project_id" value={project.id} />
                      <input type="hidden" name="creator_id" value={creator.id} />
                      <input type="hidden" name="work_id" value={works[0]?.id ?? ""} />
                      <Button type="submit">
                        {locale === "zh" ? "选择并去付款" : "Select & checkout"}
                      </Button>
                    </form>
                    <Button asChild variant="outline">
                      <Link href={withLocale(`/creators/${creator.id}`, locale)}>
                        {locale === "zh" ? "查看主页" : "View Profile"} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="shadow-none">
            <CardContent className="p-10 text-center text-sm text-zinc-500">
              {locale === "zh" ? "暂无匹配的 Studio" : "No studios matched yet."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
