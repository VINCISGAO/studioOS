import type { ConversationMessageRole } from "@prisma/client";
import { canManageAiSupport } from "@/features/ai-support/access";
import { aiSupportConversationService } from "@/features/ai-support/conversation.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";
import { asInputJson } from "@/lib/core/prisma-json";

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

  if (canManageAiSupport(user)) {
    return conversation;
  }

  if (conversation.customerId === user.id || conversation.creator.userId === user.id) {
    return conversation;
  }

  throw appError("FORBIDDEN", "Cannot access this conversation");
}

function roleForUser(user: Awaited<ReturnType<typeof requireApiUser>>, requestedRole: unknown): ConversationMessageRole {
  if (canManageAiSupport(user)) {
    return requestedRole === "SYSTEM" ? "SYSTEM" : "HUMAN_AGENT";
  }
  if (user.role === "CREATOR") {
    return "HUMAN_AGENT";
  }
  return "USER";
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { conversationId } = await params;
    const conversation = await assertCanAccessConversation(conversationId, user);
    return apiSuccess({ conversation });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const { conversationId } = await params;
    await assertCanAccessConversation(conversationId, user);

    const body = (await request.json()) as Record<string, unknown>;
    const content = optionalString(body.content)?.trim();
    if (!content) {
      throw appError("VALIDATION_ERROR", "content is required");
    }

    const message = await aiSupportConversationService.addMessage({
      conversationId,
      role: roleForUser(user, body.role),
      content,
      metadata: asInputJson(body.metadata),
      tokens: typeof body.tokens === "number" ? body.tokens : null
    });

    return apiSuccess({ message }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
