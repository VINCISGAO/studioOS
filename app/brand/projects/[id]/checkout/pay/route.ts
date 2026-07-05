import { payBrandCampaignCheckoutAction } from "@/app/brand-payment-actions";

export async function POST(request: Request) {
  return payBrandCampaignCheckoutAction(await request.formData());
}
