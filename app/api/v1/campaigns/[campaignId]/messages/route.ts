import { communicationService } from "@/features/communication/communication.service";
import { sendMessageSchema } from "@/features/communication/communication.schemas";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const url = new URL(request.url);
    const since = url.searchParams.get("since") ?? undefined;
    const messages = await communicationService.listCampaignMessages(
      campaignId,
      { id: user.id, role: user.role },
      { since }
    );
    return apiSuccess({ messages });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const body = sendMessageSchema.parse(await request.json());
    const message = await communicationService.sendCampaignMessage(
      campaignId,
      { id: user.id, role: user.role },
      body.content,
      body.receiver_id
    );
    return apiSuccess(message, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
