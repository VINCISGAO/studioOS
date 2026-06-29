import { notFound, redirect } from "next/navigation";
import { ReviewWorkspace } from "@/components/mvp/review-workspace";
import { getSessionUser } from "@/features/auth/session.service";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getUnifiedReviewBundleForCampaign, brandCanAccessMvpReview } from "@/lib/mvp/campaign-review-bridge";
import { getMvpProfile } from "@/lib/mvp/session";
import { getDeliverables, getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<
    SearchParams & { approved?: string; revision?: string; settled?: string; completed?: string }
  >;
};

export const dynamic = "force-dynamic";

export default async function BrandProjectReviewPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const profile = await getMvpProfile();
  if (!profile || (profile.role !== "brand" && profile.role !== "admin")) {
    redirect(withLocale("/login?role=brand", locale));
  }

  const campaign = await getProject(id);
  if (!campaign) {
    notFound();
  }

  const clientEmail = await getCurrentClientEmail();
  if (clientEmail && campaign.client_email.toLowerCase() !== clientEmail.toLowerCase() && profile.role !== "admin") {
    redirect(withLocale("/brand", locale));
  }

  const order = await getOrderForProject(id);
  const deliverables = order ? await getDeliverables(order.id) : [];
  const sessionUser = await getSessionUser();

  const { bundle } = await getUnifiedReviewBundleForCampaign(id, {
    order,
    deliverables,
    viewerUserId: sessionUser?.id
  });

  if (profile.role === "brand" && !(await brandCanAccessMvpReview(bundle.project, profile))) {
    redirect(withLocale("/brand", locale));
  }

  const flash =
    query.approved === "1" || query.completed === "1"
      ? ("approved" as const)
      : query.revision === "1" || query.revision === "requested"
        ? ("revision" as const)
        : query.settled === "1"
          ? ("settled" as const)
          : undefined;

  return (
    <ReviewWorkspace
      locale={locale}
      project={bundle.project}
      versions={bundle.versions}
      comments={bundle.comments}
      profiles={bundle.profiles}
      role="brand"
      flash={flash}
    />
  );
}
