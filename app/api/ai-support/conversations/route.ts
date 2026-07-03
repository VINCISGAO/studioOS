import type { ConversationMessageRole, ConversationStatus } from "@prisma/client";
import { canManageAiSupport, resolveAiSupportCreatorId } from "@/features/ai-support/access";
import { aiSupportConversationService } from "@/features/ai-support/conversation.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";
import { asInputJson } from "@/lib/core/prisma-json";

const statuses: ConversationStatus[] = ["OPEN", "AI_ACTIVE", "HUMAN_REQUIRED", "HUMAN_ACTIVE", "CLOSED"];
const roles: ConversationMessageRole[] = ["USER", "ASSISTANT", "SYSTEM", "HUMAN_AGENT"];

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value);
}

function parseStatus(value: string | null): ConversationStatus | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase() as ConversationStatus;
  return statuses.includes(normalized) ? normalized : undefined;
}

function parseRole(value: unknown): ConversationMessageRole {
  const normalized = String(value ?? "USER").toUpperCase() as ConversationMessageRole;
  return roles.includes(normalized) ? normalized : "USER";
}

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const url = new URL(request.url);
    const requestedCreatorId = url.searchParams.get("creator_id");
    const creatorId = requestedCreatorId || !canManageAiSupport(user)
      ? await resolveAiSupportCreatorId(user, requestedCreatorId)
      : undefined;

    const conversations = await aiSupportConversationService.listConversations({
      creatorId,
      customerId: url.searchParams.get("customer_id") ?? undefined,
      assignedTo: url.searchParams.get("assigned_to") ?? undefined,
      campaignId: url.searchParams.get("campaign_id") ?? undefined,
      status: parseStatus(url.searchParams.get("status")),
      limit: Number(url.searchParams.get("limit") ?? 50)
    });

    return apiSuccess({ conversations });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const requestedCreatorId = optionalString(body.creator_id);
    if (user.role === "BRAND" && !requestedCreatorId) {
      throw appError("VALIDATION_ERROR", "creator_id is required");
    }
    const creatorId = user.role === "BRAND"
      ? requestedCreatorId!
      : await resolveAiSupportCreatorId(user, requestedCreatorId);
    const channel = optionalString(body.channel)?.trim();
    if (!channel) {
      throw appError("VALIDATION_ERROR", "channel is required");
    }

    const content = optionalString(body.content)?.trim();
    const conversation = await aiSupportConversationService.createConversation({
      creatorId,
      visitorId: optionalString(body.visitor_id),
      customerId: optionalString(body.customer_id) ?? (user.role === "BRAND" ? user.id : null),
      campaignId: optionalString(body.campaign_id),
      channel,
      source: optionalString(body.source),
      language: optionalString(body.language) ?? "en",
      status: parseStatus(optionalString(body.status) ?? null) ?? "AI_ACTIVE",
      openingMessage: content
        ? {
            role: parseRole(body.role),
            content,
            metadata: asInputJson(body.metadata),
            tokens: typeof body.tokens === "number" ? body.tokens : null
          }
        : undefined
    });

    return apiSuccess({ conversation }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
