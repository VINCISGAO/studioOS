import { notFound, redirect } from "next/navigation";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getOrder } from "@/lib/order-service";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export const dynamic = "force-dynamic";

export default async function BrandOrderReviewPage({ params, searchParams }: PageProps) {
  const [{ id: orderId }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const clientEmail = await getCurrentClientEmail();
  const order = await getOrder(orderId);

  if (!order || !clientEmail || order.client_email.toLowerCase() !== clientEmail.toLowerCase()) {
    notFound();
  }

  redirect(withLocale(`/brand/projects/${order.project_id}/review`, locale));
}
