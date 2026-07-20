import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Star } from "lucide-react";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { CertifiedPartnerBadge } from "@/components/studioos/certification/certified-partner-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { brandPortalRequireOwnedResource, brandPortalRequireSession } from "@/lib/studioos/brand-portal-page-guards";
import { listCreatorsForMatching } from "@/lib/creator-service";
import { getWorksForCreator } from "@/lib/works-catalog";
import { clampBrandVisibleStep, migrateLegacyBrandWizardStep } from "@/lib/campaign/wizard-steps";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { getStudioPerformanceLiftForOrg, matchCreatorsForProject } from "@/lib/matching-engine";
import { resolveWorkThumbnail } from "@/lib/media-url";
import { getProject } from "@/lib/project-service";
import { getOrderForProject } from "@/lib/order-service";
import { isBrandAwaitingPayment } from "@/lib/studioos/commercial-lifecycle";
import { isBrandProjectFunded } from "@/lib/studioos/brand-payment-funding";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { orgIdFromEmail } from "@/lib/studioos/creative-performance-store";
import { tCertificationExperience } from "@/lib/studioos/certification-experience-copy";
import { isCreatorVerified } from "@/lib/studioos/deposit-guard";
import { resolveBrandProjectRouteId } from "@/lib/api-client/server-portal-gateway";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function BrandStudiosPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = await getAppUiLocale();
  const clientEmail = await getCurrentClientEmail();
  brandPortalRequireSession(clientEmail, locale, `/brand/projects/${id}/studios`);
  const resolved = await resolveBrandProjectRouteId(id);
  if (resolved.kind === "redirect_project") {
    redirect(withLocale(brandPortalRoutes.projectStudios(resolved.projectId), locale));
  }
  if (resolved.kind === "redirect_review") {
    redirect(withLocale(brandPortalRoutes.orderReview(resolved.orderId), locale));
  }
  if (resolved.kind === "not_found") {
    notFound();
  }
  const project = await getProject(id);

  brandPortalRequireOwnedResource(project, clientEmail);
  if (project.status === "draft") {
    const resumeStep = clampBrandVisibleStep(migrateLegacyBrandWizardStep(project.wizard_step || 1));
    redirect(withLocale(`/brand/projects/new?project=${id}&step=${resumeStep}`, locale));
  }

  const order = await getOrderForProject(id);
  const status = normalizeCampaignStatus(project.status);
  const funded = await isBrandProjectFunded(id, order);
  if (!funded && isBrandAwaitingPayment({ project, order })) {
    redirect(withLocale(brandPortalRoutes.projectCheckout(id), locale));
  }

  if (status === "matching") {
    redirect(withLocale(`/brand/projects/${id}?tab=match`, locale));
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

  const title = locale === "zh" ? "推荐创作者" : "Recommended Studios";
  const partnerBadge = tCertificationExperience(locale).partnerBadge;

  return (
    <div className="space-y-8">
      <div>
        <Link href={withLocale("/brand", locale)} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {locale === "zh" ? "返回首页" : "Back home"}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {locale === "zh"
            ? "意向发单流程请前往项目匹配页查看 Creator 回复并选定合作方。"
            : "Use the project match tab to track invitation responses and select a creator."}
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
                        {isCreatorVerified(creator) ? (
                          <CertifiedPartnerBadge label={partnerBadge} compact />
                        ) : null}
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
                    <Button asChild variant="outline">
                      <Link href={withLocale(`/creators/${creator.id}`, locale)}>
                        {locale === "zh" ? "查看主页" : "View Profile"} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <p className="text-xs text-zinc-500">
                      {locale === "zh"
                        ? "付款成功后，系统会进入正式匹配邀约；品牌只能从已接受邀约的创作者中最终选定。"
                        : "After escrow payment, matching invitations start; final selection is made from creators who accept."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="shadow-none">
            <CardContent className="p-10 text-center text-sm text-zinc-500">
              {locale === "zh" ? "暂无匹配的创作者" : "No studios matched yet."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
