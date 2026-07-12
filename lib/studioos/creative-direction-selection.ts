import type { FrozenProductionBrief } from "@/features/ai/creative-direction.types";
import type { ConfirmedBriefField, ConfirmedBriefSnapshot } from "@/lib/studioos/confirmed-brief";

export const CREATOR_SUBMITTED_CREATIVE_DIRECTION_ID = "creator_submitted_creative_direction";

export function isCreatorSubmittedCreativeDirection(directionId: string) {
  return directionId === CREATOR_SUBMITTED_CREATIVE_DIRECTION_ID;
}

export function buildCreatorSubmittedFrozenBrief(
  snapshot: ConfirmedBriefSnapshot,
  creativeField: ConfirmedBriefField
): FrozenProductionBrief {
  const full_text = [snapshot.full_text, `${creativeField.label}: ${creativeField.value}`]
    .filter((item) => item.trim())
    .join("\n");

  return {
    frozen_at: snapshot.confirmed_at,
    source_direction_id: CREATOR_SUBMITTED_CREATIVE_DIRECTION_ID,
    title: creativeField.label,
    core_idea: creativeField.value,
    hook: creativeField.value,
    story: full_text,
    tone: "",
    shot_list: [],
    cta: "",
    visual_style: "",
    full_text
  };
}
