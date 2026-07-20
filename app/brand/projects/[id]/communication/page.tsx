import { getAppUiLocale } from "@/lib/app-language";
import { notFound, redirect } from "next/navigation";
import { CommunicationChatPanel } from "@/components/studioos/communication/communication-chat-panel";
import { getSessionUser } from "@/features/auth/session.service";
import { requireBrandPortalClientEmail } from "@/features/auth/session-context";
import { platformLocalizationService } from "@/features/communication/platform-localization.service";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { getProject } from "@/lib/project-service";
import { resolveBrandProjectRouteId } from "@/lib/api-client/server-portal-gateway";
import {
  brandPortalRequireOwnedResource,
  brandPortalRequireSession
} from "@/lib/studioos/brand-portal-page-guards";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

export const dynamic = "force-dynamic";

export default async function BrandProjectCommunicationPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = await getAppUiLocale();
  const clientEmail = await requireBrandPortalClientEmail().catch(() => null);
  brandPortalRequireSession(clientEmail, locale, `/brand/projects/${id}/communication`);

  const resolved = await resolveBrandProjectRouteId(id);
  if (resolved.kind === "redirect_project") {
    redirect(
      withLocale(`${brandPortalRoutes.project(resolved.projectId)}/communication`, locale)
    );
  }
  if (resolved.kind === "redirect_review") {
    redirect(withLocale(brandPortalRoutes.orderReview(resolved.orderId), locale));
  }
  if (resolved.kind === "not_found") {
    notFound();
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect(withLocale("/login?role=brand", locale));
  }

  const project = await getProject(id);
  brandPortalRequireOwnedResource(project, clientEmail);

  const prismaCampaignId = await platformLocalizationService.resolveCampaignIdFromLegacyProject(id);
  const localizedBrief = prismaCampaignId
    ? await platformLocalizationService.localizeCampaignBrief(prismaCampaignId, sessionUser.id)
    : null;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <p className="text-sm text-muted-foreground">AI Communication — auto localized for both sides</p>
      </div>

      {localizedBrief?.displayContent ? (
        <section className="rounded-xl border bg-muted/20 p-4">
          <h2 className="text-sm font-medium">Campaign Brief (localized)</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{localizedBrief.displayContent}</p>
        </section>
      ) : null}

      {prismaCampaignId ? (
        <CommunicationChatPanel
          campaignId={prismaCampaignId}
          currentUserId={sessionUser.id}
          locale={locale === "zh" ? "zh" : "en"}
          className="min-h-[560px]"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Link this project to a Prisma campaign (run db:seed) to enable AI Communication chat.
        </p>
      )}
    </main>
  );
}
