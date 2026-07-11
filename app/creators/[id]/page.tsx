import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreatorPublicProfile } from "@/components/creator/creator-public-profile";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { getCreatorById } from "@/lib/creator-service";
import { getWorksForCreator } from "@/lib/works-catalog";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { getCurrentUserEmail } from "@/lib/session-user";
import { getWorksEngagement } from "@/lib/work-engagement-service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

const copy = {
  en: {
    back: "Back to studios",
    profile: "Studio profile",
    works: "Portfolio",
    posts: "Works",
    about: "About",
    inquiry: "Open Proposal Room",
    inquiryBody: "Share budget and scope. You will enter Proposal Room to align on the plan before contract.",
    fields: {
      budget: "Budget",
      message: "Scope & requirements"
    },
    submit: "Enter Proposal Room",
    chatHint: "Professional chat in Proposal Room — references, Live Pitch, and contract before production starts.",
    quote: "Proposal",
    customQuote: "Custom scope",
    turnaround: "Turnaround",
    deposit: "Deposit",
    notFound: "Studio not found",
    editProfile: "Edit profile",
    preview: "Preview video",
    openOriginal: "Open original link",
    empty: "No portfolio videos yet.",
    viewStudio: "View studio profile"
  },
  zh: {
    back: "返回 Studio 作品库",
    profile: "Studio 主页",
    works: "作品集",
    posts: "作品",
    about: "简介",
    inquiry: "进入 Proposal Room",
    inquiryBody: "填写预算与需求，进入 Proposal Room 对齐方案后再签约制作。",
    fields: {
      budget: "预算",
      message: "需求与范围"
    },
    submit: "进入 Proposal Room",
    chatHint: "在 Proposal Room 内专业沟通 — 参考素材、Live Pitch 与合同，制作开始前完成对齐。",
    quote: "方案",
    customQuote: "按项目报价",
    turnaround: "交付周期",
    deposit: "保证金",
    notFound: "未找到 Studio",
    editProfile: "编辑资料",
    preview: "预览视频",
    openOriginal: "在原平台打开",
    empty: "这位 Studio 还没有发布作品。",
    viewStudio: "查看制作团队主页"
  }
};

type CreatorProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams & { work?: string }>;
};

export default async function CreatorProfilePage({ params, searchParams }: CreatorProfilePageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const t = copy[locale];
  const creator = await getCreatorById(id);
  const currentCreatorId = await getCurrentCreatorId();

  if (!creator) {
    return (
      <PageShell locale={locale}>
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-semibold">{t.notFound}</h1>
          <Button asChild className="mt-6">
            <Link href={withLocale("/creators", locale)}>{t.back}</Link>
          </Button>
        </main>
      </PageShell>
    );
  }

  const works = await getWorksForCreator(creator.id);
  const isOwner = currentCreatorId === creator.id;
  const userEmail = await getCurrentUserEmail();
  const engagement = await getWorksEngagement(
    works.map((work) => work.id),
    userEmail
  );

  return (
    <PageShell locale={locale}>
      <main className="min-h-screen bg-white">
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href={withLocale(isOwner ? "/creator/profile" : "/creators", locale)}>
              <ArrowLeft className="h-4 w-4" /> {isOwner ? (locale === "zh" ? "返回我的主页" : "Back to my profile") : t.back}
            </Link>
          </Button>

          <CreatorPublicProfile
            locale={locale}
            baseCreator={creator}
            baseWorks={works}
            engagement={engagement}
            isLoggedIn={Boolean(userEmail)}
            isOwner={isOwner}
            selectedWorkId={query.work}
            copy={t}
          />
        </section>
      </main>
    </PageShell>
  );
}
