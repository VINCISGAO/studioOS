import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/studioos/ui/page-header";
import { ReviewHubList } from "@/components/studioos/review-hub-list";
import { getCurrentClientEmail } from "@/lib/client-session";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { listBrandReviewHubItems } from "@/lib/studioos/review-hub";

export default async function BrandReviewHubPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getAppUiLocale();
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) redirect(withLocale("/login?role=brand", locale));

  const items = await listBrandReviewHubItems(clientEmail);

  return (
    <div className="space-y-6">
      <PageHeader
        title={locale === "zh" ? "审片中心" : "Review center"}
        description={
          locale === "zh"
            ? "查看制作团队提交的版本，添加时间码反馈并批准交付。与创作者共享同一套审片数据。"
            : "Review studio submissions, leave timed feedback, and approve delivery — synced with the creator review center."
        }
      />
      <ReviewHubList locale={locale} items={items} />
    </div>
  );
}
