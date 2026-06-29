"use server";

import { revalidatePath } from "next/cache";
import type { CopilotAction, CopilotContext } from "@/lib/studioos/copilot";
import { generateCopilotWithAI } from "@/lib/studioos/copilot-ai";
import { runQualityChecksAsync } from "@/lib/studioos/quality";
import type { Locale } from "@/lib/i18n";

export async function generateCopilotAction(formData: FormData): Promise<{
  output: string;
  source: "openai" | "template";
}> {
  const action = String(formData.get("action") ?? "brief") as CopilotAction;
  const locale = (String(formData.get("lang") ?? "en") === "zh" ? "zh" : "en") as Locale;
  const ctx: CopilotContext = {
    productUrl: String(formData.get("product_url") ?? ""),
    campaignGoal: String(formData.get("campaign_goal") ?? ""),
    audience: String(formData.get("audience") ?? ""),
    style: String(formData.get("style") ?? ""),
    projectTitle: String(formData.get("project_title") ?? ""),
    requirements: String(formData.get("requirements") ?? ""),
    brandName: String(formData.get("brand_name") ?? ""),
    platform: String(formData.get("platform") ?? ""),
    budgetRange: String(formData.get("budget_range") ?? "")
  };

  return generateCopilotWithAI(action, ctx, locale);
}

export async function runQualityScanAction(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "");
  const videoUrl = String(formData.get("video_url") ?? "") || null;
  if (!orderId) return null;

  return runQualityChecksAsync(orderId, {
    hasDeliverable: Boolean(videoUrl),
    videoUrl
  });
}

export async function addReviewCommentAction(formData: FormData) {
  const { addReviewCommentAction: addComment } = await import("@/app/review-actions");
  return addComment(formData);
}
