import { redirect } from "next/navigation";
import { CreatorProfileStudio } from "@/components/creator/creator-profile-studio";
import { CertifiedProfileOnboarding } from "@/components/studioos/certified-profile-onboarding";
import { DepositRequiredCallout } from "@/components/studioos/deposit-required-callout";
import { getCurrentCreator } from "@/lib/creator-session";
import { getCurrentUserEmail } from "@/lib/session-user";
import { hasCompletedCreatorProfile, hasPaidCreatorDeposit } from "@/lib/studioos/deposit-guard";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getWorksEngagement } from "@/lib/work-engagement-service";
import { getWorksForCreator } from "@/lib/works-catalog";

const errorCopy = {
  en: {
    "missing-core-fields": "Please complete your name, headline, and bio.",
    "missing-expertise": "Select at least one expertise domain and specialty."
  },
  zh: {
    "missing-core-fields": "请填写展示名称、一句话介绍和个人简介。",
    "missing-expertise": "请至少选择一个擅长领域并填写擅长方向。"
  }
};

export default async function StudioProfilePage({
  searchParams
}: {
  searchParams: Promise<SearchParams & { publish?: string; onboarding?: string; onboarded?: string; error?: string }>;
}) {
  const params = await searchParams;
  const locale = getLocale(params);
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const works = await getWorksForCreator(creator.id, { ownerView: true });
  const userEmail = await getCurrentUserEmail();
  const engagement = await getWorksEngagement(
    works.map((work) => work.id),
    userEmail
  );
  const isLoggedIn = Boolean(userEmail);
  const certificationPaid = hasPaidCreatorDeposit(creator);
  const profileComplete = hasCompletedCreatorProfile(creator);
  const showOnboarding = certificationPaid && (!profileComplete || params.onboarding === "1");

  if (!certificationPaid) {
    return (
      <div className="space-y-6">
        <DepositRequiredCallout locale={locale} />
        <CreatorProfileStudio
          locale={locale}
          baseCreator={creator}
          baseWorks={works}
          engagement={engagement}
          isLoggedIn={isLoggedIn}
          openPublishOnLoad={params.publish === "1"}
        />
      </div>
    );
  }

  if (showOnboarding) {
    const errorMessage = params.error ? errorCopy[locale][params.error as keyof typeof errorCopy.en] : undefined;
    return (
      <CertifiedProfileOnboarding locale={locale} creator={creator} works={works} error={errorMessage} />
    );
  }

  return (
    <CreatorProfileStudio
      locale={locale}
      baseCreator={creator}
      baseWorks={works}
      engagement={engagement}
      isLoggedIn={isLoggedIn}
      openPublishOnLoad={params.publish === "1"}
      showAiTags
      showRatingNote
      onboarded={params.onboarded === "1"}
    />
  );
}
