import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { campaignAssetService } from "@/features/campaign/campaign-asset.service";
import { campaignService } from "@/features/campaign/campaign.service";
import { detectReferenceType } from "@/lib/campaign/reference-type";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type {
  CampaignStore,
  PackItemType,
  ProjectAssetType,
  StoredCreativeBrief,
  StoredCreativePackItem,
  StoredProjectAsset,
  StoredProjectReference
} from "@/lib/campaign-types";
import type { StoredProject } from "@/lib/project-types";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "campaign-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): CampaignStore {
  return { assets: [], references: [], briefs: [], pack_items: [] };
}

function normalizeStore(parsed: Partial<CampaignStore> | null | undefined): CampaignStore {
  return {
    assets: parsed?.assets ?? [],
    references: parsed?.references ?? [],
    briefs: parsed?.briefs ?? [],
    pack_items: parsed?.pack_items ?? []
  };
}

async function readStore(): Promise<CampaignStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = normalizeStore(JSON.parse(raw) as Partial<CampaignStore>);
    const next = ensureDemoBrandGuideAsset(parsed);
    if (next.assets.length !== parsed.assets.length) {
      await writeStore(next);
    }
    return next;
  } catch {
    const seeded = ensureDemoBrandGuideAsset(normalizeStore(emptyStore()));
    await writeStore(seeded);
    return seeded;
  }
}

function ensureDemoBrandGuideAsset(store: CampaignStore): CampaignStore {
  const projectId = "proj_demo_arc_nova";
  if (store.assets.some((item) => item.project_id === projectId && item.type === "brand_guide")) {
    return store;
  }

  store.assets.unshift({
    id: "asset_demo_brand_guide",
    project_id: projectId,
    type: "brand_guide",
    file_name: "Brand_Guideline_ArcAlloy.pdf",
    file_url: `/api/projects/${projectId}/brief.pdf?lang=zh&download=1`,
    mime_type: "application/pdf",
    size_bytes: 2516582,
    created_at: "2026-06-01T14:00:00.000Z"
  });

  return store;
}

async function writeStore(store: CampaignStore) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  const tempPath = `${STORE_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tempPath, STORE_PATH);
}

export { detectReferenceType } from "@/lib/campaign/reference-type";

export async function listAssetsForProject(projectId: string): Promise<StoredProjectAsset[]> {
  if (hasDatabaseUrl()) {
    const prismaId = await campaignService.resolveLegacyCampaignId(projectId);
    if (prismaId) {
      return campaignService.listBrandAssets(projectId);
    }
  }

  const store = await readStore();
  return store.assets.filter((item) => item.project_id === projectId);
}

export async function listReferencesForProject(projectId: string): Promise<StoredProjectReference[]> {
  if (hasDatabaseUrl()) {
    const prismaId = await campaignService.resolveLegacyCampaignId(projectId);
    if (prismaId) {
      return campaignService.listBrandReferences(projectId);
    }
  }

  const store = await readStore();
  return store.references
    .filter((item) => item.project_id === projectId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function addProjectAsset(input: {
  project_id: string;
  type: ProjectAssetType;
  file_url: string;
  file_name?: string;
}): Promise<StoredProjectAsset> {
  if (hasDatabaseUrl()) {
    const prismaAsset = await campaignAssetService.addLegacyProjectAsset({
      legacyProjectId: input.project_id,
      type: input.type,
      file_url: input.file_url,
      file_name: input.file_name
    });
    if (prismaAsset) {
      return prismaAsset;
    }
  }

  const store = await readStore();
  if (input.type === "logo") {
    store.assets = store.assets.filter(
      (item) => !(item.project_id === input.project_id && item.type === "logo")
    );
  }
  if (input.type === "brand_guide") {
    store.assets = store.assets.filter(
      (item) => !(item.project_id === input.project_id && item.type === "brand_guide")
    );
  }
  if (input.type === "product_image") {
    store.assets = store.assets.filter(
      (item) => !(item.project_id === input.project_id && item.type === "product_image")
    );
  }
  if (input.type === "product_image_original") {
    store.assets = store.assets.filter(
      (item) => !(item.project_id === input.project_id && item.type === "product_image_original")
    );
  }

  const asset: StoredProjectAsset = {
    id: createId("asset"),
    project_id: input.project_id,
    type: input.type,
    file_name: input.file_name ?? input.file_url.split("/").pop() ?? "asset",
    file_url: input.file_url.trim(),
    mime_type: "image/jpeg",
    size_bytes: 0,
    created_at: new Date().toISOString()
  };

  store.assets.unshift(asset);
  await writeStore(store);
  return asset;
}

export async function removeProjectAsset(assetId: string, projectId: string) {
  if (hasDatabaseUrl()) {
    const prismaId = await campaignService.resolveLegacyCampaignId(projectId);
    if (prismaId) {
      await campaignAssetService.removeLegacyProjectAsset(assetId, projectId);
      return;
    }
  }

  const store = await readStore();
  store.assets = store.assets.filter((item) => !(item.id === assetId && item.project_id === projectId));
  await writeStore(store);
}

export async function addProjectReference(input: {
  project_id: string;
  source_url: string;
  note?: string;
}): Promise<StoredProjectReference | null> {
  const url = input.source_url.trim();
  if (!url) {
    return null;
  }

  if (hasDatabaseUrl()) {
    const prismaRef = await campaignAssetService.addLegacyProjectReference({
      legacyProjectId: input.project_id,
      source_url: url,
      note: input.note
    });
    if (prismaRef) {
      return prismaRef;
    }
  }

  const store = await readStore();
  const existing = store.references.find(
    (item) => item.project_id === input.project_id && item.source_url === url
  );
  if (existing) {
    return existing;
  }

  const type = detectReferenceType(url);
  const ref: StoredProjectReference = {
    id: createId("ref"),
    project_id: input.project_id,
    type,
    source_url: url,
    note: input.note?.trim() ?? "",
    platform: type,
    sort_order: store.references.filter((item) => item.project_id === input.project_id).length,
    created_at: new Date().toISOString()
  };

  store.references.unshift(ref);
  await writeStore(store);
  return ref;
}

export async function removeProjectReference(refId: string, projectId: string) {
  if (hasDatabaseUrl()) {
    const prismaId = await campaignService.resolveLegacyCampaignId(projectId);
    if (prismaId) {
      await campaignAssetService.removeLegacyProjectReference(refId, projectId);
      return;
    }
  }

  const store = await readStore();
  store.references = store.references.filter(
    (item) => !(item.id === refId && item.project_id === projectId)
  );
  await writeStore(store);
}

export async function getCreativeBrief(projectId: string): Promise<StoredCreativeBrief | null> {
  if (hasDatabaseUrl()) {
    const prismaId = await campaignService.resolveLegacyCampaignId(projectId);
    if (prismaId) {
      return campaignService.getBrandCreativeBrief(projectId);
    }
  }

  const store = await readStore();
  return (
    store.briefs
      .filter((item) => item.project_id === projectId)
      .sort((a, b) => b.version - a.version)[0] ?? null
  );
}

export function buildTemplateBrief(project: StoredProject, referenceCount: number): StoredCreativeBrief {
  const product = project.product_name || project.company_name;
  const objective = project.commercial_objective || project.campaign_goal || "launch";
  const summary = `Launch a ${objective}-focused commercial for ${product}. Style aligns to ${project.style_presets.join(", ") || project.brand_style || "premium minimal"}. Optimized for ${project.aspect_ratios.join(", ") || "9:16"} short-form placements.`;

  return {
    id: createId("brief"),
    project_id: project.id,
    version: 1,
    visual_style: `${project.brand_style || "Clean premium product cinematography"} with ${project.category || "DTC"} category cues.`,
    editing_rhythm: "Fast hook in 0–2s, product hero 2–8s, benefit stack, CTA end card.",
    color_palette: { primary: ["#0A0A0A", "#F5F5F0", "#C8A96E"], mood: "Premium, controlled contrast" },
    camera_language: "Macro product details, slow push-ins, shallow depth of field.",
    music_style: "Minimal electronic pulse, subtle rise into CTA.",
    subtitle_style: "Bold sans-serif lower-third, 2 lines max, high contrast.",
    hook_style: "Pattern interrupt + product reveal within first second.",
    brand_tone: project.brand_style || "Confident, modern, conversion-oriented",
    target_audience: project.target_audience || "Performance-minded brand teams and paid social buyers",
    commercial_objective: String(objective),
    competitor_style: "Avoid generic UGC; lean cinematic with clear product education.",
    executive_summary: summary,
    full_brief_md: `# Creative Brief — ${product}\n\n${summary}\n\n## References analyzed\n${referenceCount} reference(s) inform pacing and hook structure.\n\n## Deliverables\n${project.output_quantity || project.video_count} video(s), ${project.video_lengths.join(", ") || "30s"}, ${project.aspect_ratios.join(", ") || "9:16"}.`,
    confidence_score: referenceCount >= 2 ? 0.82 : 0.65,
    ai_model: "template",
    created_at: new Date().toISOString()
  };
}

export async function ensureCreativeBrief(project: StoredProject): Promise<StoredCreativeBrief> {
  if (hasDatabaseUrl()) {
    const prismaId = await campaignService.resolveLegacyCampaignId(project.id);
    if (prismaId) {
      const existing = await campaignService.getBrandCreativeBrief(project.id);
      if (existing) {
        return existing;
      }
      const refs = await campaignService.listBrandReferences(project.id);
      const brief = buildTemplateBrief(project, refs.length);
      await campaignService.saveBrandCreativeBrief(project.id, brief);
      return brief;
    }
  }

  const store = await readStore();
  const existing = store.briefs.find((item) => item.project_id === project.id);
  if (existing) {
    return existing;
  }

  const refs = store.references.filter((item) => item.project_id === project.id);
  const brief = buildTemplateBrief(project, refs.length);
  store.briefs.unshift(brief);
  await writeStore(store);
  return brief;
}

export async function listPackItems(projectId: string): Promise<StoredCreativePackItem[]> {
  const store = await readStore();
  return store.pack_items.filter((item) => item.project_id === projectId);
}

export async function getPackItem(
  projectId: string,
  type: PackItemType
): Promise<StoredCreativePackItem | null> {
  const items = await listPackItems(projectId);
  return items.filter((item) => item.type === type).sort((a, b) => b.version - a.version)[0] ?? null;
}

function buildPackItems(project: StoredProject, brief: StoredCreativeBrief): StoredCreativePackItem[] {
  const now = new Date().toISOString();
  const qty = project.output_quantity || project.video_count || 3;
  const length = project.video_lengths[0] || "30s";

  return [
    {
      id: createId("pack"),
      project_id: project.id,
      type: "brief",
      content_json: { markdown: brief.full_brief_md, summary: brief.executive_summary },
      version: 1,
      ai_generated: true,
      human_edited: false,
      created_at: now,
      updated_at: now
    },
    {
      id: createId("pack"),
      project_id: project.id,
      type: "storyboard",
      content_json: {
        scenes: Array.from({ length: Math.min(qty, 3) }).map((_, index) => ({
          id: `scene_${index + 1}`,
          shot: index === 0 ? "Hook — product reveal" : index === 1 ? "Benefit montage" : "CTA end card",
          duration: index === 0 ? "3s" : "5s",
          transition: "cut",
          prompt: `${brief.visual_style} — scene ${index + 1}`
        }))
      },
      version: 1,
      ai_generated: true,
      human_edited: false,
      created_at: now,
      updated_at: now
    },
    {
      id: createId("pack"),
      project_id: project.id,
      type: "script",
      content_json: {
        lines: [
          { speaker: "VO", text: "Meet the upgrade your routine was missing.", timing: "0:00-0:02" },
          { speaker: "VO", text: "Engineered for results you can see in the first week.", timing: "0:02-0:08" },
          { speaker: "VO", text: "Shop now — limited launch offer.", timing: "0:08-0:10" }
        ],
        length
      },
      version: 1,
      ai_generated: true,
      human_edited: false,
      created_at: now,
      updated_at: now
    }
  ];
}

export async function ensureCreativePack(project: StoredProject): Promise<StoredCreativePackItem[]> {
  const store = await readStore();
  const existing = store.pack_items.filter((item) => item.project_id === project.id);
  if (existing.some((item) => item.type === "storyboard") && existing.some((item) => item.type === "script")) {
    return existing;
  }

  const brief = (await getCreativeBrief(project.id)) ?? buildTemplateBrief(project, 0);
  const items = buildPackItems(project, brief);
  store.pack_items = store.pack_items.filter((item) => item.project_id !== project.id);
  store.pack_items.unshift(...items);
  await writeStore(store);
  return items;
}

export async function updatePackItemContent(
  projectId: string,
  type: PackItemType,
  content_json: Record<string, unknown>
): Promise<StoredCreativePackItem | null> {
  const store = await readStore();
  const item = store.pack_items.find((entry) => entry.project_id === projectId && entry.type === type);
  if (!item) {
    return null;
  }

  item.content_json = content_json;
  item.human_edited = true;
  item.version += 1;
  item.updated_at = new Date().toISOString();
  await writeStore(store);
  return item;
}

export async function countReferences(projectId: string) {
  if (hasDatabaseUrl()) {
    const prismaId = await campaignService.resolveLegacyCampaignId(projectId);
    if (prismaId) {
      const refs = await campaignService.listBrandReferences(projectId);
      return refs.length;
    }
  }

  const store = await readStore();
  return store.references.filter((item) => item.project_id === projectId).length;
}

export async function countProductImages(projectId: string) {
  const store = await readStore();
  return store.assets.filter(
    (item) => item.project_id === projectId && item.type === "product_image"
  ).length;
}

export async function purgeProjectCampaignData(projectId: string) {
  const store = await readStore();
  store.assets = store.assets.filter((item) => item.project_id !== projectId);
  store.references = store.references.filter((item) => item.project_id !== projectId);
  store.briefs = store.briefs.filter((item) => item.project_id !== projectId);
  store.pack_items = store.pack_items.filter((item) => item.project_id !== projectId);
  await writeStore(store);
}

export async function hasLogo(projectId: string) {
  const store = await readStore();
  return store.assets.some((item) => item.project_id === projectId && item.type === "logo");
}

export async function hasProductVisual(projectId: string) {
  if (hasDatabaseUrl()) {
    const prismaId = await campaignService.resolveLegacyCampaignId(projectId);
    if (prismaId) {
      return campaignAssetService.hasLegacyProductVisual(projectId);
    }
  }

  const store = await readStore();
  return store.assets.some(
    (item) =>
      item.project_id === projectId &&
      (item.type === "product_image" || item.type === "product_image_original")
  );
}
