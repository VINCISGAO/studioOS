import { communicationService } from "@/features/communication/communication.service";
import { sendMessageSchema } from "@/features/communication/communication.schemas";
import { apiError, apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

/** Generic message endpoint — requires campaign_id query or body extension via translate route for non-chat content. */
export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const json = (await request.json()) as Record<string, unknown>;
    const campaignId = String(json.campaign_id ?? "");
    if (!campaignId) {
      return apiError(
        "VALIDATION_ERROR",
        "Use POST /api/v1/campaigns/{id}/messages for chat or POST /api/v1/messages/translate for platform text",
        422
      );
    }

    const body = sendMessageSchema.parse(json);
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
