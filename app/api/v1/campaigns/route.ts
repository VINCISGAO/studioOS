import { campaignService, serializeCampaign } from "@/features/campaign/campaign.service";
import { createCampaignSchema, listCampaignsSchema } from "@/features/campaign/campaign.schemas";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const url = new URL(request.url);
    const query = listCampaignsSchema.parse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined
    });

    const result = await campaignService.listForUser(user, query.page, query.limit);
    return apiSuccess({
      items: result.items.map(serializeCampaign),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit))
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = createCampaignSchema.parse(await request.json());
    const campaign = await campaignService.create(user, body);
    if (!campaign) {
      throw new Error("Campaign create failed");
    }
    return apiSuccess(serializeCampaign(campaign), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
