import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { StoredProject } from "@/lib/project-types";

type StoredQuestionnaire = Partial<BriefFormState> & {
  refined_brief?: BriefFormState["refined"];
};

function normalizeVideoDuration(value: unknown, fallback: string) {
  const raw = String(value ?? fallback);
  return raw === "6s" || raw === "10s" ? "15s" : raw;
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
    resolution: String(source.resolution ?? defaults.resolution),
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
    creativeStyles: parseCommaList(formData.get("creativeStyles")),
    creativeStyleCustom: String(formData.get("creativeStyleCustom") ?? "").trim(),
    creativeTones: parseCommaList(formData.get("creativeTones")),
    creativeToneCustom: String(formData.get("creativeToneCustom") ?? "").trim(),
    audienceAge: String(formData.get("audienceAge") ?? defaults.audienceAge),
    audienceRegion: String(formData.get("audienceRegion") ?? defaults.audienceRegion),
    audienceGender:
      genderRaw === "male" || genderRaw === "female" ? genderRaw : defaults.audienceGender,
    resolution: String(formData.get("resolution") ?? defaults.resolution),
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
