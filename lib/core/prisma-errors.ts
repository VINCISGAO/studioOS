import { Prisma } from "@prisma/client";

/** Prisma P2021 — table/relation does not exist (migration not applied yet). */
export function isPrismaMissingTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}
