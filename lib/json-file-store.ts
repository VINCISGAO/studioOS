import "server-only";

import path from "node:path";
import { canPersistLocalDataStore } from "@/lib/can-persist-local-store";
import { getMemoryStore, writeDataJson, cacheDataJson } from "@/lib/serverless-store";
import { promises as fs } from "node:fs";

const queues = new Map<string, Promise<unknown>>();

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
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
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

  const read = (async () => {
    if (!inFlight) {
      inFlight = readInner().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  }) as SerializedStoreReader<T>;

  read.invalidate = () => {
    inFlight = null;
  };

  return read;
}
