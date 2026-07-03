import { canManageAiSupport } from "@/features/ai-support/access";
import { aiSupportConversationService } from "@/features/ai-support/conversation.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

type Params = { params: Promise<{ conversationId: string }> };

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value);
}

async function assertCanAccessConversation(conversationId: string, user: Awaited<ReturnType<typeof requireApiUser>>) {
  const conversation = await aiSupportConversationService.getConversation(conversationId);
  if (!conversation) {
    throw appError("NOT_FOUND", "Conversation not found");
  }

  if (canManageAiSupport(user) || conversation.customerId === user.id || conversation.creator.userId === user.id) {
    return conversation;
  }

  throw appError("FORBIDDEN", "Cannot access this conversation");
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const { conversationId } = await params;
    await assertCanAccessConversation(conversationId, user);

    const body = (await request.json()) as Record<string, unknown>;
    const action = optionalString(body.action);

    if (action === "request") {
      const conversation = await aiSupportConversationService.requestHumanHandoff(
        conversationId,
        optionalString(body.reason) ?? undefined
      );
      return apiSuccess({ conversation });
    }

    if (action === "assign") {
      if (!canManageAiSupport(user)) {
        throw appError("FORBIDDEN", "Only support users can assign a human agent");
      }
      const assignedTo = optionalString(body.assigned_to);
      if (!assignedTo) {
        throw appError("VALIDATION_ERROR", "assigned_to is required");
      }
      const conversation = await aiSupportConversationService.assignHumanAgent(conversationId, assignedTo);
      return apiSuccess({ conversation });
    }

    if (action === "close") {
      const conversation = await aiSupportConversationService.closeConversation(conversationId);
      return apiSuccess({ conversation });
    }

    throw appError("VALIDATION_ERROR", "action must be request, assign, or close");
  } catch (error) {
    return handleRouteError(error);
  }
}
