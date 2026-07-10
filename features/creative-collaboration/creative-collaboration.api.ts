import { z } from "zod";
import {
  runCreativeCollaborationAction
} from "@/features/creative-collaboration/creative-collaboration.actions";
import type { CreativeCollaborationView } from "@/features/creative-collaboration/creative-collaboration.types";
import type { Locale } from "@/lib/i18n";

const collaborationBodySchema = z.object({
  action: z.enum([
    "brandGenerate",
    "brandSkip",
    "brandDeepen",
    "brandSend",
    "brandConfirm",
    "brandReject",
    "brandDeepenCreator",
    "brandSendFinal",
    "creatorGenerate",
    "creatorSend",
    "creatorAck"
  ]),
  lang: z.enum(["zh", "en"]).optional(),
  ideaId: z.string().optional(),
  ideaIds: z.array(z.string()).optional()
});

export type CreativeCollaborationApiResponse = {
  version: "v1";
  generatedAt: string;
  view: CreativeCollaborationView;
};

export async function parseCreativeCollaborationBody(request: Request) {
  const body = collaborationBodySchema.parse(await request.json());
  return {
    action: body.action,
    locale: (body.lang === "zh" ? "zh" : "en") as Locale,
    ideaId: body.ideaId,
    ideaIds: body.ideaIds
  };
}

export async function executeCreativeCollaborationRequest(input: {
  projectId: string;
  request: Request;
  actor: Parameters<typeof runCreativeCollaborationAction>[0]["actor"];
}): Promise<CreativeCollaborationApiResponse> {
  const parsed = await parseCreativeCollaborationBody(input.request);
  const view = await runCreativeCollaborationAction({
    projectId: input.projectId,
    action: parsed.action,
    actor: input.actor,
    locale: parsed.locale,
    ideaId: parsed.ideaId,
    ideaIds: parsed.ideaIds
  });

  return {
    version: "v1",
    generatedAt: new Date().toISOString(),
    view
  };
}
