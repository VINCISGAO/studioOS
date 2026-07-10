import Link from "next/link";
import { Clapperboard, FileText, Sparkles, Upload } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

const copy = {
  en: {
    review: "Review center",
    reviewHint: "View versions, comments & annotations",
    upload: "Upload new version",
    uploadHint: "Upload V1 or submit revisions",
    brief: "Requirements & brief",
    briefHint: "View project requirements & creative direction",
    ai: "AI creative collaboration",
    aiHint: "AI helps generate scripts & ideas"
  },
  zh: {
    review: "审片中心",
    reviewHint: "查看版本、添加评论与标注",
    upload: "上传新版本",
    uploadHint: "上传 V1 版本或更新版本",
    brief: "需求与 Brief",
    briefHint: "查看项目需求与创意方向",
    ai: "AI 创意协作",
    aiHint: "AI 帮你生成脚本与创意"
  }
};

function QuickCard({
  icon: Icon,
  title,
  hint,
  href,
  tone
}: {
  icon: typeof Clapperboard;
  title: string;
  hint: string;
  href: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{hint}</p>
      </div>
    </Link>
  );
}

export function CreatorProjectQuickAccess({
  locale,
  orderId,
  onBriefClick,
  onAiClick
}: {
  locale: Locale;
  orderId: string;
  onBriefClick?: string;
  onAiClick?: string;
}) {
  const t = copy[locale];
  const reviewHref = withLocale(creatorPortalRoutes.review(orderId), locale);
  const briefHref = onBriefClick ?? `#brief-content`;
  const aiHref = onAiClick ?? `#ai-collaboration`;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <QuickCard icon={Clapperboard} title={t.review} hint={t.reviewHint} href={reviewHref} tone="bg-violet-100 text-violet-600" />
      <QuickCard icon={Upload} title={t.upload} hint={t.uploadHint} href={reviewHref} tone="bg-blue-100 text-blue-600" />
      <QuickCard icon={FileText} title={t.brief} hint={t.briefHint} href={briefHref} tone="bg-emerald-100 text-emerald-600" />
      <QuickCard icon={Sparkles} title={t.ai} hint={t.aiHint} href={aiHref} tone="bg-orange-100 text-orange-600" />
    </section>
  );
}
