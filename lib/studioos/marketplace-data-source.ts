import { hasDatabaseUrl } from "@/lib/core/database/prisma";

/** Production marketplace flows must use Prisma — JSON stores are local-dev only. */
export function shouldUseLegacyJsonMarketplaceStore(): boolean {
  return !hasDatabaseUrl();
}

export function assertPrismaMarketplaceStore(operation: string): void {
  if (shouldUseLegacyJsonMarketplaceStore()) {
    return;
  }
  throw new Error(`${operation} requires Prisma — legacy JSON marketplace store is disabled in production`);
}
