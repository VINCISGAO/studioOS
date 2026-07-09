import { payBrandCampaignCheckoutAction } from "@/app/brand-payment-actions";
import { appPath } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

type GetContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request) {
  return payBrandCampaignCheckoutAction(await request.formData());
}

export async function GET(request: Request, context: GetContext) {
  const { id } = await context.params;
  return Response.redirect(new URL(appPath(brandPortalRoutes.projectCheckout(id)), request.url), 303);
}
