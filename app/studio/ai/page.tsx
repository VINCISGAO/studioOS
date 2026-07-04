import { Suspense } from "react";
import { AiWorkspacePage } from "@/components/ai-copilot/ai-workspace-page";

export default function StudioAiPage() {
  return (
    <Suspense fallback={null}>
      <AiWorkspacePage mode="creator" />
    </Suspense>
  );
}
