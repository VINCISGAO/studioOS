import { writeDataJson } from "@/lib/serverless-store";

/** Vercel/serverless project dir is read-only — `.data` JSON stores cannot be written to disk. */
export function canPersistLocalDataStore() {
  return process.env.VERCEL !== "1";
}

/** Demo auth works on Vercel even if Supabase env keys are present (not wired for brand portal yet). */
export function preferDemoAuth() {
  return process.env.STUDIOOS_FORCE_SUPABASE_AUTH !== "1";
}

/** Show demo accounts + social shortcuts on the login page. */
export function isDemoLoginUiEnabled() {
  return preferDemoAuth();
}

/** Persist JSON locally when possible; always update in-memory store on serverless. */
export async function writeLocalJsonFile(filePath: string, data: unknown): Promise<void> {
  await writeDataJson(filePath, data);
}
