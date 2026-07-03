"use server";

import { revalidatePath } from "next/cache";
import { getCurrentClientEmail } from "@/lib/client-session";
import { DEMO_USERS } from "@/lib/demo-auth";
import type { Locale } from "@/lib/i18n";
import {
  saveBrandProfile,
  setBrandShowcaseVisibility,
  syncBrandShowcaseFromOrders,
  updateBrandLogoUrl
} from "@/lib/brand-profile-service";
import { polishBrandProfileWithAI } from "@/lib/studioos/brand-profile-ai";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

async function requireBrandEmail() {
  const email = await getCurrentClientEmail();
  if (!email) throw new Error("Unauthorized");
  return email.toLowerCase();
}

function defaultCompanyName(email: string) {
  const demo = DEMO_USERS.find((user) => user.email === email);
  return demo?.label.replace(/\s*\(brand\)/i, "").trim() ?? email.split("@")[0] ?? "Brand";
}

export async function saveBrandProfileAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const email = await requireBrandEmail();

  const company_name = String(formData.get("company_name") ?? "").trim() || defaultCompanyName(email);
  const display_name = String(formData.get("display_name") ?? "").trim() || company_name;
  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const markComplete = formData.get("mark_complete") === "1";

  if (markComplete && (!headline || !bio)) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请填写品牌简介和主页介绍" : "Add a headline and bio to publish your page"
    };
  }

  const profile = await saveBrandProfile(email, {
    company_name,
    display_name,
    headline,
    bio,
    website,
    industry,
    markComplete
  });

  revalidatePath("/brand/profile");
  revalidatePath("/brand");
  revalidatePath(`/brands/${profile.id}`);

  return {
    ok: true as const,
    profileId: profile.id,
    published: markComplete
  };
}

export async function polishBrandProfileAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  await requireBrandEmail();

  const companyName = String(formData.get("company_name") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const draft = String(formData.get("draft") ?? "").trim();
  const existingHeadline = String(formData.get("headline") ?? "").trim();
  const existingBio = String(formData.get("bio") ?? "").trim();

  const hasContext =
    draft ||
    existingHeadline ||
    existingBio ||
    companyName ||
    displayName ||
    industry;

  if (!hasContext) {
    return {
      ok: false as const,
      error:
        lang === "zh"
          ? "先写几句品牌信息，或填写公司名称/行业，AI 才能帮你整理"
          : "Add a few lines about your brand, or fill in company/industry first"
    };
  }

  const result = await polishBrandProfileWithAI(
    {
      companyName,
      displayName,
      industry,
      website,
      draft,
      existingHeadline,
      existingBio
    },
    lang
  );

  return { ok: true as const, ...result };
}

export async function syncBrandShowcaseAction(formData: FormData) {
  void formData;
  const email = await requireBrandEmail();
  const profile = await syncBrandShowcaseFromOrders(email);
  revalidatePath("/brand/profile");
  revalidatePath(`/brands/${profile.id}`);
  return { ok: true as const, count: profile.showcase_ads.length };
}

export async function toggleBrandShowcaseAdAction(formData: FormData) {
  const email = await requireBrandEmail();
  const adId = String(formData.get("ad_id") ?? "");
  const visible = formData.get("visible") === "1";
  const profile = await setBrandShowcaseVisibility(email, adId, visible);
  if (!profile) {
    return { ok: false as const, error: "not-found" };
  }
  revalidatePath("/brand/profile");
  revalidatePath(`/brands/${profile.id}`);
  return { ok: true as const };
}

export async function uploadBrandAvatarAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const email = await requireBrandEmail();

  const file = formData.get("avatar_file");
  if (!(file instanceof File)) {
    return { ok: false as const, error: lang === "zh" ? "请选择图片" : "Choose an image file" };
  }

  const { saveBrandAvatarUpload } = await import("@/lib/studioos/brand-avatar-upload");
  const { getBrandProfileByEmail } = await import("@/lib/brand-profile-service");
  const profile = await getBrandProfileByEmail(email);
  if (!profile) {
    return { ok: false as const, error: lang === "zh" ? "品牌资料不存在" : "Brand profile not found" };
  }

  const saved = await saveBrandAvatarUpload(profile.id, file);
  if (!saved.ok) {
    return { ok: false as const, error: saved.error };
  }

  const updated = await updateBrandLogoUrl(email, saved.url, {
    fileKey: saved.file_key,
    storageProvider: saved.storage_provider,
    fileName: saved.file_name,
    mimeType: saved.mime_type,
    sizeBytes: saved.size_bytes
  });
  if (!updated) {
    return { ok: false as const, error: lang === "zh" ? "保存头像失败" : "Failed to save avatar" };
  }
  const { storageFileService } = await import("@/features/storage/storage-file.service");
  await storageFileService.recordBrandAvatar(profile.id, {
    fileName: saved.file_name,
    fileKey: saved.file_key,
    publicUrl: saved.url,
    mimeType: saved.mime_type,
    fileSize: saved.size_bytes,
    provider: saved.storage_provider
  });

  revalidatePath("/brand/profile");
  revalidatePath("/brand");
  revalidatePath(`/brands/${profile.id}`);

  return { ok: true as const, logo_url: saved.url };
}
