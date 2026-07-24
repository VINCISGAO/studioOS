/**
 * Generation stale job reaper — run hourly via cron / Vercel cron.
 * Run: npm run generation:stale:reaper
 */
import { generationStaleJobService } from "../features/generation/concurrency/generation-stale-job.service";
import { hasDatabaseUrl } from "../lib/core/database/prisma";

async function main() {
  if (!hasDatabaseUrl()) {
    console.log(JSON.stringify({ ok: true, skipped: true, reason: "DATABASE_URL not configured" }));
    return;
  }

  const result = await generationStaleJobService.runStaleJobReaper();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
