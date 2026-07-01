export {
  canPersistLocalDataStore,
  isDemoLoginUiEnabled,
  preferDemoAuth
} from "@/lib/runtime-flags";

/** Persist JSON locally when possible; always update in-memory store on serverless. */
export async function writeLocalJsonFile(filePath: string, data: unknown): Promise<void> {
  const { writeDataJson } = await import("@/lib/serverless-store");
  await writeDataJson(filePath, data);
}
