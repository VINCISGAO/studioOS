import Link from "next/link";
import { redirect } from "next/navigation";
import { VideoReviewPlayer } from "@/components/studioos/video-review-player";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder } from "@/lib/order-service";
import { listReviewComments } from "@/lib/studioos/review-store";

export default async function StudioReviewPage({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<SearchParams & { version?: string }>;
}) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const creator = await getCurrentCreator();
  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const order = await getOrder(orderId);
  if (!order || order.creator_id !== creator.id) {
    redirect(withLocale("/studio", locale));
  }

  const deliverables = await getDeliverables(order.id);
  const comments = await listReviewComments(order.id);
  const initialVersion = Number(query.version) || deliverables[0]?.version || 1;
  const canUpload = ["in_production", "revision", "review"].includes(order.status);

  return (
    <div className="space-y-8">
      <div>
        <Link href={withLocale("/studio/delivery", locale)} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {locale === "zh" ? "返回交付工作台" : "Back to Delivery Workspace"}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {locale === "zh" ? "视频审片" : "Video review"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {order.title}
          {deliverables.length === 0
            ? locale === "zh"
              ? " · 请先上传 Version 1"
              : " · Upload Version 1 first"
            : null}
        </p>
      </div>

      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <VideoReviewPlayer
            locale={locale}
            orderId={order.id}
            role="studio"
            versions={deliverables}
            initialComments={comments}
            initialVersion={initialVersion}
            canUpload={canUpload}
          />
        </CardContent>
      </Card>
    </div>
  );
}
