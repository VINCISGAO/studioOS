import type { CreativeCollaborationActionName } from "@/features/creative-collaboration/creative-collaboration.actions";
import type { CreativeCollaborationApiResponse } from "@/features/creative-collaboration/creative-collaboration.api";
import type { CreativeCollaborationView } from "@/features/creative-collaboration/creative-collaboration.types";
import type { Locale } from "@/lib/i18n";
import { StudioOsApiPaths } from "@/lib/api-client/studioos-api";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

export async function postCreativeCollaboration(input: {
  role: "brand" | "creator";
  projectId: string;
  orderId?: string;
  action: CreativeCollaborationActionName;
  locale: Locale;
  ideaId?: string;
  ideaIds?: string[];
}): Promise<{ ok: true; view: CreativeCollaborationView } | { ok: false; error: string }> {
  const path =
    input.role === "brand"
      ? `${StudioOsApiPaths.brandProjectCollaboration(input.projectId)}`
      : `${StudioOsApiPaths.creatorProjectCollaboration(input.orderId ?? input.projectId)}`;

  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: input.action,
      lang: input.locale,
      ...(input.ideaId ? { ideaId: input.ideaId } : {}),
      ...(input.ideaIds?.length ? { ideaIds: input.ideaIds } : {})
    })
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<CreativeCollaborationApiResponse> | null;
  if (!response.ok || !payload?.success || !payload.data?.view) {
    return {
      ok: false,
      error: payload?.error?.message ?? "Creative collaboration request failed"
    };
  }

  return { ok: true, view: payload.data.view };
}
