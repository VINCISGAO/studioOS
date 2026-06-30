import { writeDataJson, dataStorePath, readDataJson } from "@/lib/serverless-store";
import type {
  CreativeDnaProfile,
  CreativePerformanceRecord,
  PerformanceStore,
  StoredCreativeInsight
} from "@/lib/studioos/creative-performance-types";
import { generateInsightsForOrg } from "@/lib/studioos/insight-engine";
import { buildDnaProfile } from "@/lib/studioos/creative-dna-service";

const STORE_PATH = dataStorePath("creative-performance-store.json");

const DEMO_ORG_BRIGHT = "client.bright@studioos.test";
const DEMO_ORG_ARC = "client.arc@studioos.test";

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): PerformanceStore {
  return { records: [], insights: [], dna_profiles: [] };
}

function seedRecords(): CreativePerformanceRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: "perf_demo_bright_v1",
      org_id: DEMO_ORG_BRIGHT,
      project_id: null,
      order_id: "ord_demo_nova_active",
      deliverable_id: "del_demo_nova_v1",
      deliverable_version: 1,
      name: "CPG product demo — v1",
      tags: {
        hook_type: "first_person",
        length_sec: 15,
        aspect_ratio: "9:16",
        style_presets: ["ugc", "cinematic"],
        studio_id: "creator_01",
        category: "CPG"
      },
      platform: "tiktok",
      platform_ad_id: "tiktok_ad_demo_001",
      platform_campaign_id: "camp_bright_summer",
      spend_usd: 420,
      impressions: 82000,
      metrics: {
        ctr: 2.8,
        hook_score: 82,
        completion_rate: 51,
        watch_time_sec: 8.4,
        engagement_rate: 5.6,
        conversion_rate: 2.1,
        roas: 2.4
      },
      synced_at: now,
      window: "30d"
    },
    {
      id: "perf_demo_bright_v0",
      org_id: DEMO_ORG_BRIGHT,
      project_id: null,
      order_id: "ord_demo_nova_completed",
      deliverable_id: "del_demo_nova_old",
      deliverable_version: 1,
      name: "Beauty hero — product macro",
      tags: {
        hook_type: "product_macro",
        length_sec: 30,
        aspect_ratio: "9:16",
        style_presets: ["cinematic", "minimal"],
        studio_id: "creator_01",
        category: "Beauty"
      },
      platform: "meta",
      platform_ad_id: "meta_ad_demo_002",
      platform_campaign_id: "camp_bright_beauty",
      spend_usd: 680,
      impressions: 54000,
      metrics: {
        ctr: 1.6,
        hook_score: 68,
        completion_rate: 38,
        watch_time_sec: 6.2,
        engagement_rate: 3.4,
        conversion_rate: 1.4,
        roas: 1.6
      },
      synced_at: now,
      window: "30d"
    },
    {
      id: "perf_demo_arc_v1",
      org_id: DEMO_ORG_ARC,
      project_id: "proj_demo_arc_nova",
      order_id: "ord_demo_arc_review",
      deliverable_id: "del_demo_arc_v1",
      deliverable_version: 1,
      name: "Travel case launch — v1",
      tags: {
        hook_type: "ugc_handheld",
        length_sec: 15,
        aspect_ratio: "9:16",
        style_presets: ["ugc", "minimal"],
        studio_id: "creator_01",
        category: "Consumer tech"
      },
      platform: "tiktok",
      platform_ad_id: "tiktok_ad_demo_arc",
      platform_campaign_id: "camp_arc_launch",
      spend_usd: 1200,
      impressions: 120000,
      metrics: {
        ctr: 3.2,
        hook_score: 88,
        completion_rate: 54,
        watch_time_sec: 9.1,
        engagement_rate: 6.8,
        conversion_rate: 2.4,
        roas: 3.1
      },
      synced_at: now,
      window: "30d"
    }
  ];
}

async function writeStore(store: PerformanceStore) {
  await writeDataJson(STORE_PATH, store);
}

async function refreshOrgIntelligence(store: PerformanceStore, orgId: string) {
  const records = store.records.filter((item) => item.org_id === orgId);
  const insights = generateInsightsForOrg(orgId, records);
  store.insights = store.insights.filter((item) => item.org_id !== orgId).concat(insights);

  const dna = buildDnaProfile(orgId, records, insights);
  const index = store.dna_profiles.findIndex((item) => item.org_id === orgId);
  if (index >= 0) {
    store.dna_profiles[index] = dna;
  } else {
    store.dna_profiles.push(dna);
  }
}

function ensureDemoStore(store: PerformanceStore): PerformanceStore {
  if (store.records.some((item) => item.id === "perf_demo_bright_v1")) {
    return store;
  }

  store.records.push(...seedRecords());
  for (const orgId of [DEMO_ORG_BRIGHT, DEMO_ORG_ARC]) {
    refreshOrgIntelligence(store, orgId);
  }
  return store;
}

async function readStore(): Promise<PerformanceStore> {
  const store = await readDataJson<PerformanceStore>(STORE_PATH, () => ensureDemoStore(emptyStore()));
  const before = store.records.length;
  const next = ensureDemoStore(store);
  if (next.records.length !== before) {
    await writeStore(next);
  }
  return next;
}

export function orgIdFromEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function listPerformanceForOrg(orgId: string): Promise<CreativePerformanceRecord[]> {
  const store = await readStore();
  return store.records
    .filter((item) => item.org_id === orgId)
    .sort((a, b) => new Date(b.synced_at).getTime() - new Date(a.synced_at).getTime());
}

export async function listPerformanceForProject(projectId: string): Promise<CreativePerformanceRecord[]> {
  const store = await readStore();
  return store.records.filter((item) => item.project_id === projectId);
}

export async function listPerformanceForOrder(orderId: string): Promise<CreativePerformanceRecord[]> {
  const store = await readStore();
  return store.records.filter((item) => item.order_id === orderId);
}

export async function getInsightsForOrg(orgId: string): Promise<StoredCreativeInsight[]> {
  const store = await readStore();
  return store.insights
    .filter((item) => item.org_id === orgId)
    .sort((a, b) => b.lift_pct - a.lift_pct);
}

export async function getDnaProfile(orgId: string): Promise<CreativeDnaProfile | null> {
  const store = await readStore();
  return store.dna_profiles.find((item) => item.org_id === orgId) ?? null;
}

export async function upsertPerformanceRecord(
  input: Omit<CreativePerformanceRecord, "id" | "synced_at"> & { id?: string }
): Promise<CreativePerformanceRecord> {
  const store = await readStore();
  const record: CreativePerformanceRecord = {
    ...input,
    id: input.id ?? createId("perf"),
    synced_at: new Date().toISOString()
  };

  const index = store.records.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    store.records[index] = record;
  } else {
    store.records.unshift(record);
  }

  await refreshOrgIntelligence(store, record.org_id);
  await writeStore(store);
  return record;
}

export async function bindDeliverablePerformance(input: {
  org_id: string;
  order_id: string;
  deliverable_id: string;
  deliverable_version: number;
  project_id?: string | null;
  name: string;
  platform: CreativePerformanceRecord["platform"];
  platform_ad_id: string;
  platform_campaign_id?: string;
  studio_id: string;
  category: string;
  hook_type: CreativePerformanceRecord["tags"]["hook_type"];
  length_sec: number;
  aspect_ratio: string;
  style_presets: string[];
  metrics: CreativePerformanceRecord["metrics"];
  spend_usd?: number;
  impressions?: number;
  source_type?: CreativePerformanceRecord["source_type"];
  upload_file_name?: string;
  ai_summary?: CreativePerformanceRecord["ai_summary"];
  ai_insights?: CreativePerformanceRecord["ai_insights"];
  campaign_recommendations?: CreativePerformanceRecord["campaign_recommendations"];
  analysis_source?: CreativePerformanceRecord["analysis_source"];
}): Promise<CreativePerformanceRecord> {
  const store = await readStore();
  const existing = store.records.find(
    (item) => item.deliverable_id === input.deliverable_id && item.order_id === input.order_id
  );

  return upsertPerformanceRecord({
    id: existing?.id,
    org_id: input.org_id,
    project_id: input.project_id ?? null,
    order_id: input.order_id,
    deliverable_id: input.deliverable_id,
    deliverable_version: input.deliverable_version,
    name: input.name,
    tags: {
      hook_type: input.hook_type,
      length_sec: input.length_sec,
      aspect_ratio: input.aspect_ratio,
      style_presets: input.style_presets,
      studio_id: input.studio_id,
      category: input.category
    },
    platform: input.platform,
    platform_ad_id: input.platform_ad_id,
    platform_campaign_id: input.platform_campaign_id ?? "",
    spend_usd: input.spend_usd ?? 0,
    impressions: input.impressions ?? 0,
    metrics: input.metrics,
    window: "30d",
    source_type: input.source_type,
    upload_file_name: input.upload_file_name,
    ai_summary: input.ai_summary,
    ai_insights: input.ai_insights,
    campaign_recommendations: input.campaign_recommendations,
    analysis_source: input.analysis_source
  });
}

export async function refreshOrgIntelligenceStore(orgId: string) {
  const store = await readStore();
  await refreshOrgIntelligence(store, orgId);
  await writeStore(store);
  return {
    insights: store.insights.filter((item) => item.org_id === orgId),
    dna: store.dna_profiles.find((item) => item.org_id === orgId) ?? null
  };
}
