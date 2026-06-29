import { redirect } from "next/navigation";
import { CreatorInvitationsPanel } from "@/components/studioos/creator-invitations-panel";
import { PageHeader } from "@/components/studioos/ui/page-header";
import { creatorPortalService } from "@/features/creator/creator-portal.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

export default async function StudioInvitationsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const creator = await getCurrentCreator();
  if (!creator) redirect(withLocale("/login?role=creator", locale));

  const user = await getSessionUser();
  const invitations =
    user && !user.id.startsWith("demo_")
      ? await creatorPortalService.listInvitations({ id: user.id, role: user.role })
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={locale === "zh" ? "项目邀请" : "Project invitations"}
        description={
          locale === "zh"
            ? "接受或拒绝品牌发来的制作邀请。接受后项目会进入制作流程。"
            : "Accept or decline brand project invitations. Accepted projects enter production."
        }
      />
      <CreatorInvitationsPanel locale={locale} invitations={invitations} />
    </div>
  );
}
