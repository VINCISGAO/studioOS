import { CreatorOnboardingPage } from "@/components/studioos/creator-onboarding-page";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ submitted?: string; error?: string; lang?: string }> };

export default async function StudioOnboardingPage({ searchParams }: Props) {
  return <CreatorOnboardingPage searchParams={await searchParams} />;
}
