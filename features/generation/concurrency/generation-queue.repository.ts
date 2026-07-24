import type { GenerationStatus, GenerationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";
import type { GenerationConcurrencyCounts } from "@/features/generation/concurrency/generation-concurrency.types";

const runningStatuses: GenerationStatus[] = ["SUBMITTING", "PROCESSING"];
const queuedStatuses: GenerationStatus[] = ["QUEUED"];
const incompleteStatuses: GenerationStatus[] = ["QUEUED", "SUBMITTING", "PROCESSING"];

type JobClient = Prisma.TransactionClient | typeof prisma;

function emptyTypeCounts(): Record<GenerationType, number> {
  return { IMAGE: 0, VIDEO: 0, MUSIC: 0 };
}

async function countByType(
  client: JobClient,
  where: Prisma.GenerationJobWhereInput,
  statuses: GenerationStatus[]
) {
  const rows = await client.generationJob.groupBy({
    by: ["type"],
    where: { ...where, status: { in: statuses } },
    _count: { _all: true }
  });
  const counts = emptyTypeCounts();
  for (const row of rows) {
    counts[row.type] = row._count._all;
  }
  return counts;
}

export const generationQueueRepository = {
  async acquireProjectSlotLock(client: JobClient, userId: string, projectId: string) {
    await client.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${"generation:" + userId + ":" + projectId}))
    `;
  },

  async countActiveJobs(
    client: JobClient,
    input: { userId: string; projectId: string; provider: string }
  ): Promise<GenerationConcurrencyCounts> {
    const userBase = { ownerId: input.userId };
    const projectBase = { creativeProjectId: input.projectId };
    const providerBase = { provider: input.provider };

    const [
      userRunningTotal,
      userQueuedTotal,
      userRunningByType,
      userQueuedByType,
      projectRunningTotal,
      projectQueuedTotal,
      providerRunningTotal,
      providerQueuedTotal
    ] = await Promise.all([
      client.generationJob.count({
        where: { ...userBase, status: { in: runningStatuses } }
      }),
      client.generationJob.count({
        where: { ...userBase, status: { in: queuedStatuses } }
      }),
      countByType(client, userBase, runningStatuses),
      countByType(client, userBase, queuedStatuses),
      client.generationJob.count({
        where: { ...projectBase, status: { in: runningStatuses } }
      }),
      client.generationJob.count({
        where: { ...projectBase, status: { in: queuedStatuses } }
      }),
      client.generationJob.count({
        where: { ...providerBase, status: { in: runningStatuses } }
      }),
      client.generationJob.count({
        where: { ...providerBase, status: { in: queuedStatuses } }
      })
    ]);

    return {
      userRunningTotal,
      userQueuedTotal,
      userRunningByType,
      userQueuedByType,
      projectRunningTotal,
      projectQueuedTotal,
      providerRunningTotal,
      providerQueuedTotal
    };
  },

  listQueuedJobsForOwner(ownerId: string, projectId?: string) {
    return prisma.generationJob.findMany({
      where: {
        ownerId,
        status: "QUEUED",
        ...(projectId ? { creativeProjectId: projectId } : {})
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
  },

  listQueuedJobsForProvider(provider: string, limit = 20) {
    return prisma.generationJob.findMany({
      where: { provider, status: "QUEUED" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit
    });
  },

  isIncompleteStatus(status: GenerationStatus) {
    return incompleteStatuses.includes(status);
  }
};
