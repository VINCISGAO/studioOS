type ApiErrorBody = {
  success?: boolean;
  ok?: boolean;
  message?: string;
  error?: string | { message?: string; code?: string; details?: unknown };
};

function readNestedErrorMessage(error: ApiErrorBody["error"]) {
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error && typeof error === "object" && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }
  return "";
}

/** Normalize API / middleware JSON errors into a user-visible message. */
export function extractApiErrorMessage(body: unknown, fallback: string, status?: number) {
  if (body && typeof body === "object") {
    const record = body as ApiErrorBody;
    const nested = readNestedErrorMessage(record.error);
    if (nested) return nested;
    if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
    const errObj = record.error;
    if (errObj && typeof errObj === "object" && errObj.details && typeof errObj.details === "object") {
      const details = errObj.details as { prismaCode?: string };
      if (details.prismaCode === "P2021" || details.prismaCode === "P2022") {
        return `数据库 schema 过期 (${details.prismaCode})，请运行 db:migrate:deploy`;
      }
    }
  }

  if (status === 401) return "登录已过期，请重新登录";
  if (status === 403) return "权限校验失败，请刷新页面后重试";
  if (status === 422) return "提交内容校验失败";
  if (status === 409) return "数据冲突，请刷新后重试";
  if (status && status >= 500) {
    if (body && typeof body === "object") {
      const record = body as ApiErrorBody;
      const errObj = record.error;
      if (typeof errObj === "string" && errObj.trim()) return errObj.trim();
      if (errObj && typeof errObj === "object" && typeof errObj.message === "string" && errObj.message.trim()) {
        return errObj.message.trim();
      }
      if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
    }
    return `服务器错误 (${status})`;
  }

  return fallback;
}
