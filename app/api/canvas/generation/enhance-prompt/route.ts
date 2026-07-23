import { canvasPromptEnhanceSchema } from "@/lib/canvas/validation";
import { canvasPromptEnhanceService } from "@/features/canvas/canvas-prompt-enhance.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = canvasPromptEnhanceSchema.parse(await request.json());
    const data = await canvasPromptEnhanceService.enhance(user, input);
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
