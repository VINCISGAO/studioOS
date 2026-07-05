import { payBrandCampaignCheckoutAction } from "@/app/brand-payment-actions";
import { getLocale, withLocale, type SearchParams } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

type GetContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request) {
  return payBrandCampaignCheckoutAction(await request.formData());
}

export async function GET(request: Request, context: GetContext) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const locale = getLocale(Object.fromEntries(url.searchParams) as SearchParams);
  return Response.redirect(new URL(withLocale(brandPortalRoutes.projectCheckout(id), locale), request.url), 303);
}
