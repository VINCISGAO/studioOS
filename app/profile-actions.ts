"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { completeCreatorProfile, saveCreatorProfileDraft } from "@/lib/creator-profile-service";
import { getWorksForCreator } from "@/lib/works-catalog";
import { withLocale, type Locale } from "@/lib/i18n";
import { normalizeCreatorMinBudget } from "@/lib/studioos/creator-price-preference";
import { markCertificationFormProfileCompleted } from "@/lib/studioos/certification-form-service";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

function parseList(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDomains(formData: FormData) {
  return formData
    .getAll("expertise_domains")
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function readProfileInput(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    headline: String(formData.get("headline") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim(),
    portfolio_url: String(formData.get("portfolio_url") ?? "").trim(),
    specialties: parseList(formData.get("specialties")),
    expertise_domains: parseDomains(formData),
    tools: parseList(formData.get("tools")),
    delivery_speed: String(formData.get("delivery_speed") ?? "").trim(),
    min_project_budget_usd: normalizeCreatorMinBudget(formData.get("min_project_budget_usd"))
  };
}

async function persistCreatorProfile(
  creatorId: string,
  input: ReturnType<typeof readProfileInput>,
  options?: { expertise_domains?: string[] }
) {
  const { getStoredCreatorProfile } = await import("@/lib/creator-profile-service");
  const existing = await getStoredCreatorProfile(creatorId);
  const works = await getWorksForCreator(creatorId, { ownerView: true });

  return saveCreatorProfileDraft(
    creatorId,
    {
      ...input,
      expertise_domains: options?.expertise_domains?.length
        ? options.expertise_domains
        : input.expertise_domains.length
          ? input.expertise_domains
          : (existing?.expertise_domains ?? [])
    },
    works
  );
}

function revalidateCreatorProfilePaths(creatorId: string) {
  revalidatePath("/studio");
  revalidatePath("/studio/profile");
  revalidatePath("/creator/profile");
  revalidatePath("/match");
  revalidatePath(`/creators/${creatorId}`);
}

export async function completeCreatorProfileAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    redirect(withLocale("/login?role=creator", lang));
  }

  const works = await getWorksForCreator(creatorId, { ownerView: true });
  const result = await completeCreatorProfile(creatorId, readProfileInput(formData), works);

  if (!result.ok) {
    redirect(withLocale(`/studio/profile?onboarding=1&error=${result.error}`, lang));
  }

  await markCertificationFormProfileCompleted(creatorId).catch(() => undefined);

  revalidateCreatorProfilePaths(creatorId);
  redirect(withLocale("/studio/profile?onboarded=1", lang));
}

export async function saveCreatorProfileClientAction(input: {
  lang: Locale;
  name: string;
  headline: string;
  bio: string;
  country: string;
  portfolio_url: string;
  specialties: string[];
  tools: string[];
  delivery_speed: string;
  min_project_budget_usd?: number;
  expertise_domains?: string[];
}) {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return { ok: false as const, error: input.lang === "zh" ? "请先登录" : "Sign in required" };
  }

  if (!input.name.trim() || !input.headline.trim()) {
    return {
      ok: false as const,
      error: input.lang === "zh" ? "请填写 Studio 名称和一句话介绍" : "Enter studio name and headline"
    };
  }

  await persistCreatorProfile(
    creatorId,
    {
      name: input.name.trim(),
      headline: input.headline.trim(),
      bio: input.bio.trim(),
      country: input.country.trim(),
      portfolio_url: input.portfolio_url.trim(),
      specialties: input.specialties,
      expertise_domains: input.expertise_domains ?? [],
      tools: input.tools,
      delivery_speed: input.delivery_speed.trim(),
      min_project_budget_usd: normalizeCreatorMinBudget(input.min_project_budget_usd)
    },
    { expertise_domains: input.expertise_domains }
  );

  revalidateCreatorProfilePaths(creatorId);
  return { ok: true as const };
}

export async function saveCreatorProfileAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    redirect(withLocale("/login?role=creator", lang));
  }

  await persistCreatorProfile(creatorId, readProfileInput(formData));

  revalidateCreatorProfilePaths(creatorId);
  redirect(withLocale("/studio/profile?saved=1", lang));
}

export async function uploadCreatorAvatarAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return { ok: false as const, error: lang === "zh" ? "请先登录" : "Sign in required" };
  }

  const file = formData.get("avatar_file");
  if (!(file instanceof File)) {
    return { ok: false as const, error: lang === "zh" ? "请选择图片" : "Choose an image file" };
  }

  const { saveCreatorAvatarUpload } = await import("@/lib/studioos/creator-avatar-upload");
  const saved = await saveCreatorAvatarUpload(creatorId, file);
  if (!saved.ok) {
    return { ok: false as const, error: saved.error };
  }

  const { getCreatorById } = await import("@/lib/creator-service");
  const { updateCreatorAvatarUrl } = await import("@/lib/creator-profile-service");
  const creator = await getCreatorById(creatorId);
  if (!creator) {
    return { ok: false as const, error: lang === "zh" ? "Studio 不存在" : "Studio not found" };
  }

  const works = await getWorksForCreator(creatorId, { ownerView: true });
  await updateCreatorAvatarUrl(creatorId, saved.url, creator, works);
  const { storageFileService } = await import("@/features/storage/storage-file.service");
  await storageFileService.recordCreatorAvatar(creatorId, {
    fileName: saved.file_name,
    fileKey: saved.file_key,
    publicUrl: saved.url,
    mimeType: saved.mime_type,
    fileSize: saved.size_bytes,
    provider: saved.storage_provider
  });

  revalidateCreatorProfilePaths(creatorId);
  return { ok: true as const, avatar_url: saved.url };
}

export async function uploadCreatorCoverAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return { ok: false as const, error: lang === "zh" ? "请先登录" : "Sign in required" };
  }

  const file = formData.get("cover_file");
  if (!(file instanceof File)) {
    return { ok: false as const, error: lang === "zh" ? "请选择图片" : "Choose an image file" };
  }

  const { saveCreatorCoverUpload } = await import("@/lib/studioos/creator-avatar-upload");
  const saved = await saveCreatorCoverUpload(creatorId, file);
  if (!saved.ok) {
    return { ok: false as const, error: saved.error };
  }

  const { getCreatorById } = await import("@/lib/creator-service");
  const { updateCreatorCoverUrl } = await import("@/lib/creator-profile-service");
  const creator = await getCreatorById(creatorId);
  if (!creator) {
    return { ok: false as const, error: lang === "zh" ? "Studio 不存在" : "Studio not found" };
  }

  const works = await getWorksForCreator(creatorId, { ownerView: true });
  await updateCreatorCoverUrl(creatorId, saved.url, creator, works);
  const { storageFileService } = await import("@/features/storage/storage-file.service");
  await storageFileService.recordCreatorCover(creatorId, {
    fileName: saved.file_name,
    fileKey: saved.file_key,
    publicUrl: saved.url,
    mimeType: saved.mime_type,
    fileSize: saved.size_bytes,
    provider: saved.storage_provider
  });

  revalidateCreatorProfilePaths(creatorId);
  return { ok: true as const, cover_url: saved.url };
}
