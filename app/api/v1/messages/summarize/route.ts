import { communicationService } from "@/features/communication/communication.service";
import { summarizeTextSchema } from "@/features/communication/communication.schemas";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = summarizeTextSchema.parse(await request.json());
    const result = await communicationService.summarizeText(
      { id: user.id, role: user.role },
      body.content,
      body.target_language
    );
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
