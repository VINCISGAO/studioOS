export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CAMPAIGN_LOCKED"
  | "RATE_LIMIT"
  | "BUDGET_TOO_LOW"
  | "TIMEOUT"
  | "SYSTEM_ERROR";

export type ActionError = {
  code: ActionErrorCode;
  message: string;
  field?: string;
  retryable?: boolean;
};

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: ActionError };

export function actionOk<T>(data?: T): ActionResult<T> {
  return data === undefined ? { ok: true } : { ok: true, data };
}

export function actionFail(
  code: ActionErrorCode,
  message: string,
  options?: { field?: string; retryable?: boolean }
): ActionResult<never> {
  return {
    ok: false,
    error: {
      code,
      message,
      field: options?.field,
      retryable: options?.retryable
    }
  };
}

export function actionErrorMessage(result: ActionResult<unknown>): string | null {
  return result.ok ? null : result.error.message;
}
