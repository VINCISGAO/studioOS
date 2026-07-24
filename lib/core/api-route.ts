import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { getSessionUser } from "@/features/auth/session.service";
import { formatValidationMessage } from "@/lib/canvas/format-validation-message";
import { appError, isAppError } from "@/lib/core/errors";
import { enforceApiRateLimit } from "@/lib/core/security/rate-limit.service";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    const raw = error.errors[0]?.message ?? "Invalid input";
    const message = formatValidationMessage(raw);
    return apiError("VALIDATION_ERROR", message, 422);
  }
  if (isAppError(error)) {
    const status =
      error.code === "RATE_LIMIT" || error.code === "AI_USER_QUEUE_LIMIT_REACHED"
        ? 429
        : error.status;
    return apiError(error.code, error.message, status, error.details);
  }
  console.error("[api]", error);

  if (error instanceof Error) {
    if (error.constructor.name === "PrismaClientValidationError") {
      const hint = error.message.includes("seo_score")
        ? "Invalid SEO field mapping (seo_score → seoScore). Fix upsertTranslationBundle in knowledge-center.repository.ts."
        : error.message.slice(0, 280);
      return apiError("SYSTEM_ERROR", hint, 500);
    }

    const prismaCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code)
        : null;
    const migrateHint =
      prismaCode === "P2021" || prismaCode === "P2022"
        ? " Run npm run db:migrate:deploy."
        : "";
    const detail = prismaCode
      ? `${error.message} (${prismaCode})${migrateHint}`
      : `${error.message}${migrateHint}`;
    const message =
      process.env.NODE_ENV !== "production"
        ? detail
        : error.constructor.name === "PrismaClientValidationError"
          ? error.message.includes("seo_score")
            ? "Invalid SEO field mapping (seo_score → seoScore). Restart dev server after pulling latest code."
            : detail.slice(0, 280) || "Internal server error"
          : prismaCode === "P2002"
            ? "Duplicate record — refresh and retry."
            : prismaCode === "P2021" || prismaCode === "P2022"
              ? `Database schema out of date (${prismaCode}). Run db:migrate:deploy.`
              : detail.slice(0, 280) || "Internal server error";
    return apiError("SYSTEM_ERROR", message, 500, prismaCode ? { prismaCode } : undefined);
  }

  return apiError("SYSTEM_ERROR", "Internal server error", 500);
}

export async function requireApiUser(request?: Request): Promise<AuthUserDto> {
  if (request) {
    const pathname = new URL(request.url).pathname;
    await enforceApiRateLimit(request, pathname);
  }

  const user = await getSessionUser();
  if (!user) {
    throw appError("UNAUTHORIZED", "Not authenticated");
  }
  if (user.id.startsWith("demo_")) {
    throw appError("UNAUTHORIZED", "Sign in with a database account (run npm run db:seed)");
  }
  return user;
}

export async function enforcePublicApiRateLimit(request: Request): Promise<void> {
  const pathname = new URL(request.url).pathname;
  await enforceApiRateLimit(request, pathname);
}
