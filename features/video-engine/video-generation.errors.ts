const PRISMA_TRANSACTION_RE =
  /Transaction API error|Transaction not found|Transaction ID is invalid|interactive transaction|P2034/i;

const PRISMA_INVOCATION_RE = /Invalid `prisma\./i;

export type SanitizedGenerationError = {
  errorCode: string;
  userMessageZh: string;
  userMessageEn: string;
  logMessage: string;
};

export function readGenerationErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function isPrismaTransactionLifecycleError(error: unknown) {
  const message = readGenerationErrorMessage(error);
  return PRISMA_TRANSACTION_RE.test(message) || PRISMA_INVOCATION_RE.test(message);
}

export function sanitizeVideoGenerationJobError(
  error: unknown,
  fallbackCode = "VIDEO_GENERATION_FAILED"
): SanitizedGenerationError {
  const logMessage = readGenerationErrorMessage(error);

  if (isPrismaTransactionLifecycleError(error)) {
    return {
      errorCode: "DATABASE_TRANSACTION",
      userMessageZh: "视频生成暂时失败，请稍后重试。相关 Credits 已自动退回。",
      userMessageEn: "Video generation failed temporarily. Your Credits have been refunded automatically.",
      logMessage
    };
  }

  return {
    errorCode: fallbackCode,
    userMessageZh: logMessage,
    userMessageEn: logMessage,
    logMessage
  };
}

export function userFacingGenerationErrorMessage(
  sanitized: SanitizedGenerationError,
  locale: "zh" | "en" = "zh"
) {
  return locale === "zh" ? sanitized.userMessageZh : sanitized.userMessageEn;
}
