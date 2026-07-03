"use server";

import { revalidatePath } from "next/cache";
import { creatorAiSupportConfigService } from "@/features/ai-support/ai-config.service";
import { resolveAiSupportCreatorId } from "@/features/ai-support/access";
import { getSessionUser } from "@/features/auth/session.service";
import { appError } from "@/lib/core/errors";

function parseJsonField(value: FormDataEntryValue | null, fallback: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return fallback;
  return JSON.parse(text) as unknown;
}

export async function saveCreatorAiSupportConfigAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.id.startsWith("demo_")) {
    throw appError("UNAUTHORIZED", "Sign in with a database account");
  }

  const creatorId = await resolveAiSupportCreatorId(user, null);
  await creatorAiSupportConfigService.saveConfig({
    creatorId,
    aiName: String(formData.get("ai_name") ?? ""),
    persona: String(formData.get("persona") ?? ""),
    welcomeMessage: String(formData.get("welcome_message") ?? ""),
    serviceIntro: String(formData.get("service_intro") ?? ""),
    faqJson: parseJsonField(formData.get("faq_json"), []),
    pricingRulesJson: parseJsonField(formData.get("pricing_rules_json"), {}),
    blockedContentJson: parseJsonField(formData.get("blocked_content_json"), []),
    handoffRulesJson: parseJsonField(formData.get("handoff_rules_json"), {}),
    multilingualJson: parseJsonField(formData.get("multilingual_json"), {}),
    isEnabled: formData.get("is_enabled") === "on"
  });

  revalidatePath("/studio/ai-support");
}
