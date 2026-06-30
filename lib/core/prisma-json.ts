import type { Prisma } from "@prisma/client";

export function asInputJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null as unknown as Prisma.InputJsonValue;
  return value as Prisma.InputJsonValue;
}
