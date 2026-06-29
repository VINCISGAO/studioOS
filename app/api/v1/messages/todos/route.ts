import { communicationService } from "@/features/communication/communication.service";
import { extractTodosSchema } from "@/features/communication/communication.schemas";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = extractTodosSchema.parse(await request.json());
    const result = await communicationService.extractTodos(
      { id: user.id, role: user.role },
      body.content,
      body.target_language
    );
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
