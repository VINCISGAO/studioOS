/**
 * Knowledge admin save request chain (single path — no Server Action):
 *
 * | Action        | Method | URL                              | Route file                          |
 * |---------------|--------|----------------------------------|-------------------------------------|
 * | Create draft  | POST   | /api/admin/knowledge             | app/api/admin/knowledge/route.ts    |
 * | Save / publish| PATCH  | /api/admin/knowledge/:id         | app/api/admin/knowledge/[id]/route.ts |
 *
 * NOT used by the editor: POST /api/admin/knowledge/:id/publish
 *
 * Middleware: /api/admin/* without session → JSON 401 (not HTML login redirect).
 *
 * Core write (HTTP): article row + translation core (body_html).
 * Background (after()): SEO sidecars, search index, revalidate, Lucien, multilingual.
 * Background failures are logged only — they must NOT change the HTTP response.
 */

import { extractApiErrorMessage, sanitizeApiResponseText } from "@/lib/studioos/api-error-message";

export type KnowledgeAdminApiJson<T> = {
  ok?: boolean;
  success?: boolean;
  requestId?: string;
  code?: string;
  message?: string;
  data?: T;
  error?: { code?: string; message?: string; details?: unknown };
};

function classifyNonJsonBody(input: { status: number; contentType: string; body: string }) {
  const snippet = input.body.slice(0, 1200).toLowerCase();

  if (input.status === 401 || input.status === 403) {
    if (snippet.includes("admin/login") || snippet.includes("sign in")) {
      return "中间件/会话：返回了登录页 HTML（401/403）";
    }
    return `权限错误 HTTP ${input.status}（非 JSON）`;
  }
  if (input.status === 404) {
    return `API 路径不存在 HTTP 404 — 请确认请求打到 /api/admin/knowledge 而不是页面路由`;
  }
  if (input.status === 413) {
    return "请求体过大 HTTP 413 — 正文或内嵌图片超过 Vercel 限制（约 4.4MB）";
  }
  if (input.status === 504 || snippet.includes("function_invocation_timeout")) {
    return "Vercel 函数超时 HTTP 504 — 核心保存应在数秒内完成，请查 Function Logs";
  }
  if (snippet.includes("<!doctype") || snippet.includes("<html")) {
    if (snippet.includes("internal server error")) {
      return `Next.js/Vercel 平台 500 错误页 HTTP ${input.status} — API 代码崩溃或超时，未返回 JSON`;
    }
    return `非 JSON 响应 HTTP ${input.status} — 可能是页面路由或平台错误页`;
  }
  return `非 JSON 响应 HTTP ${input.status}，Content-Type: ${input.contentType || "unknown"}`;
}

export async function fetchKnowledgeAdminJson<T>(input: {
  url: string;
  method: "POST" | "PATCH" | "DELETE" | "GET";
  body?: Record<string, unknown>;
  headers?: HeadersInit;
  zh?: boolean;
}): Promise<{ data: T; requestId?: string; status: number }> {
  const response = await fetch(input.url, {
    method: input.method,
    headers: {
      ...(input.body ? { "Content-Type": "application/json" } : {}),
      ...input.headers
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
    credentials: "same-origin"
  });

  const contentType = response.headers.get("content-type") || "";
  const requestId = response.headers.get("x-request-id") || undefined;
  const rawBody = await response.text();

  if (!contentType.includes("application/json")) {
    const hint = classifyNonJsonBody({ status: response.status, contentType, body: rawBody });
    console.error("[knowledge-admin-api] Non-JSON response", {
      url: input.url,
      method: input.method,
      status: response.status,
      contentType,
      requestId,
      bodyPreview: rawBody.slice(0, 1000)
    });
    const suffix = requestId ? ` [requestId: ${requestId}]` : "";
    throw new Error(`${hint}${suffix}`);
  }

  let parsed: KnowledgeAdminApiJson<T> = {};
  if (rawBody.trim()) {
    try {
      parsed = JSON.parse(rawBody) as KnowledgeAdminApiJson<T>;
    } catch {
      console.error("[knowledge-admin-api] Invalid JSON", {
        url: input.url,
        status: response.status,
        requestId,
        bodyPreview: rawBody.slice(0, 500)
      });
      throw new Error(sanitizeApiResponseText(rawBody, response.status));
    }
  }

  if (!response.ok) {
    const message = extractApiErrorMessage(
      parsed,
      input.zh ? `保存失败（HTTP ${response.status}）` : `Save failed (HTTP ${response.status})`,
      response.status
    );
    const rid = parsed.requestId ?? requestId;
    throw new Error(rid ? `${message} [requestId: ${rid}]` : message);
  }

  if (!parsed.data) {
    throw new Error(
      input.zh
        ? `API 响应缺少 data 字段（HTTP ${response.status}）`
        : `API response missing data (HTTP ${response.status})`
    );
  }

  return { data: parsed.data, requestId: parsed.requestId ?? requestId, status: response.status };
}
