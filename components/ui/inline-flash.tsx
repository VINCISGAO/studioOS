import type { AsyncFeedbackMessage } from "@/lib/ui/async-feedback";
import { cn } from "@/lib/utils";

export function InlineFlash({
  feedback,
  className
}: {
  feedback: AsyncFeedbackMessage | null;
  className?: string;
}) {
  if (!feedback) return null;

  return (
    <p
      className={cn(
        "text-sm",
        feedback.tone === "ok" ? "text-emerald-700" : feedback.tone === "error" ? "text-red-600" : "text-zinc-600",
        className
      )}
      role="status"
    >
      {feedback.message}
    </p>
  );
}
