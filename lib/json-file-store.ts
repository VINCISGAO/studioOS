import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

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

/** Serialize writes per file and use unique temp paths to avoid ENOENT races. */
export async function writeJsonFileAtomic(filePath: string, data: unknown): Promise<void> {
  return enqueue(`write:${filePath}`, async () => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.tmp.${process.pid}.${randomBytes(6).toString("hex")}`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
    try {
      await fs.rename(tempPath, filePath);
    } catch (error) {
      await fs.unlink(tempPath).catch(() => undefined);
      throw error;
    }
  });
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
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
