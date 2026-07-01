import { redirect } from "next/navigation";
import { PageHeader } from "@/components/studioos/ui/page-header";
import { ReviewHubList } from "@/components/studioos/review-hub-list";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { listCreatorReviewHubItems } from "@/lib/studioos/review-hub";

export default async function StudioReviewHubPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const creator = await getCurrentCreator();
  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const items = await listCreatorReviewHubItems(creator.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={locale === "zh" ? "审片中心" : "Review center"}
        description={
          locale === "zh"
            ? "与品牌方共享同一套审片数据：版本、时间码批注、通过/修改状态实时同步。"
            : "Share the same review data with brands — versions, timed comments, and approvals stay in sync."
        }
      />
      <ReviewHubList locale={locale} items={items} audience="creator" />
    </div>
  );
}
