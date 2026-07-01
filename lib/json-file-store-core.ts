import path from "node:path";
import { canPersistLocalDataStore } from "@/lib/can-persist-local-store";
import { safeReadJsonFile } from "@/lib/core/safe-json-core";
import { getMemoryStore, writeDataJson, cacheDataJson } from "@/lib/serverless-store-core";

const queues = new Map<string, Promise<unknown>>();

/** Node-safe JSON file store — no server-only guard (for verify scripts). */

function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const prev = queues.get(key) ?? Promise.resolve();
  const next = prev
    .catch(() => undefined)
    .then(task)
    .finally(() => {
      if (queues.get(key) === next) {
        queues.delete(key);
      }
    });
  queues.set(key, next);
  return next;
}

async function readJsonFromDisk<T>(filePath: string): Promise<T | null> {
  return safeReadJsonFile<T | null>(filePath, null);
}

function bundledSeedPath(fileName: string) {
  return path.join(process.cwd(), "seed", fileName);
}

/** Serialize writes per file; on Vercel updates in-memory store only. */
export async function writeJsonFileAtomic(filePath: string, data: unknown): Promise<void> {
  return enqueue(`write:${filePath}`, async () => {
    await writeDataJson(filePath, data);
  });
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  const fromMemory = getMemoryStore<T>(filePath);
  if (fromMemory != null) {
    return fromMemory;
  }

  if (canPersistLocalDataStore()) {
    const fromDisk = await readJsonFromDisk<T>(filePath);
    if (fromDisk != null) {
      cacheDataJson(filePath, fromDisk);
      return fromDisk;
    }
  }

  const fromSeed = await readJsonFromDisk<T>(bundledSeedPath(path.basename(filePath)));
  if (fromSeed != null) {
    cacheDataJson(filePath, fromSeed);
  }
  return fromSeed;
}

type SerializedStoreReader<T> = (() => Promise<T>) & {
  invalidate: () => void;
};

/** Coalesce concurrent read/seed operations for the same store file. */
export function createSerializedStoreReader<T>(readInner: () => Promise<T>): SerializedStoreReader<T> {
  let inFlight: Promise<T> | null = null;

  async function read(): Promise<T> {
    if (!inFlight) {
      inFlight = readInner().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  }

  const reader = read as SerializedStoreReader<T>;
  reader.invalidate = () => {
    inFlight = null;
  };

  return reader;
}
