import { connectedChannelService } from "@/features/channels/connected-channel.service";
import { resolveAiSupportCreatorId } from "@/features/ai-support/access";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value);
}

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const url = new URL(request.url);
    const creatorId = await resolveAiSupportCreatorId(user, url.searchParams.get("creator_id"));
    const channels = await connectedChannelService.listForCreator(creatorId);
    return apiSuccess({ channels });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const creatorId = await resolveAiSupportCreatorId(user, optionalString(body.creator_id));
    const platform = optionalString(body.platform)?.trim();
    if (!platform) {
      throw appError("VALIDATION_ERROR", "platform is required");
    }

    const channel = await connectedChannelService.upsert({
      creatorId,
      platform,
      accountUrl: optionalString(body.account_url),
      accountHandle: optionalString(body.account_handle),
      status: optionalString(body.status) ?? undefined,
      sourceCount: typeof body.source_count === "number" ? body.source_count : undefined,
      aiLearningEnabled: typeof body.ai_learning_enabled === "boolean" ? body.ai_learning_enabled : undefined,
      metadataJson: body.metadata,
      lastSyncedAt: typeof body.last_synced_at === "string" ? new Date(body.last_synced_at) : undefined
    });

    return apiSuccess({ channel });
  } catch (error) {
    return handleRouteError(error);
  }
}
