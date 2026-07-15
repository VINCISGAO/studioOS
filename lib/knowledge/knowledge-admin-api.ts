import "server-only";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAppError } from "@/lib/core/errors";
import { logger } from "@/lib/core/logger";

export type KnowledgeAdminRouteStep =
  | "auth"
  | "parse_body"
  | "service_create"
  | "service_update"
  | "service_publish"
  | "serialize_response"
  | "schedule_background";

export function createKnowledgeRequestId(request?: Request) {
  const incoming = request?.headers.get("x-request-id")?.trim();
  return incoming || randomUUID();
}

export function logKnowledgeAdminStep(input: {
  requestId: string;
  route: string;
  step: KnowledgeAdminRouteStep;
  articleId?: string;
  method?: string;
  extra?: Record<string, unknown>;
}) {
  logger.info("knowledge.admin.api.step", {
    service: "KnowledgeAdminApi",
    requestId: input.requestId,
    route: input.route,
    method: input.method,
    step: input.step,
    articleId: input.articleId,
    ...input.extra
  });
}

export function logKnowledgeAdminError(input: {
  requestId: string;
  route: string;
  step: KnowledgeAdminRouteStep;
  error: unknown;
  articleId?: string;
}) {
  const err = input.error;
  const prismaCode =
    typeof err === "object" && err !== null && "code" in err ? String((err as { code?: string }).code) : undefined;

  logger.error("knowledge.admin.api.error", {
    service: "KnowledgeAdminApi",
    requestId: input.requestId,
    route: input.route,
    step: input.step,
    articleId: input.articleId,
    code: isAppError(err) ? err.code : prismaCode ?? "SYSTEM_ERROR",
    prismaCode,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined
  });
}

function resolveApiErrorPayload(error: unknown): {
  code: string;
  message: string;
  status: number;
  details?: unknown;
} {
  if (error instanceof ZodError) {
    return {
      code: "VALIDATION_ERROR",
      message: error.errors[0]?.message ?? "Invalid input",
      status: 422
    };
  }
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.message,
      status: error.code === "RATE_LIMIT" ? 429 : error.status,
      details: error.details
    };
  }
  if (error instanceof Error) {
    const prismaCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code)
        : null;
    const migrateHint =
      prismaCode === "P2021" || prismaCode === "P2022" ? " Run npm run db:migrate:deploy." : "";
    const detail = prismaCode
      ? `${error.message} (${prismaCode})${migrateHint}`
      : `${error.message}${migrateHint}`;
    const message =
      error.constructor.name === "PrismaClientValidationError"
        ? error.message.includes("seo_score")
          ? "Invalid SEO field mapping (seo_score → seoScore)."
          : detail.slice(0, 280) || "Internal server error"
        : prismaCode === "P2002"
          ? "Duplicate record — refresh and retry."
          : prismaCode === "P2021" || prismaCode === "P2022"
            ? `Database schema out of date (${prismaCode}). Run db:migrate:deploy.`
            : detail.slice(0, 280) || "Internal server error";
    return {
      code: "SYSTEM_ERROR",
      message,
      status: 500,
      details: prismaCode ? { prismaCode } : undefined
    };
  }
  return { code: "SYSTEM_ERROR", message: "Internal server error", status: 500 };
}

/** Always JSON — never HTML. Includes requestId for Vercel log correlation. */
export function knowledgeAdminJsonSuccess<T>(data: T, requestId: string, status = 200) {
  const response = NextResponse.json({ ok: true, success: true, requestId, data }, { status });
  response.headers.set("x-request-id", requestId);
  response.headers.set("content-type", "application/json; charset=utf-8");
  return response;
}

export function knowledgeAdminJsonError(
  error: unknown,
  requestId: string,
  context: { route: string; step: KnowledgeAdminRouteStep; articleId?: string }
) {
  logKnowledgeAdminError({ requestId, ...context, error });
  const payload = resolveApiErrorPayload(error);
  const response = NextResponse.json(
    {
      ok: false,
      success: false,
      requestId,
      code: payload.code,
      message: payload.message,
      error: { code: payload.code, message: payload.message, details: payload.details }
    },
    { status: payload.status }
  );
  response.headers.set("x-request-id", requestId);
  response.headers.set("content-type", "application/json; charset=utf-8");
  return response;
}
