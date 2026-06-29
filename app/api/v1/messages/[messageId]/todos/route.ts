import { communicationService } from "@/features/communication/communication.service";
import { updateTodoSchema } from "@/features/communication/communication.schemas";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ messageId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { messageId } = await params;
    const body = updateTodoSchema.parse(await request.json());
    const result = await communicationService.updateTodo(
      messageId,
      { id: user.id, role: user.role },
      body.todo_id,
      body.done
    );
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
