import { adminMutationHeaders } from "@/lib/studioos/admin-csrf-client";
import { coerceErrorMessage } from "@/lib/studioos/format-client-error";

type ApiEnvelope<T = unknown> = {
  success?: boolean;
  data?: T;
  error?: { message?: string; code?: string };
};

export type AdminApiResult<T> = {
  ok: boolean;
  status: number;
  payload: ApiEnvelope<T>;
  errorMessage: string | null;
};

function mergeHeaders(init?: HeadersInit, jsonBody?: unknown): HeadersInit {
  const methodHeaders: HeadersInit =
    jsonBody !== undefined ? { "Content-Type": "application/json" } : {};
  return {
    ...methodHeaders,
    ...adminMutationHeaders(),
    ...(init ?? {})
  };
}

export async function adminApiJson<T>(
  input: RequestInfo | URL,
  init: RequestInit & { json?: unknown } = {}
): Promise<AdminApiResult<T>> {
  const { json, headers, body, method, ...rest } = init;
  const resolvedMethod = (method ?? (json !== undefined ? "POST" : "GET")).toUpperCase();
  const isMutation = resolvedMethod !== "GET" && resolvedMethod !== "HEAD";

  let response: Response;
  try {
    response = await fetch(input, {
      ...rest,
      method: resolvedMethod,
      headers: isMutation ? mergeHeaders(headers, json) : headers,
      body: json !== undefined ? JSON.stringify(json) : body
    });
  } catch (caught) {
    return {
      ok: false,
      status: 0,
      payload: {},
      errorMessage: coerceErrorMessage(
        caught,
        "Network request failed. Check your connection and try again."
      )
    };
  }

  let payload: ApiEnvelope<T> = {};
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = {};
  }

  if (response.ok && payload.success !== false) {
    return { ok: true, status: response.status, payload, errorMessage: null };
  }

  return {
    ok: false,
    status: response.status,
    payload,
    errorMessage: coerceErrorMessage(
      payload.error?.message,
      response.status === 403
        ? "Admin session or CSRF token expired. Refresh the page and try again."
        : `Request failed (${response.status})`
    )
  };
}
