import { aiPreferenceService } from "@/features/memory/ai-preference.service";
import { aiPreferenceSchema } from "@/features/memory/memory.schemas";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET() {
  try {
    const user = await requireApiUser();
    const prefs = await aiPreferenceService.getForUser(user.id);
    return apiSuccess(prefs);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    const body = aiPreferenceSchema.parse(await request.json());
    const updated = await aiPreferenceService.updateForUser(
      { id: user.id, role: user.role },
      {
        preferredLanguage: body.preferred_language,
        alwaysTranslate: body.always_translate,
        neverUseEmojis: body.never_use_emojis,
        tone: body.tone
      }
    );
    return apiSuccess(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
