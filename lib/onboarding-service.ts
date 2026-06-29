import { promises as fs } from "fs";
import path from "path";
import type {
  CreateApplicationInput,
  CreatorApplication,
  OnboardingStore
} from "@/lib/onboarding-types";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "onboarding-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): OnboardingStore {
  return { applications: [] };
}

async function readStore(): Promise<OnboardingStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as OnboardingStore;
  } catch {
    const seeded = emptyStore();
    await writeStore(seeded);
    return seeded;
  }
}

async function writeStore(store: OnboardingStore) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  const tempPath = `${STORE_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tempPath, STORE_PATH);
}

export async function createApplication(input: CreateApplicationInput): Promise<CreatorApplication> {
  const store = await readStore();
  const application: CreatorApplication = {
    id: createId("app"),
    studio_name: input.studio_name,
    email: input.email.toLowerCase(),
    country: input.country,
    portfolio_url: input.portfolio_url,
    specialties: input.specialties,
    tools: input.tools,
    base_price: input.base_price,
    delivery_speed: input.delivery_speed,
    notes: input.notes,
    status: "pending",
    created_at: new Date().toISOString(),
    reviewed_at: null
  };

  store.applications.unshift(application);
  await writeStore(store);
  return application;
}

export async function getApplication(id: string): Promise<CreatorApplication | null> {
  const store = await readStore();
  return store.applications.find((item) => item.id === id) ?? null;
}

export async function listApplications(status?: CreatorApplication["status"]): Promise<CreatorApplication[]> {
  const store = await readStore();
  return store.applications
    .filter((item) => (status ? item.status === status : true))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function approveApplication(id: string): Promise<CreatorApplication | null> {
  const store = await readStore();
  const application = store.applications.find((item) => item.id === id);
  if (!application || application.status !== "pending") {
    return null;
  }

  application.status = "approved";
  application.reviewed_at = new Date().toISOString();
  await writeStore(store);
  return application;
}

export async function rejectApplication(id: string): Promise<CreatorApplication | null> {
  const store = await readStore();
  const application = store.applications.find((item) => item.id === id);
  if (!application || application.status !== "pending") {
    return null;
  }

  application.status = "rejected";
  application.reviewed_at = new Date().toISOString();
  await writeStore(store);
  return application;
}
