import { promises as fs } from "fs";
import path from "path";
import type { ProjectEventName, ProjectActorRole } from "@/lib/studioos/project-status";
import type { ProjectEventStore, StoredProjectEvent } from "@/lib/project-types";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "project-events-store.json");

function createId() {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): ProjectEventStore {
  return { events: [] };
}

async function readStore(): Promise<ProjectEventStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as ProjectEventStore;
  } catch {
    const seeded = emptyStore();
    await writeStore(seeded);
    return seeded;
  }
}

async function writeStore(store: ProjectEventStore) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  const tempPath = `${STORE_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tempPath, STORE_PATH);
}

export async function appendProjectEvent(input: {
  project_id: string;
  event_name: ProjectEventName | string;
  entity_type?: StoredProjectEvent["entity_type"];
  entity_id?: string | null;
  from_state?: Record<string, unknown> | null;
  to_state?: Record<string, unknown> | null;
  actor_id?: string | null;
  actor_role?: ProjectActorRole;
  metadata?: Record<string, unknown>;
}): Promise<StoredProjectEvent> {
  const store = await readStore();
  const event: StoredProjectEvent = {
    id: createId(),
    project_id: input.project_id,
    entity_type: input.entity_type ?? "project",
    entity_id: input.entity_id ?? null,
    event_name: input.event_name,
    from_state: input.from_state ?? null,
    to_state: input.to_state ?? null,
    actor_id: input.actor_id ?? null,
    actor_role: input.actor_role ?? "system",
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString()
  };

  store.events.unshift(event);
  await writeStore(store);
  return event;
}

export async function listProjectEvents(projectId: string): Promise<StoredProjectEvent[]> {
  const store = await readStore();
  return store.events
    .filter((item) => item.project_id === projectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
