import { Suspense } from "react";
import { AiWorkspacePage } from "@/components/ai-copilot/ai-workspace-page";

export default function CopilotPage() {
  return (
    <Suspense fallback={null}>
      <AiWorkspacePage mode="auto" />
    </Suspense>
  );
}
