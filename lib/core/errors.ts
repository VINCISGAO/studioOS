export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(input: { code: string; status: number; message: string; details?: unknown }) {
    super(input.message);
    this.name = "AppError";
    this.code = input.code;
    this.status = input.status;
    this.details = input.details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export const ErrorCodes = {
  UNAUTHORIZED: { code: "UNAUTHORIZED", status: 401 },
  FORBIDDEN: { code: "FORBIDDEN", status: 403 },
  NOT_FOUND: { code: "NOT_FOUND", status: 404 },
  VALIDATION_ERROR: { code: "VALIDATION_ERROR", status: 422 },
  INVALID_TRANSITION: { code: "INVALID_STATE_TRANSITION", status: 409 },
  REVIEW_LOCKED: { code: "REVIEW_LOCKED", status: 409 },
  CAMPAIGN_LOCKED: { code: "CAMPAIGN_LOCKED", status: 409 },
  CONFLICT: { code: "CONFLICT", status: 409 },
  PAYMENT_FAILED: { code: "PAYMENT_FAILED", status: 402 },
  RATE_LIMIT: { code: "RATE_LIMIT", status: 429 },
  SYSTEM_ERROR: { code: "SYSTEM_ERROR", status: 500 }
} as const;

export function appError(
  key: keyof typeof ErrorCodes,
  message: string,
  details?: unknown
): AppError {
  const meta = ErrorCodes[key];
  return new AppError({ ...meta, message, details });
}
