"use server";

import { redirect } from "next/navigation";
import { addPitchMessage, getInquiry } from "@/lib/chat-service";
import { getCurrentClientEmail, getCurrentCreatorId } from "@/features/auth/session-context";
import { withLocale, type Locale } from "@/lib/i18n";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

export async function submitLivePitchAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const inquiryId = String(formData.get("inquiry_id") ?? "");
  const videoUrl = String(formData.get("video_url") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();

  const creatorId = await getCurrentCreatorId();
  const inquiry = await getInquiry(inquiryId);

  if (!creatorId || !inquiry || inquiry.creator_id !== creatorId || !videoUrl) {
    redirect(withLocale(`/proposal/${inquiryId}?error=pitch`, lang));
  }

  await addPitchMessage(inquiryId, creatorId, videoUrl, caption);
  redirect(withLocale(`/proposal/${inquiryId}?pitched=1`, lang));
}

export async function submitReferenceAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const inquiryId = String(formData.get("inquiry_id") ?? "");
  const referenceUrl = String(formData.get("reference_url") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  const inquiry = await getInquiry(inquiryId);
  const clientEmail = await getCurrentClientEmail();
  if (
    !inquiry ||
    !referenceUrl ||
    !clientEmail ||
    clientEmail.toLowerCase() !== inquiry.client_email.toLowerCase()
  ) {
    redirect(withLocale(`/proposal/${inquiryId}?error=reference`, lang));
  }

  const { addMessage } = await import("@/lib/chat-service");
  const body = note ? `${note}\n${referenceUrl}` : `Reference: ${referenceUrl}`;
  await addMessage(inquiryId, "brand", body, { kind: "reference", attachment_url: referenceUrl });

  redirect(withLocale(`/proposal/${inquiryId}`, lang));
}
