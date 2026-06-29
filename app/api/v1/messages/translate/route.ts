import { communicationService } from "@/features/communication/communication.service";
import { translateTextSchema } from "@/features/communication/communication.schemas";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = translateTextSchema.parse(await request.json());
    const message = await communicationService.translateText(
      { id: user.id, role: user.role },
      {
        content: body.content,
        targetLanguage: body.target_language,
        sourceType: body.source_type,
        campaignId: body.campaign_id,
        context: body.context
      }
    );
    return apiSuccess(message);
  } catch (error) {
    return handleRouteError(error);
  }
}
