import { Suspense } from "react";
import { AiWorkspacePage } from "@/components/ai-copilot/ai-workspace-page";

export default function BrandAiPage() {
  return (
    <Suspense fallback={null}>
      <AiWorkspacePage mode="brand" />
    </Suspense>
  );
}
