import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import { RESOLUTION_OPTIONS } from "@/lib/studioos/brand-creative-brief-options";

type StoredQuestionnaire = Partial<BriefFormState> & {
  refined_brief?: BriefFormState["refined"];
};

function normalizeVideoDuration(value: unknown, fallback: string) {
  const raw = String(value ?? fallback);
  return raw === "6s" || raw === "10s" ? "15s" : raw;
}

export function normalizeBriefResolution(value: unknown, fallback = "4K") {
  const raw = String(value ?? fallback);
  if (raw === "720p") return "1080p";
  return RESOLUTION_OPTIONS.includes(raw as (typeof RESOLUTION_OPTIONS)[number]) ? raw : fallback;
}

export function defaultCreativeBriefExtendedFields(): Pick<
  BriefFormState,
  | "projectTitle"
  | "adOneLiner"
  | "industry"
  | "brandName"
  | "brandWebsite"
  | "videoDuration"
  | "videoDurationCustom"
  | "estimatedShotCount"
  | "creativeStyles"
  | "creativeStyleCustom"
  | "creativeTones"
  | "creativeToneCustom"
  | "audienceAge"
  | "audienceRegion"
  | "audienceGender"
  | "resolution"
  | "frameRate"
  | "videoQuantity"
  | "mustInclude"
  | "mustIncludeCustom"
  | "mustAvoid"
  | "mustAvoidCustom"
  | "scheduleStart"
  | "scheduleDelivery"
  | "schedulePublish"
> {
  return {
    projectTitle: "",
    adOneLiner: "",
    industry: "",
    brandName: "",
    brandWebsite: "",
    videoDuration: "30s",
    videoDurationCustom: "",
    estimatedShotCount: 0,
    creativeStyles: ["cinematic"],
    creativeStyleCustom: "",
    creativeTones: ["inspiring"],
    creativeToneCustom: "",
    audienceAge: "25-34",
    audienceRegion: "global",
    audienceGender: "all",
    resolution: "4K",
    frameRate: "30 fps",
    videoQuantity: 1,
    mustInclude: [],
    mustIncludeCustom: "",
    mustAvoid: [],
    mustAvoidCustom: "",
    scheduleStart: "",
    scheduleDelivery: "",
    schedulePublish: ""
  };
}

export function readCreativeBriefExtendedFields(
  project: StoredProject,
  stored?: StoredQuestionnaire
): ReturnType<typeof defaultCreativeBriefExtendedFields> {
  const defaults = defaultCreativeBriefExtendedFields();
  const source = stored ?? (project.settings_json?.brand_questionnaire as StoredQuestionnaire | undefined);
  if (!source) {
    return {
      ...defaults,
      projectTitle: project.title ?? "",
      brandName: project.company_name || project.client_name || "",
      brandWebsite: project.product_url ?? ""
    };
  }

  return {
    projectTitle: String(source.projectTitle ?? project.title ?? ""),
    adOneLiner: String(source.adOneLiner ?? ""),
    industry: String(source.industry ?? ""),
    brandName: String(source.brandName ?? project.company_name ?? project.client_name ?? ""),
    brandWebsite: String(source.brandWebsite ?? source.productUrl ?? project.product_url ?? ""),
    videoDuration: normalizeVideoDuration(source.videoDuration, defaults.videoDuration),
    videoDurationCustom: String(source.videoDurationCustom ?? ""),
    estimatedShotCount: Math.max(0, Number(source.estimatedShotCount ?? defaults.estimatedShotCount) || 0),
    creativeStyles: Array.isArray(source.creativeStyles) ? source.creativeStyles.map(String) : defaults.creativeStyles,
    creativeStyleCustom: String(source.creativeStyleCustom ?? ""),
    creativeTones: Array.isArray(source.creativeTones) ? source.creativeTones.map(String) : defaults.creativeTones,
    creativeToneCustom: String(source.creativeToneCustom ?? ""),
    audienceAge: String(source.audienceAge ?? defaults.audienceAge),
    audienceRegion: String(source.audienceRegion ?? defaults.audienceRegion),
    audienceGender:
      source.audienceGender === "male" || source.audienceGender === "female"
        ? source.audienceGender
        : defaults.audienceGender,
    resolution: normalizeBriefResolution(source.resolution, defaults.resolution),
    frameRate: String(source.frameRate ?? defaults.frameRate),
    videoQuantity: Number(source.videoQuantity ?? defaults.videoQuantity) || 1,
    mustInclude: Array.isArray(source.mustInclude) ? source.mustInclude.map(String) : [],
    mustIncludeCustom: String(source.mustIncludeCustom ?? ""),
    mustAvoid: Array.isArray(source.mustAvoid) ? source.mustAvoid.map(String) : [],
    mustAvoidCustom: String(source.mustAvoidCustom ?? ""),
    scheduleStart: String(source.scheduleStart ?? ""),
    scheduleDelivery: String(source.scheduleDelivery ?? ""),
    schedulePublish: String(source.schedulePublish ?? "")
  };
}

function parseCommaList(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readCreativeBriefExtendedFieldsFromFormData(
  formData: FormData
): ReturnType<typeof defaultCreativeBriefExtendedFields> {
  const defaults = defaultCreativeBriefExtendedFields();
  const genderRaw = String(formData.get("audienceGender") ?? "");
  return {
    projectTitle: String(formData.get("projectTitle") ?? "").trim(),
    adOneLiner: String(formData.get("adOneLiner") ?? "").trim(),
    industry: String(formData.get("industry") ?? "").trim(),
    brandName: String(formData.get("brandName") ?? "").trim(),
    brandWebsite: String(formData.get("brandWebsite") ?? "").trim(),
    videoDuration: normalizeVideoDuration(formData.get("videoDuration"), defaults.videoDuration),
    videoDurationCustom: String(formData.get("videoDurationCustom") ?? "").trim(),
    estimatedShotCount: Math.max(0, Number(formData.get("estimatedShotCount") ?? defaults.estimatedShotCount) || 0),
    creativeStyles: parseCommaList(formData.get("creativeStyles")),
    creativeStyleCustom: String(formData.get("creativeStyleCustom") ?? "").trim(),
    creativeTones: parseCommaList(formData.get("creativeTones")),
    creativeToneCustom: String(formData.get("creativeToneCustom") ?? "").trim(),
    audienceAge: String(formData.get("audienceAge") ?? defaults.audienceAge),
    audienceRegion: String(formData.get("audienceRegion") ?? defaults.audienceRegion),
    audienceGender:
      genderRaw === "male" || genderRaw === "female" ? genderRaw : defaults.audienceGender,
    resolution: normalizeBriefResolution(formData.get("resolution"), defaults.resolution),
    frameRate: String(formData.get("frameRate") ?? defaults.frameRate),
    videoQuantity: Number(formData.get("videoQuantity") ?? defaults.videoQuantity) || 1,
    mustInclude: parseCommaList(formData.get("mustInclude")),
    mustIncludeCustom: String(formData.get("mustIncludeCustom") ?? "").trim(),
    mustAvoid: parseCommaList(formData.get("mustAvoid")),
    mustAvoidCustom: String(formData.get("mustAvoidCustom") ?? "").trim(),
    scheduleStart: String(formData.get("scheduleStart") ?? "").trim(),
    scheduleDelivery: String(formData.get("scheduleDelivery") ?? "").trim(),
    schedulePublish: String(formData.get("schedulePublish") ?? "").trim()
  };
}

export function appendCreativeBriefExtendedFields(fd: FormData, state: BriefFormState) {
  const extended = readCreativeBriefExtendedFields({ title: state.projectTitle } as StoredProject, state);
  const payload = { ...extended, ...state };
  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      fd.set(key, value.join(","));
    } else if (value !== undefined && value !== null) {
      fd.set(key, String(value));
    }
  }
}

export function parseBriefScheduleDate(value: string): Date | null {
  const match = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function briefScheduleDayKey(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function isBriefScheduleDayBefore(day: Date, boundary: Date): boolean {
  return briefScheduleDayKey(day) < briefScheduleDayKey(boundary);
}

export function isBriefScheduleDayAfter(day: Date, boundary: Date): boolean {
  return briefScheduleDayKey(day) > briefScheduleDayKey(boundary);
}

/** Minimum gap between start and delivery — 24 hours (next calendar day). */
export const BRIEF_SCHEDULE_MIN_GAP_DAYS = 1;

export function addBriefScheduleDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function getBriefMinDeliveryDate(start: Date): Date {
  return addBriefScheduleDays(start, BRIEF_SCHEDULE_MIN_GAP_DAYS);
}

export function getBriefMaxStartDate(delivery: Date): Date {
  return addBriefScheduleDays(delivery, -BRIEF_SCHEDULE_MIN_GAP_DAYS);
}

export function hasBriefScheduleMinGap(start: Date, delivery: Date): boolean {
  return !isBriefScheduleDayBefore(delivery, getBriefMinDeliveryDate(start));
}

export function validateBriefScheduleDates(
  scheduleStart: string,
  scheduleDelivery: string,
  locale: Locale
): { ok: true } | { ok: false; error: string } {
  if (!scheduleStart.trim()) {
    return { ok: false, error: locale === "zh" ? "请选择开始时间" : "Select a start date" };
  }
  if (!scheduleDelivery.trim()) {
    return { ok: false, error: locale === "zh" ? "请选择交付时间" : "Select a delivery date" };
  }

  const start = parseBriefScheduleDate(scheduleStart);
  const delivery = parseBriefScheduleDate(scheduleDelivery);
  if (!start || !delivery) {
    return { ok: false, error: locale === "zh" ? "日期格式无效" : "Invalid date format" };
  }
  if (!hasBriefScheduleMinGap(start, delivery)) {
    return {
      ok: false,
      error:
        locale === "zh"
          ? "交付时间须至少晚于开始时间 24 小时"
          : "Delivery must be at least 24 hours after the start date"
    };
  }
  return { ok: true };
}

export function briefScheduleRangeError(
  scheduleStart: string,
  scheduleDelivery: string,
  locale: Locale
): string | null {
  if (!scheduleStart.trim() || !scheduleDelivery.trim()) return null;
  const result = validateBriefScheduleDates(scheduleStart, scheduleDelivery, locale);
  return result.ok ? null : result.error;
}

export function validateBriefVideoDuration(
  videoDuration: string,
  videoDurationCustom: string,
  locale: Locale
): { ok: true } | { ok: false; error: string } {
  if (videoDuration !== "custom") return { ok: true };
  if (!videoDurationCustom.trim()) {
    return { ok: false, error: locale === "zh" ? "请填写自定义视频时长" : "Enter a custom video duration" };
  }
  return { ok: true };
}
