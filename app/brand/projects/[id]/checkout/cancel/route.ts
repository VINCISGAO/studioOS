import { cancelBrandCampaignCheckoutAction } from "@/app/brand-payment-actions";

export async function POST(request: Request) {
  return cancelBrandCampaignCheckoutAction(await request.formData());
}
