import { redirect } from "next/navigation";
import { DepositPanel } from "@/components/studioos/deposit-panel";
import { getCurrentCreator } from "@/lib/creator-session";
import { getCreatorDepositSnapshot } from "@/lib/studioos/deposit-service";
import { depositRequiredMessage } from "@/lib/studioos/deposit-copy";
import { hasCompletedCreatorProfile } from "@/lib/studioos/deposit-guard";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

export default async function StudioDepositPage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { submitted?: string; error?: string }>;
}) {
  const query = await searchParams;
  const locale = getLocale(query);
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const snapshot = await getCreatorDepositSnapshot(creator.id);
  const errorMessage =
    query.error === "deposit-required"
      ? depositRequiredMessage(locale)
      : query.error
        ? decodeURIComponent(query.error)
        : undefined;

  return (
    <DepositPanel
      locale={locale}
      creatorId={creator.id}
      snapshot={snapshot}
      submitted={query.submitted === "1"}
      error={errorMessage}
      profileComplete={hasCompletedCreatorProfile(creator)}
    />
  );
}
