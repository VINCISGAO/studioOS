import type { Locale } from "@/lib/i18n";
import { deliverableVideoPolicyNotice } from "@/lib/studioos/deliverable-video-policy-shared";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

export function DeliverableVideoPolicyNotice({
  locale,
  showUploadLimit = false,
  className
}: {
  locale: Locale;
  showUploadLimit?: boolean;
  className?: string;
}) {
  const copy = deliverableVideoPolicyNotice(locale);

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm leading-6 text-zinc-600",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        <div>
          <p className="font-medium text-zinc-900">{copy.title}</p>
          <p className="mt-1 font-medium text-zinc-800">{copy.timing}</p>
          <p className="mt-1">{copy.body}</p>
          {showUploadLimit ? <p className="mt-2 text-xs text-zinc-500">{copy.uploadLimit}</p> : null}
        </div>
      </div>
    </div>
  );
}
