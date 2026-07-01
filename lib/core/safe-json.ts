import "server-only";

import { promises as fs } from "node:fs";

/** Parse JSON text without throwing on empty, whitespace-only, or corrupt input. */
export function safeJsonParse<T>(raw: string, defaultValue: T): T;
export function safeJsonParse<T>(raw: string): T | null;
export function safeJsonParse<T>(raw: string, defaultValue?: T): T | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return defaultValue ?? null;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return defaultValue ?? null;
  }
}

/** Read a UTF-8 JSON file safely. Returns default when missing, empty, or corrupt. */
export async function safeReadJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return safeJsonParse(raw, defaultValue);
  } catch {
    return defaultValue;
  }
}
