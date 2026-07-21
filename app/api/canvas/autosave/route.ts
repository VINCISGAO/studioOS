import { canvasService } from "@/features/canvas/canvas.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { canvasAutosaveSchema } from "@/lib/canvas/validation";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = canvasAutosaveSchema.parse(await request.json());
    const saved = await canvasService.saveSnapshot(input, user);
    return apiSuccess(saved);
  } catch (error) {
    return handleRouteError(error);
  }
}
