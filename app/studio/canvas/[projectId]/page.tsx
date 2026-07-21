import { notFound } from "next/navigation";
import { CanvasWorkspace } from "@/components/canvas/canvas-workspace";
import type { GenerationKind } from "@/components/canvas/generation-panel";
import { loadCanvasAction } from "@/features/canvas/canvas.actions";
import { getAppUiLocale } from "@/lib/app-language";
import { isAppError } from "@/lib/core/errors";

type Params = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ panel?: string }>;
};

function parseInitialPanel(value?: string): GenerationKind | null {
  if (value === "image" || value === "video" || value === "music") return value;
  return null;
}

export default async function StudioCanvasProjectPage({ params, searchParams }: Params) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const locale = await getAppUiLocale();

  try {
    const snapshot = await loadCanvasAction(projectId);
    return (
      <CanvasWorkspace
        snapshot={snapshot}
        locale={locale}
        initialPanel={parseInitialPanel(query.panel)}
      />
    );
  } catch (error) {
    if (isAppError(error) && (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")) {
      notFound();
    }
    throw error;
  }
}
