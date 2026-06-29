import { notFound, redirect } from "next/navigation";
import { ReviewWorkspace } from "@/components/mvp/review-workspace";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getMvpProfile } from "@/lib/mvp/session";
import { getReviewBundle } from "@/lib/mvp/store";

export default async function ProjectReviewPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams & { approved?: string; revision?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const profile = await getMvpProfile();
  if (!profile) redirect(withLocale("/login", locale));

  const bundle = await getReviewBundle(id);
  if (!bundle) notFound();

  const isParticipant =
    profile.role === "admin" ||
    bundle.project.created_by === profile.id ||
    bundle.project.assigned_studio_id === profile.id;

  if (!isParticipant) redirect(withLocale("/workspace", locale));

  const flash =
    query.approved === "1" ? ("approved" as const) : query.revision === "1" ? ("revision" as const) : undefined;

  return (
    <ReviewWorkspace
      locale={locale}
      project={bundle.project}
      versions={bundle.versions}
      comments={bundle.comments}
      profiles={bundle.profiles}
      role={profile.role}
      flash={flash}
    />
  );
}
