export type AsyncFeedbackTone = "ok" | "error" | "info";

export type AsyncFeedbackMessage = {
  tone: AsyncFeedbackTone;
  message: string;
};

export type ActionResult = { ok: true } | { ok: false; error?: string };

export function feedbackFromResult(
  result: ActionResult | void,
  okMessage: string,
  errorFallback: string
): AsyncFeedbackMessage | null {
  if (!result || !("ok" in result)) {
    return { tone: "ok", message: okMessage };
  }
  if (result.ok) {
    return { tone: "ok", message: okMessage };
  }
  return { tone: "error", message: result.error ?? errorFallback };
}
