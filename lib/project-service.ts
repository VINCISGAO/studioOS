import { projectApplications, projects as seedProjects } from "@/lib/data";
import { campaignService } from "@/features/campaign/campaign.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";
import { canPersistLocalDataStore } from "@/lib/runtime-flags";
import { createSerializedStoreReader, writeJsonFileAtomic } from "@/lib/json-file-store-core";
import { getMemoryStore, readDataJson, dataStorePath } from "@/lib/serverless-store-core";
import { repairMissingProjects } from "@/lib/studioos/brand-store-repair";
import { appendProjectEvent } from "@/lib/project-events-service-core";
import type {
  CreateProjectDraftInput,
  CreateProjectInput,
  ProjectStore,
  StoredProject,
  StoredProjectApplication,
  UpdateProjectInput
} from "@/lib/project-types";
import {
  canPublishProject,
  normalizeCampaignStatus,
  validateProjectTransition,
  type CampaignProjectStatus,
  type ProjectActorRole,
  type ProjectEventName
} from "@/lib/studioos/project-status";
import { canDeleteProject } from "@/lib/studioos/brand-delete-policy";

const STORE_PATH = dataStorePath("project-store.json");

const DEMO_PROJECT_ID = "proj_demo_arc_nova";

function demoArcConfirmedBrief() {
  const fields = [
    { section: "基本信息", label: "品牌", value: "Arc & Alloy (brand)" },
    { section: "基本信息", label: "项目名称", value: "我的产品 Campaign" },
    { section: "广告目标", label: "广告目标", value: "为「My Product」制作 TikTok / Meta 效果广告，聚焦新品发布。" },
    { section: "交付规格", label: "品类", value: "CPG" },
    { section: "交付规格", label: "投放平台", value: "TikTok, Meta" },
    { section: "交付规格", label: "视频比例", value: "9:16" },
    { section: "交付规格", label: "交付数量", value: "1" },
    { section: "交付规格", label: "预算", value: "$300" },
    { section: "交付规格", label: "截止日期", value: "2026-07-05" },
    { section: "交付规格", label: "品牌风格", value: "Apple Minimal" },
    { section: "广告目标", label: "目标受众", value: "25-40，对高端护肤感兴趣的用户" },
    { section: "参考素材", label: "参考链接", value: "https://example.com/reference" },
    {
      section: "创意说明",
      label: "补充说明",
      value: "画面干净、灯光高级，产品特写需清晰，整体风格参考 Apple 产品广告。"
    }
  ];

  return {
    confirmed_at: "2026-06-01T14:00:00.000Z",
    fields,
    full_text: fields.map((item) => `${item.label}: ${item.value}`).join("\n")
  };
}

function applyDemoArcProjectFields(project: StoredProject) {
  project.title = "我的产品 Campaign";
  project.product_name = "My Product";
  project.category = "CPG";
  project.campaign_goal = "为「My Product」制作 TikTok / Meta 效果广告，聚焦新品发布。";
  project.target_platform = "TikTok, Meta";
  project.video_format = "9:16";
  project.video_count = 1;
  project.output_quantity = 1;
  project.budget_range = "$300";
  project.deadline = "2026-07-05";
  project.brand_style = "Apple Minimal";
  project.target_audience = "25-40，对高端护肤感兴趣的用户";
  project.reference_links = "https://example.com/reference";
  project.notes = "画面干净、灯光高级，产品特写需清晰，整体风格参考 Apple 产品广告。";
  project.settings_json = {
    ...(project.settings_json ?? {}),
    confirmed_brief: demoArcConfirmedBrief()
  };
}

function isDemoProjectDismissed(store: ProjectStore, id: string) {
  return store.dismissed_demo_ids?.includes(id) ?? false;
}

function dismissDemoProject(store: ProjectStore, id: string) {
  if (id !== DEMO_PROJECT_ID) return;
  if (!store.dismissed_demo_ids) store.dismissed_demo_ids = [];
  if (!store.dismissed_demo_ids.includes(id)) {
    store.dismissed_demo_ids.push(id);
  }
}

function tombstoneDeletedProject(store: ProjectStore, id: string) {
  store.deleted_project_ids ??= [];
  if (!store.deleted_project_ids.includes(id)) {
    store.deleted_project_ids.push(id);
  }
}

function applyDeletedProjectTombstones(store: ProjectStore): ProjectStore {
  if (!store.deleted_project_ids?.length) {
    return store;
  }
  const deleted = new Set(store.deleted_project_ids);
  return {
    ...store,
    projects: store.projects.filter((item) => !deleted.has(item.id))
  };
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function defaultProjectFields(
  partial: Partial<StoredProject> & Pick<StoredProject, "id" | "client_email" | "client_name" | "company_name">
): StoredProject {
  const title =
    partial.title ||
    partial.product_name ||
    partial.campaign_goal ||
    `${partial.company_name} Campaign`;

  return {
    org_id: partial.org_id ?? null,
    created_by: partial.created_by ?? null,
    title,
    status: partial.status ?? "draft",
    wizard_step: partial.wizard_step ?? 1,
    wizard_completed_steps: partial.wizard_completed_steps ?? [],
    visibility: partial.visibility ?? "invite_only",
    settings_json: partial.settings_json ?? {},
    product_url: partial.product_url ?? "",
    product_name: partial.product_name ?? "",
    commercial_objective: partial.commercial_objective ?? "",
    commercial_objective_note: partial.commercial_objective_note ?? "",
    category: partial.category ?? "",
    target_market: partial.target_market ?? [],
    target_audience: partial.target_audience ?? "",
    style_presets: partial.style_presets ?? [],
    video_lengths: partial.video_lengths ?? [],
    aspect_ratios: partial.aspect_ratios ?? [],
    output_quantity: partial.output_quantity ?? partial.video_count ?? 0,
    budget_range: partial.budget_range ?? "",
    budget_min: partial.budget_min ?? null,
    budget_max: partial.budget_max ?? null,
    deadline: partial.deadline ?? "",
    selected_studio_id: partial.selected_studio_id ?? null,
    published_at: partial.published_at ?? null,
    email: partial.email ?? "",
    target_platform: partial.target_platform ?? "",
    video_format: partial.video_format ?? "",
    video_count: partial.video_count ?? 0,
    brand_style: partial.brand_style ?? "",
    reference_links: partial.reference_links ?? "",
    campaign_goal: partial.campaign_goal ?? "",
    notes: partial.notes ?? "",
    updated_at: partial.updated_at ?? partial.created_at ?? nowIso(),
    created_at: partial.created_at ?? nowIso(),
    ...partial
  };
}

function migrateStoredProject(raw: Record<string, unknown>): StoredProject {
  const status = normalizeCampaignStatus(String(raw.status ?? "draft"));
  const videoCount = Number(raw.video_count ?? 0) || 0;

  return defaultProjectFields({
    id: String(raw.id),
    client_email: String(raw.client_email ?? "").toLowerCase(),
    client_name: String(raw.client_name ?? ""),
    company_name: String(raw.company_name ?? ""),
    org_id: (raw.org_id as string | null) ?? null,
    created_by: (raw.created_by as string | null) ?? null,
    title: String(raw.title ?? ""),
    status,
    wizard_step: Number(raw.wizard_step ?? (status === "draft" ? 1 : 6)),
    wizard_completed_steps: Array.isArray(raw.wizard_completed_steps)
      ? (raw.wizard_completed_steps as number[])
      : status === "draft"
        ? []
        : [1, 2, 3, 4, 5, 6],
    visibility: (raw.visibility as StoredProject["visibility"]) ?? "invite_only",
    settings_json: (raw.settings_json as Record<string, unknown>) ?? {},
    product_url: String(raw.product_url ?? ""),
    product_name: String(raw.product_name ?? ""),
    commercial_objective: (raw.commercial_objective as StoredProject["commercial_objective"]) ?? "",
    commercial_objective_note: String(raw.commercial_objective_note ?? ""),
    category: String(raw.category ?? ""),
    target_market: Array.isArray(raw.target_market) ? (raw.target_market as string[]) : [],
    target_audience: String(raw.target_audience ?? ""),
    style_presets: Array.isArray(raw.style_presets) ? (raw.style_presets as string[]) : [],
    video_lengths: Array.isArray(raw.video_lengths)
      ? (raw.video_lengths as string[])
      : raw.video_format
        ? [String(raw.video_format)]
        : [],
    aspect_ratios: Array.isArray(raw.aspect_ratios)
      ? (raw.aspect_ratios as string[])
      : raw.video_format
        ? [String(raw.video_format)]
        : [],
    output_quantity: Number(raw.output_quantity ?? videoCount) || videoCount,
    budget_range: String(raw.budget_range ?? ""),
    budget_min: raw.budget_min != null ? Number(raw.budget_min) : null,
    budget_max: raw.budget_max != null ? Number(raw.budget_max) : null,
    deadline: String(raw.deadline ?? ""),
    selected_studio_id: (raw.selected_studio_id as string | null) ?? null,
    published_at: (raw.published_at as string | null) ?? (status !== "draft" ? String(raw.created_at ?? nowIso()) : null),
    email: String(raw.email ?? ""),
    target_platform: String(raw.target_platform ?? ""),
    video_format: String(raw.video_format ?? ""),
    video_count: videoCount,
    brand_style: String(raw.brand_style ?? ""),
    reference_links: String(raw.reference_links ?? ""),
    campaign_goal: String(raw.campaign_goal ?? ""),
    notes: String(raw.notes ?? ""),
    updated_at: String(raw.updated_at ?? raw.created_at ?? nowIso()),
    created_at: String(raw.created_at ?? nowIso())
  });
}

function seedStore(): ProjectStore {
  const projects: StoredProject[] = seedProjects.map((item) =>
    migrateStoredProject({
      id: item.id,
      client_email: `${item.user_id}@seed.vincis.local`,
      client_name: item.company_name,
      company_name: item.company_name,
      email: item.email,
      product_url: item.product_url,
      category: item.category,
      target_platform: item.target_platform,
      video_format: item.video_format,
      video_count: item.video_count,
      budget_range: item.budget_range,
      deadline: item.deadline,
      brand_style: item.brand_style,
      reference_links: item.reference_links,
      campaign_goal: item.campaign_goal,
      notes: item.notes,
      status: item.status,
      created_at: item.created_at,
      product_name: item.company_name,
      title: item.campaign_goal
    })
  );

  const applications: StoredProjectApplication[] = projectApplications.map((item) => ({
    id: item.id,
    project_id: item.project_id,
    creator_id: item.creator_id,
    proposed_amount: item.proposed_amount,
    timeline: item.timeline,
    proposal: item.proposal,
    status: item.status,
    created_at: item.created_at
  }));

  return { projects, applications };
}

function ensureDemoArcNovaProject(store: ProjectStore): ProjectStore {
  if (isDemoProjectDismissed(store, DEMO_PROJECT_ID)) {
    return store;
  }

  // Docs/QA use this id for brand review demos — do not keep it tombstoned.
  if (store.deleted_project_ids?.includes(DEMO_PROJECT_ID)) {
    store.deleted_project_ids = store.deleted_project_ids.filter((id) => id !== DEMO_PROJECT_ID);
  }

  const project = store.projects.find((item) => item.id === DEMO_PROJECT_ID);

  if (!project) {
    store.projects.unshift(
      defaultProjectFields({
        id: DEMO_PROJECT_ID,
        client_email: "client.arc@studioos.test",
        client_name: "Arc & Alloy",
        company_name: "Arc & Alloy",
        email: "client.arc@studioos.test",
        title: "我的产品 Campaign",
        status: "in_review",
        wizard_step: 6,
        wizard_completed_steps: [1, 2, 3, 4, 5, 6],
        selected_studio_id: "creator_01",
        product_name: "My Product",
        product_url: "https://arcandalloy.example/products/my-product",
        category: "CPG",
        commercial_objective: "launch",
        campaign_goal: "为「My Product」制作 TikTok / Meta 效果广告，聚焦新品发布。",
        target_platform: "TikTok, Meta",
        video_format: "9:16",
        video_count: 1,
        output_quantity: 1,
        video_lengths: ["30s"],
        aspect_ratios: ["9:16"],
        style_presets: ["minimal"],
        budget_range: "$300",
        deadline: "2026-07-05",
        brand_style: "Apple Minimal",
        reference_links: "https://example.com/reference",
        notes: "画面干净、灯光高级，产品特写需清晰，整体风格参考 Apple 产品广告。",
        target_audience: "25-40，对高端护肤感兴趣的用户",
        settings_json: {
          confirmed_brief: demoArcConfirmedBrief()
        },
        published_at: "2026-06-28T10:00:00.000Z",
        created_at: "2026-06-28T09:00:00.000Z",
        updated_at: "2026-06-28T12:00:00.000Z"
      })
    );
    return store;
  }

  if (project.status === "matching" || project.status === "studio_selected" || project.status === "production") {
    project.status = "in_review";
    project.selected_studio_id = project.selected_studio_id ?? "creator_01";
    project.updated_at = nowIso();
  }

  applyDemoArcProjectFields(project);

  return store;
}

async function seedProjectStore(): Promise<ProjectStore> {
  let seeded = seedStore();
  seeded = ensureDemoArcNovaProject(seeded);
  return seeded;
}

async function readStoreInner(): Promise<ProjectStore> {
  const parsed = await readDataJson<{
    projects: Record<string, unknown>[];
    applications: StoredProjectApplication[];
    dismissed_demo_ids?: string[];
    deleted_project_ids?: string[];
  }>(
    STORE_PATH,
    seedProjectStore
  );
  let migrated = false;
  const projects = parsed.projects.map((item) => {
    const next = migrateStoredProject(item);
    if (JSON.stringify(item) !== JSON.stringify(next)) {
      migrated = true;
    }
    return next;
  });
  let store: ProjectStore = applyDeletedProjectTombstones({
    projects,
    applications: parsed.applications ?? [],
    dismissed_demo_ids: parsed.dismissed_demo_ids,
    deleted_project_ids: parsed.deleted_project_ids
  });
  const beforeDemo = store.projects.length;
  const beforeArcTitle = store.projects.find((item) => item.id === DEMO_PROJECT_ID)?.title;
  const beforeArcStatus = store.projects.find((item) => item.id === DEMO_PROJECT_ID)?.status;
  store = ensureDemoArcNovaProject(store);
  const repaired = await repairMissingProjects(store);
  store = repaired.store;
  const afterArcStatus = store.projects.find((item) => item.id === DEMO_PROJECT_ID)?.status;
  const afterArcTitle = store.projects.find((item) => item.id === DEMO_PROJECT_ID)?.title;
  if (
    migrated ||
    repaired.changed ||
    store.projects.length !== beforeDemo ||
    beforeArcStatus !== afterArcStatus ||
    beforeArcTitle !== afterArcTitle
  ) {
    mergeLatestProjectStore(store);
    await writeStore(store);
  }
  return applyDeletedProjectTombstones(store);
}

/** Avoid read/migrate writes clobbering concurrent create/update mutations. */
function mergeLatestProjectStore(store: ProjectStore) {
  const latest = getMemoryStore<ProjectStore>(STORE_PATH);
  if (!latest) return;

  if (latest.deleted_project_ids?.length) {
    const deleted = new Set(store.deleted_project_ids ?? []);
    for (const id of latest.deleted_project_ids) {
      deleted.add(id);
    }
    store.deleted_project_ids = [...deleted];
  }

  const deleted = new Set(store.deleted_project_ids ?? []);
  store.projects = store.projects.filter((item) => !deleted.has(item.id));

  const mergedIds = new Set(store.projects.map((item) => item.id));
  for (const project of latest.projects) {
    if (deleted.has(project.id) || mergedIds.has(project.id)) {
      continue;
    }
    store.projects.push(project);
    mergedIds.add(project.id);
  }

  if (latest.dismissed_demo_ids?.length) {
    const dismissed = new Set(store.dismissed_demo_ids ?? []);
    for (const id of latest.dismissed_demo_ids) {
      dismissed.add(id);
    }
    store.dismissed_demo_ids = [...dismissed];
  }
}

const readStore = createSerializedStoreReader(readStoreInner);

async function writeStore(store: ProjectStore) {
  await writeJsonFileAtomic(STORE_PATH, store);
  readStore.invalidate?.();
}

async function createProjectDraftInJsonStore(input: CreateProjectDraftInput): Promise<StoredProject> {
  const store = await readStore();
  const project = defaultProjectFields({
    id: createId("proj"),
    client_email: input.client_email.toLowerCase(),
    client_name: input.client_name,
    company_name: input.company_name,
    org_id: input.org_id ?? null,
    created_by: input.created_by ?? input.client_email.toLowerCase(),
    title: input.title ?? `${input.company_name} Campaign`,
    status: "draft",
    wizard_step: 1,
    wizard_completed_steps: [],
    email: input.client_email.toLowerCase(),
    settings_json: input.wizard_ephemeral ? { wizard_ephemeral: true } : {}
  });

  store.projects.unshift(project);
  await writeStore(store);
  try {
    await appendProjectEvent({
      project_id: project.id,
      event_name: "project.created",
      to_state: { status: project.status },
      actor_role: "brand",
      actor_id: project.created_by
    });
  } catch (error) {
    logger.error("createProjectDraft appendProjectEvent failed", {
      service: "project-service",
      projectId: project.id,
      error: error instanceof Error ? error.message : String(error)
    });
  }
  return project;
}

export async function createProjectDraft(input: CreateProjectDraftInput): Promise<StoredProject> {
  if (hasDatabaseUrl()) {
    let prismaError: unknown;
    try {
      const prismaProject = await campaignService.createBrandDraft(input);
      if (prismaProject) {
        return prismaProject;
      }
      logger.warn("createProjectDraft Prisma returned null, falling back to JSON store", {
        service: "project-service",
        email: input.client_email
      });
    } catch (error) {
      prismaError = error;
      logger.error("createProjectDraft Prisma failed, falling back to JSON store", {
        service: "project-service",
        email: input.client_email,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    if (!canPersistLocalDataStore()) {
      throw prismaError instanceof Error
        ? prismaError
        : new Error("Unable to create brand campaign draft in production database");
    }
  }

  return createProjectDraftInJsonStore(input);
}

/** Legacy start-flow: creates a published-ready project in matching. */
export async function createProject(input: CreateProjectInput): Promise<StoredProject> {
  if (hasDatabaseUrl()) {
    const draft = await createProjectDraft({
      client_email: input.client_email,
      client_name: input.client_name,
      company_name: input.company_name,
      title: input.title ?? (input.campaign_goal || input.company_name)
    });
    const updated = await updateProject(draft.id, {
      email: input.email,
      product_url: input.product_url,
      product_name: input.company_name,
      category: input.category,
      target_platform: input.target_platform,
      video_format: input.video_format,
      video_count: input.video_count,
      output_quantity: input.video_count,
      budget_range: input.budget_range,
      deadline: input.deadline,
      brand_style: input.brand_style,
      reference_links: input.reference_links,
      campaign_goal: input.campaign_goal,
      notes: input.notes,
      status: "matching",
      wizard_step: 6,
      wizard_completed_steps: [1, 2, 3, 4, 5, 6],
      published_at: nowIso(),
      video_lengths: input.video_format ? [input.video_format] : [],
      aspect_ratios: input.video_format ? [input.video_format] : []
    });
    return updated ?? draft;
  }

  const store = await readStore();
  const project = defaultProjectFields({
    id: createId("proj"),
    client_email: input.client_email.toLowerCase(),
    client_name: input.client_name,
    company_name: input.company_name,
    email: input.email,
    product_url: input.product_url,
    product_name: input.company_name,
    category: input.category,
    target_platform: input.target_platform,
    video_format: input.video_format,
    video_count: input.video_count,
    output_quantity: input.video_count,
    budget_range: input.budget_range,
    deadline: input.deadline,
    brand_style: input.brand_style,
    reference_links: input.reference_links,
    campaign_goal: input.campaign_goal,
    notes: input.notes,
    title: input.title ?? (input.campaign_goal || input.company_name),
    status: "matching",
    wizard_step: 6,
    wizard_completed_steps: [1, 2, 3, 4, 5, 6],
    published_at: nowIso(),
    video_lengths: input.video_format ? [input.video_format] : [],
    aspect_ratios: input.video_format ? [input.video_format] : []
  });

  store.projects.unshift(project);
  await writeStore(store);
  await appendProjectEvent({
    project_id: project.id,
    event_name: "project.publish",
    from_state: { status: "draft" },
    to_state: { status: "matching" },
    actor_role: "brand",
    actor_id: project.client_email
  });
  return project;
}

export async function getProject(id: string): Promise<StoredProject | null> {
  if (hasDatabaseUrl()) {
    const prismaProject = await campaignService.getByProjectOrCampaignId(id);
    if (prismaProject) {
      return prismaProject;
    }
  }

  const store = await readStore();
  return store.projects.find((item) => item.id === id) ?? null;
}

export async function updateProject(
  id: string,
  patch: UpdateProjectInput,
  options?: { action?: string; actorEmail?: string; skipActivity?: boolean }
): Promise<StoredProject | null> {
  if (hasDatabaseUrl()) {
    return campaignService.updateBrandProject(id, patch, options);
  }

  const store = await readStore();
  const project = store.projects.find((item) => item.id === id);
  if (!project) {
    return null;
  }

  Object.assign(project, patch, { updated_at: nowIso() });
  await writeStore(store);
  return project;
}

export async function completeWizardStep(
  projectId: string,
  step: number,
  actorEmail?: string
): Promise<StoredProject | null> {
  return completeWizardSteps(projectId, [step], actorEmail);
}

export async function completeWizardSteps(
  projectId: string,
  steps: number[],
  actorEmail?: string,
  options?: { skipActivity?: boolean }
): Promise<StoredProject | null> {
  if (steps.length === 0) {
    return getProject(projectId);
  }

  if (hasDatabaseUrl()) {
    return campaignService.completeBrandWizardSteps(projectId, steps, actorEmail, options);
  }

  const project = await getProject(projectId);
  if (!project) {
    return null;
  }

  const completed = new Set(project.wizard_completed_steps);
  for (const step of steps) {
    completed.add(step);
  }
  const maxStep = Math.max(...steps);
  const wizard_step = Math.max(project.wizard_step, Math.min(7, maxStep + 1));

  return updateProject(projectId, {
    wizard_completed_steps: [...completed].sort((a, b) => a - b),
    wizard_step
  });
}

export async function transitionProject(
  projectId: string,
  event: ProjectEventName,
  options?: {
    actor_id?: string | null;
    actor_role?: ProjectActorRole;
    metadata?: Record<string, unknown>;
    skipPreconditions?: boolean;
  }
): Promise<{ ok: true; project: StoredProject } | { ok: false; code: string; message: string }> {
  const project = await getProject(projectId);
  if (!project) {
    return { ok: false, code: "NOT_FOUND", message: "Project not found" };
  }

  if (event === "project.publish" && !options?.skipPreconditions) {
    const gate = canPublishProject({
      status: project.status,
      wizard_completed_steps: project.wizard_completed_steps
    });
    if (!gate.ok) {
      return {
        ok: false,
        code: "PRECONDITION_FAILED",
        message: `Missing: ${gate.missing.join(", ")}`
      };
    }
  }

  const result = validateProjectTransition(project.status, event);
  if (!result.ok) {
    return { ok: false, code: result.code, message: result.message };
  }

  const fromStatus = project.status;

  if (event === "project.publish" && hasDatabaseUrl()) {
    try {
      const published = await campaignService.publishBrandCampaign(projectId, {
        email: options?.actor_id ?? project.client_email,
        userId: null
      });
      if (published) {
        void appendProjectEvent({
          project_id: projectId,
          event_name: event,
          from_state: { status: fromStatus },
          to_state: { status: published.status },
          actor_id: options?.actor_id ?? null,
          actor_role: options?.actor_role ?? "system",
          metadata: options?.metadata ?? {}
        }).catch(() => undefined);
        return { ok: true, project: published };
      }
    } catch (error) {
      return {
        ok: false,
        code: "PRECONDITION_FAILED",
        message: error instanceof Error ? error.message : "Publish failed"
      };
    }
  }

  if (hasDatabaseUrl()) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Project transition requires legacy JSON store entry"
    };
  }

  const store = await readStore();
  const jsonProject = store.projects.find((item) => item.id === projectId);
  if (!jsonProject) {
    return { ok: false, code: "NOT_FOUND", message: "Project not found" };
  }

  const previousStatus = jsonProject.status;
  if (result.status !== previousStatus) {
    jsonProject.status = result.status;
  }

  if (event === "project.publish") {
    jsonProject.published_at = nowIso();
  }

  jsonProject.updated_at = nowIso();
  await writeStore(store);

  await appendProjectEvent({
    project_id: projectId,
    event_name: event,
    from_state: { status: previousStatus },
    to_state: { status: jsonProject.status },
    actor_id: options?.actor_id ?? null,
    actor_role: options?.actor_role ?? "system",
    metadata: options?.metadata ?? {}
  });

  return { ok: true, project: jsonProject };
}

export async function listOpenProjects(): Promise<StoredProject[]> {
  const store = await readStore();
  return store.projects.filter(
    (item) => !["completed", "cancelled", "delivered"].includes(item.status)
  );
}

export async function listProjectsForClient(clientEmail: string): Promise<StoredProject[]> {
  if (hasDatabaseUrl()) {
    const prismaProjects = await campaignService.listForClientEmail(clientEmail);
    if (prismaProjects.length > 0) {
      return prismaProjects;
    }
  }

  const store = await readStore();
  const normalized = clientEmail.toLowerCase();
  return store.projects
    .filter((item) => item.client_email.toLowerCase() === normalized)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export { canDeleteProject };

async function deletePrismaCampaignForClient(
  projectId: string,
  clientEmail: string
): Promise<{ ok: true } | { ok: false; code: "NOT_FOUND" | "FORBIDDEN" | "LOCKED"; message: string } | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  const { brandCampaignRepository } = await import(
    "@/features/campaign/brand-campaign/brand-campaign.repository"
  );
  const { readCampaignMemory, prismaStatusToProjectStatus } = await import(
    "@/features/campaign/brand-campaign/brand-campaign.utils"
  );

  const campaign = await brandCampaignRepository.findByLegacyProjectId(projectId);
  if (!campaign) {
    return null;
  }

  const normalized = clientEmail.toLowerCase();
  const memory = readCampaignMemory(campaign.campaignMemoryJson) as {
    client?: { email?: string };
  };
  const ownerEmail =
    memory.client?.email?.toLowerCase() ?? campaign.brand?.email?.toLowerCase() ?? "";

  if (ownerEmail !== normalized) {
    return { ok: false, code: "FORBIDDEN", message: "Project not owned by client" };
  }

  const status = prismaStatusToProjectStatus(campaign.status);
  if (!canDeleteProject(status)) {
    return {
      ok: false,
      code: "LOCKED",
      message: "Only draft or completed projects can be deleted"
    };
  }

  if (status === "payment_pending") {
    const { paymentRepository } = await import("@/features/payment/payment.repository");
    const { EscrowState } = await import("@/features/shared/state-machines/escrow.state-machine");
    const escrow = await paymentRepository.findByCampaignId(campaign.id);
    const funded =
      escrow?.status === EscrowState.HELD ||
      escrow?.status === EscrowState.PARTIAL_RELEASE ||
      escrow?.status === EscrowState.FULL_RELEASE;
    if (funded) {
      return {
        ok: false,
        code: "LOCKED",
        message: "Paid campaigns cannot be deleted"
      };
    }
  }

  await brandCampaignRepository.softDeleteCampaign(campaign.id);

  try {
    const store = await readStore();
    const jsonIndex = store.projects.findIndex(
      (item) => item.id === projectId && item.client_email.toLowerCase() === normalized
    );
    if (jsonIndex >= 0) {
      tombstoneDeletedProject(store, projectId);
      dismissDemoProject(store, projectId);
      store.projects.splice(jsonIndex, 1);
      await writeStore(store);
    }
  } catch {
    // Prisma is source of truth when configured.
  }

  try {
    const { deleteOrdersForProjectId } = await import("@/lib/order-service");
    await deleteOrdersForProjectId(projectId, normalized);
  } catch {
    // Best-effort order cleanup.
  }

  try {
    const { purgeProjectCampaignData } = await import("@/lib/campaign-store");
    await purgeProjectCampaignData(projectId);
  } catch {
    // Best-effort legacy store cleanup.
  }

  return { ok: true };
}

export async function deleteProjectForClient(
  projectId: string,
  clientEmail: string
): Promise<{ ok: true } | { ok: false; code: "NOT_FOUND" | "FORBIDDEN" | "LOCKED"; message: string }> {
  const prismaResult = await deletePrismaCampaignForClient(projectId, clientEmail);
  if (prismaResult) {
    return prismaResult;
  }

  const store = await readStore();
  const normalized = clientEmail.toLowerCase();
  const index = store.projects.findIndex(
    (item) => item.id === projectId && item.client_email.toLowerCase() === normalized
  );

  if (index < 0) {
    return { ok: false, code: "NOT_FOUND", message: "Project not found" };
  }

  const project = store.projects[index];

  if (!canDeleteProject(project.status)) {
    return {
      ok: false,
      code: "LOCKED",
      message: "Only draft or completed projects can be deleted"
    };
  }

  tombstoneDeletedProject(store, projectId);
  dismissDemoProject(store, projectId);
  store.projects.splice(index, 1);

  try {
    const { deleteOrdersForProjectId } = await import("@/lib/order-service");
    await deleteOrdersForProjectId(projectId, normalized);
  } catch {
    // Best-effort cleanup — tombstone prevents resurrection if orders remain.
  }

  await writeStore(store);

  try {
    const { purgeProjectCampaignData } = await import("@/lib/campaign-store");
    await purgeProjectCampaignData(projectId);
  } catch {
    // Best-effort cleanup — deletion already persisted.
  }

  try {
    await appendProjectEvent({
      project_id: projectId,
      event_name: "project.cancelled",
      from_state: { status: project.status },
      to_state: { status: "cancelled" },
      actor_role: "brand",
      actor_id: normalized,
      metadata: { deleted: true }
    });
  } catch {
    // Audit log failure must not block user deletion.
  }

  return { ok: true };
}

export async function listProjectsForOrg(orgId: string): Promise<StoredProject[]> {
  const store = await readStore();
  return store.projects.filter((item) => item.org_id === orgId);
}

export async function markProjectMatched(projectId: string) {
  await transitionProject(projectId, "project.studio_selected", {
    actor_role: "brand",
    skipPreconditions: true
  });
}

export async function createProjectApplication(input: {
  project_id: string;
  creator_id: string;
  proposed_amount: number;
  timeline: string;
  proposal: string;
}): Promise<StoredProjectApplication> {
  const store = await readStore();
  const existing = store.applications.find(
    (item) => item.project_id === input.project_id && item.creator_id === input.creator_id
  );

  if (existing) {
    return existing;
  }

  const application: StoredProjectApplication = {
    id: createId("app"),
    project_id: input.project_id,
    creator_id: input.creator_id,
    proposed_amount: input.proposed_amount,
    timeline: input.timeline,
    proposal: input.proposal.trim(),
    status: "submitted",
    created_at: nowIso()
  };

  store.applications.unshift(application);
  await writeStore(store);
  return application;
}

export async function listApplicationsForProject(projectId: string) {
  const store = await readStore();
  return store.applications.filter((item) => item.project_id === projectId);
}

export async function listApplicationsForCreator(creatorId: string) {
  const store = await readStore();
  return store.applications.filter((item) => item.creator_id === creatorId);
}

export async function findCampaignIdByMvpReviewProjectId(mvpProjectId: string): Promise<string | null> {
  const store = await readStore();
  const hit = store.projects.find((project) => {
    const linked = project.settings_json?.mvp_review_project_id;
    return typeof linked === "string" && linked === mvpProjectId;
  });
  if (hit) return hit.id;
  if (mvpProjectId === "proj_mvp_demo_01") {
    return DEMO_PROJECT_ID;
  }
  return null;
}

export { DEMO_PROJECT_ID };

export function projectHref(project: StoredProject): string {
  if (project.status === "draft") {
    return `/brand/projects/new?project=${project.id}&step=1`;
  }
  if (project.status === "matching") {
    return `/brand/projects/${project.id}?tab=match`;
  }
  if (["payment_pending", "contract_pending", "studio_selected", "proposal"].includes(project.status)) {
    return `/brand/projects/${project.id}/checkout`;
  }
  if (["in_review", "delivered"].includes(project.status)) {
    return `/brand/projects/${project.id}/review`;
  }
  if (project.status === "production") {
    return `/brand/projects/${project.id}?tab=production`;
  }
  return `/brand/projects/${project.id}`;
}

export function projectStatusLabel(status: CampaignProjectStatus, locale: "en" | "zh"): string {
  const labels: Record<"en" | "zh", Record<CampaignProjectStatus, string>> = {
    en: {
      draft: "Draft",
      matching: "Matching",
      studio_selected: "Studio selected",
      proposal: "Proposal",
      contract_pending: "Contract",
      payment_pending: "Awaiting payment",
      production: "In production",
      in_review: "In review",
      delivered: "Delivered",
      completed: "Completed",
      cancelled: "Cancelled",
      disputed: "Disputed"
    },
    zh: {
      draft: "草稿",
      matching: "匹配中",
      studio_selected: "已选创作者",
      proposal: "待确认方案",
      contract_pending: "待签约",
      payment_pending: "待付款",
      production: "制作中",
      in_review: "审片中",
      delivered: "已交付",
      completed: "已完成",
      cancelled: "已取消",
      disputed: "争议中"
    }
  };
  return labels[locale][status];
}

export function projectCta(project: StoredProject, locale: "en" | "zh"): string {
  if (project.status === "draft") {
    return locale === "zh" ? "继续设置" : "Continue setup";
  }
  if (project.status === "matching") {
    return locale === "zh" ? "查看匹配" : "View match";
  }
  if (project.status === "payment_pending") {
    return locale === "zh" ? "去付款" : "Pay now";
  }
  if (project.status === "production") {
    return locale === "zh" ? "查看制作" : "View production";
  }
  if (["in_review", "delivered"].includes(project.status)) {
    return locale === "zh" ? "进入审片室" : "Open review";
  }
  return locale === "zh" ? "打开项目" : "Open project";
}
