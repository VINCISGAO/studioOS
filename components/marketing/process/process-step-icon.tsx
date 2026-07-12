import {
  Archive,
  Calculator,
  ClipboardList,
  CloudUpload,
  MessageSquareReply,
  PlayCircle,
  ShieldCheck,
  Users
} from "lucide-react";
import type { ProcessStepId } from "@/lib/marketing/process-copy";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<ProcessStepId, typeof ClipboardList> = {
  brief: ClipboardList,
  pricing: Calculator,
  matching: Users,
  production: PlayCircle,
  review: MessageSquareReply,
  delivery: CloudUpload,
  escrow: ShieldCheck,
  complete: Archive
};

export function ProcessStepIcon({ id, className }: { id: ProcessStepId; className?: string }) {
  const Icon = STEP_ICONS[id];
  return <Icon className={cn("h-5 w-5", className)} strokeWidth={1.75} />;
}
