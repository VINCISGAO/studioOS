import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BrandProjectOverview } from "@/components/studioos/brand-project-overview";
import { Button } from "@/components/ui/button";
import {
  loadBrandProjectPortalDetail,
  resolveBrandProjectRouteId
} from "@/lib/api-client/server-portal-gateway";
import {
  brandPortalDenyInvalidState,
  brandPortalRequireSession
} from "@/lib/studioos/brand-portal-page-guards";
import { getAppUiLocale } from "@/lib/app-language";
import { isAppError } from "@/lib/core/errors";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { requireBrandPortalClientEmail } from "@/features/auth/session-context";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

export default async function BrandProjectHubPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams & { matching?: string; tab?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = await getAppUiLocale();
  const clientEmail = await requireBrandPortalClientEmail().catch(() => null);
  brandPortalRequireSession(clientEmail, locale, `/brand/projects/${id}`);

  const resolved = await resolveBrandProjectRouteId(id);
  if (resolved.kind === "redirect_project") {
    redirect(withLocale(brandPortalRoutes.project(resolved.projectId), locale));
  }
  if (resolved.kind === "redirect_review") {
    redirect(withLocale(brandPortalRoutes.projectReview(resolved.orderId), locale));
  }
  if (resolved.kind === "not_found") {
    notFound();
  }

  if (query.tab === "review") {
    redirect(withLocale(`/brand/projects/${id}/review`, locale));
  }

  let detail;
  try {
    detail = await loadBrandProjectPortalDetail({
      projectId: id,
      locale,
      clientEmail,
      tab: query.tab
    });
  } catch (error) {
    if (isAppError(error) && error.status === 404) {
      notFound();
    }
    if (isAppError(error) && error.status === 403) {
      notFound();
    }
    brandPortalDenyInvalidState(locale, "project-unavailable");
  }

  if (detail.flags.shouldRedirectToCheckout) {
    redirect(withLocale(brandPortalRoutes.projectCheckout(id), locale));
  }

  if (detail.flags.isDraft) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-950">{detail.project.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {locale === "zh" ? "需求草稿尚未完成，请继续填写。" : "This draft is not finished yet."}
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link href={withLocale(`/brand/projects/new?project=${id}`, locale)}>
            {locale === "zh" ? "继续填写需求" : "Continue brief"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <BrandProjectOverview
      locale={detail.locale}
      project={detail.project}
      activeTab={detail.activeTab}
      linkedOrder={detail.linkedOrder}
      deliverables={detail.deliverables}
      reviewComments={detail.reviewComments}
      projectInvitations={detail.projectInvitations}
      selectedCreatorId={detail.selectedCreatorId}
      brandCommercialStep={detail.brandCommercialStep}
      commercialContext={detail.commercialContext}
      notificationCount={detail.notificationCount}
      aiMatchStatistics={detail.aiMatchStatistics}
    />
  );
}
