export type PipelineStageId =
  | "brief"
  | "storyboard"
  | "scene_generation"
  | "voice"
  | "sound"
  | "qa"
  | "delivery";

export type PipelineStageStatus = "completed" | "in_progress" | "pending";

export type PipelineStage = {
  id: PipelineStageId;
  label: { en: string; zh: string };
  status: PipelineStageStatus;
};

const STAGE_LABELS: Record<PipelineStageId, { en: string; zh: string }> = {
  brief: { en: "Brief", zh: "Brief" },
  storyboard: { en: "Storyboard", zh: "分镜" },
  scene_generation: { en: "Scene generation", zh: "场景生成" },
  voice: { en: "Voice", zh: "配音" },
  sound: { en: "Sound", zh: "音效" },
  qa: { en: "QA", zh: "质检" },
  delivery: { en: "Delivery", zh: "交付" }
};

/** Derive pipeline visualization from project/order status (demo heuristic). */
export function buildProductionPipeline(
  status: string,
  paymentStatus?: string
): PipelineStage[] {
  const order = ["brief", "storyboard", "scene_generation", "voice", "sound", "qa", "delivery"] as const;

  let activeIndex = 1;
  if (status === "waiting_payment" || paymentStatus === "unpaid") activeIndex = 0;
  else if (status === "in_production") activeIndex = 3;
  else if (status === "revision") activeIndex = 5;
  else if (status === "review") activeIndex = 6;
  else if (status === "completed") activeIndex = 7;

  return order.map((id, index) => ({
    id,
    label: STAGE_LABELS[id],
    status:
      index < activeIndex ? "completed" : index === activeIndex ? "in_progress" : ("pending" as const)
  }));
}
