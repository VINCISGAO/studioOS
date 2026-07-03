import { creatorAiSupportConfigService } from "@/features/ai-support/ai-config.service";
import { resolveAiSupportCreatorId } from "@/features/ai-support/access";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

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
    const config = await creatorAiSupportConfigService.getOrCreateConfig(creatorId);
    return apiSuccess({ config });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const creatorId = await resolveAiSupportCreatorId(user, optionalString(body.creator_id));

    const config = await creatorAiSupportConfigService.saveConfig({
      creatorId,
      aiName: optionalString(body.ai_name) ?? undefined,
      persona: optionalString(body.persona),
      welcomeMessage: optionalString(body.welcome_message),
      serviceIntro: optionalString(body.service_intro),
      faqJson: body.faq,
      pricingRulesJson: body.pricing_rules,
      receptionScript: optionalString(body.reception_script),
      multilingualJson: body.multilingual,
      defaultReply: optionalString(body.default_reply),
      blockedContentJson: body.blocked_content,
      handoffRulesJson: body.handoff_rules,
      dataSourcesJson: body.data_sources,
      isEnabled: typeof body.is_enabled === "boolean" ? body.is_enabled : undefined
    });

    return apiSuccess({ config });
  } catch (error) {
    return handleRouteError(error);
  }
}
