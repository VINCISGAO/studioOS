import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { canPersistLocalDataStore } from "@/lib/can-persist-local-store";

const memoryByPath = new Map<string, unknown>();

export function dataStorePath(fileName: string) {
  return path.join(process.cwd(), ".data", fileName);
}

export function bundledSeedPath(fileName: string) {
  return path.join(process.cwd(), "seed", fileName);
}

async function readJsonFromDisk<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJsonToDisk(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp.${process.pid}.${randomBytes(6).toString("hex")}`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
  try {
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.unlink(tempPath).catch(() => undefined);
    throw error;
  }
}

/** Read JSON store: local disk → bundled seed → in-memory seed fn → cache in memory on Vercel. */
export async function readDataJson<T>(
  filePath: string,
  seed: () => T | Promise<T>
): Promise<T> {
  if (memoryByPath.has(filePath)) {
    return memoryByPath.get(filePath) as T;
  }

  if (canPersistLocalDataStore()) {
    const fromDisk = await readJsonFromDisk<T>(filePath);
    if (fromDisk != null) {
      memoryByPath.set(filePath, fromDisk);
      return fromDisk;
    }
  } else {
    const fromSeed = await readJsonFromDisk<T>(bundledSeedPath(path.basename(filePath)));
    if (fromSeed != null) {
      memoryByPath.set(filePath, fromSeed);
      return fromSeed;
    }
  }

  const seeded = await seed();
  memoryByPath.set(filePath, seeded);
  if (canPersistLocalDataStore()) {
    await writeJsonToDisk(filePath, seeded);
  }
  return seeded;
}

/** Write JSON store — always updates memory; persists to disk locally only. */
export async function writeDataJson(filePath: string, data: unknown): Promise<void> {
  memoryByPath.set(filePath, data);
  if (canPersistLocalDataStore()) {
    await writeJsonToDisk(filePath, data);
  }
}

export function invalidateDataJson(filePath: string) {
  memoryByPath.delete(filePath);
}

export function getMemoryStore<T>(filePath: string): T | null {
  if (!memoryByPath.has(filePath)) {
    return null;
  }
  return memoryByPath.get(filePath) as T;
}

/** Cache store in memory without persisting to disk (used by readJsonFile). */
export function cacheDataJson(filePath: string, data: unknown) {
  memoryByPath.set(filePath, data);
}
