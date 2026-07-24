import { z } from "zod";
import { CANVAS_NODE_TYPES, DIRECTOR_SKILLS } from "@/lib/canvas/types";
import {
  MUSIC_LYRICS_MAX,
  MUSIC_PROMPT_MAX,
  MUSIC_STYLE_MAX,
  MUSIC_TITLE_MAX,
  musicFieldLimitMessage
} from "@/lib/canvas/music-field-limits";
import {
  CANVAS_PROMPT_ENHANCE_MAX_LENGTH,
  type CanvasPromptEnhanceField,
  VIDEO_PROMPT_ENHANCE_MAX
} from "@/lib/canvas/prompt-enhance";
import { appError } from "@/lib/core/errors";

export const MAX_CANVAS_NODES = 300;
export const MAX_CANVAS_EDGES = 500;
export const MAX_CANVAS_SNAPSHOT_BYTES = 1_000_000;

const finiteNumber = z.number().finite();
const nodeId = z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/);
const canvasNodeDataSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    status: z.enum(["idle", "loading", "ready", "failed"]),
    prompt: z.string().max(4000).optional(),
    url: z
      .string()
      .max(2000)
      .refine((value) => value.startsWith("/api/canvas/assets/"), "Invalid canvas asset URL")
      .optional(),
    assetId: z.string().uuid().optional(),
    fileName: z.string().max(180).optional(),
    mimeType: z.string().max(120).optional(),
    jobId: z.string().uuid().optional(),
    generationType: z.enum(["IMAGE", "VIDEO", "MUSIC"]).optional(),
    progress: z.number().int().min(0).max(100).optional(),
    error: z.string().max(500).optional(),
    text: z.string().max(12000).optional(),
    skill: z.string().max(80).optional()
  })
  .passthrough();

export const canvasNodeSchema = z.object({
  id: nodeId,
  type: z.enum(CANVAS_NODE_TYPES),
  position: z.object({ x: finiteNumber, y: finiteNumber }),
  width: finiteNumber.positive().max(4000).optional(),
  height: finiteNumber.positive().max(4000).optional(),
  parentId: nodeId.optional(),
  zIndex: z.number().int().min(-1000).max(1000).optional(),
  data: canvasNodeDataSchema
});

export const canvasEdgeSchema = z.object({
  id: nodeId,
  source: nodeId,
  target: nodeId,
  sourceHandle: z.string().max(120).nullable().optional(),
  targetHandle: z.string().max(120).nullable().optional(),
  data: z.record(z.unknown()).nullable().optional()
});

export const canvasViewportSchema = z.object({
  x: finiteNumber,
  y: finiteNumber,
  zoom: finiteNumber.min(0.08).max(4),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
});

export const canvasAutosaveSchema = z.object({
  projectId: z.string().uuid(),
  nodes: z.array(canvasNodeSchema).max(MAX_CANVAS_NODES),
  edges: z.array(canvasEdgeSchema).max(MAX_CANVAS_EDGES),
  viewport: canvasViewportSchema
});

const generationBaseSchema = z.object({
  projectId: z.string().uuid(),
  nodeId,
  prompt: z.string().trim().min(3).max(5000),
  model: z.string().trim().min(1).max(120),
  idempotencyKey: z.string().min(8).max(120)
});

const generationModeSchema = z
  .enum([
    "TEXT_TO_IMAGE",
    "TEXT_TO_VIDEO",
    "TEXT_TO_MUSIC",
    "REGENERATE",
    "EXTEND",
    "UPSCALE",
    "REMOVE_BACKGROUND",
    "SUBJECT_ISOLATE"
  ])
  .optional();

export const imageGenerationSchema = generationBaseSchema.extend({
  aspectRatio: z
    .enum([
      "1:1",
      "3:2",
      "2:3",
      "4:3",
      "3:4",
      "9:16",
      "1:1(2k)",
      "16:9(2k)",
      "9:16(2k)",
      "16:9(4k)",
      "9:16(4k)",
      "auto",
      "16:9"
    ])
    .default("auto"),
  quality: z.enum(["auto", "high", "medium", "low"]).default("medium"),
  width: z.number().int().min(512).max(4096).default(1024),
  height: z.number().int().min(512).max(4096).default(1024),
  resolution: z.enum(["1024", "1536", "2048", "2560", "3840"]).default("1024"),
  outputs: z.number().int().min(1).max(4).default(1),
  referenceAssetId: z.string().uuid().optional(),
  referenceUrl: z.string().max(2000).optional(),
  referenceNodeId: z
    .string()
    .max(120)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  mode: generationModeSchema
});

export const videoGenerationSchema = generationBaseSchema.extend({
  aspectRatio: z
    .enum(["auto", "16:9", "4:3", "1:1", "3:4", "9:16", "21:9"])
    .default("auto"),
  duration: z.number().int().min(3).max(15).default(5),
  quality: z.enum(["480p", "720p", "1080p", "4k"]).default("720p"),
  audio: z.boolean().default(true),
  webSearch: z.boolean().default(false),
  cameraMovements: z.string().max(500).optional(),
  referenceAssetId: z.string().uuid().optional(),
  referenceUrl: z.string().max(2000).optional(),
  referenceNodeId: z
    .string()
    .max(120)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  referenceMimeType: z.string().trim().max(120).optional(),
  lastFrameReferenceAssetId: z.string().uuid().optional(),
  lastFrameReferenceUrl: z.string().max(2000).optional(),
  lastFrameReferenceNodeId: z
    .string()
    .max(120)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  lastFrameReferenceMimeType: z.string().trim().max(120).optional(),
  videoReferenceMode: z.enum(["reference", "edit", "keyframes"]).default("reference"),
  mode: z.enum(["TEXT_TO_VIDEO", "IMAGE_TO_VIDEO"]).optional()
});

export const musicGenerationSchema = generationBaseSchema
  .extend({
    prompt: z
      .string()
      .trim()
      .min(3, { message: "至少需要 3 个字符" })
      .max(MUSIC_PROMPT_MAX, { message: musicFieldLimitMessage(MUSIC_PROMPT_MAX) })
  })
  .extend({
    instrumental: z.boolean().default(false),
    mode: z.enum(["simple", "custom", "soundtrack"]).default("custom"),
    style: z
      .string()
      .trim()
      .max(MUSIC_STYLE_MAX, { message: musicFieldLimitMessage(MUSIC_STYLE_MAX) })
      .optional(),
    mood: z
      .string()
      .trim()
      .max(MUSIC_STYLE_MAX, { message: musicFieldLimitMessage(MUSIC_STYLE_MAX) })
      .optional(),
    lyrics: z
      .string()
      .trim()
      .max(MUSIC_LYRICS_MAX, { message: musicFieldLimitMessage(MUSIC_LYRICS_MAX) })
      .optional(),
    songName: z
      .string()
      .trim()
      .max(MUSIC_TITLE_MAX, { message: musicFieldLimitMessage(MUSIC_TITLE_MAX) })
      .optional(),
    vocalGender: z.enum(["female", "male"]).optional(),
    referenceEnabled: z.boolean().optional(),
    remixEnabled: z.boolean().optional(),
    vocalEnabled: z.boolean().optional()
  });

const actionPosition = finiteNumber.min(-100_000).max(100_000);
const actionSize = finiteNumber.min(80).max(4000);

export const canvasActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("CREATE_NODE"),
    node: z.object({
      id: nodeId,
      nodeType: z.enum(["image", "video", "music", "text"]),
      title: z.string().trim().min(1).max(180),
      prompt: z.string().max(4000).optional(),
      text: z.string().max(12000).optional(),
      x: actionPosition,
      y: actionPosition,
      width: actionSize,
      height: actionSize,
      parentId: nodeId.optional()
    })
  }),
  z.object({
    type: z.literal("UPDATE_NODE"),
    nodeId,
    patch: canvasNodeDataSchema.partial()
  }),
  z.object({
    type: z.literal("CREATE_FRAME"),
    frame: z.object({
      id: nodeId,
      title: z.string().trim().min(1).max(180),
      x: actionPosition,
      y: actionPosition,
      width: actionSize,
      height: actionSize
    })
  }),
  z.object({
    type: z.literal("CONNECT_NODES"),
    sourceId: nodeId,
    targetId: nodeId
  }),
  z.object({
    type: z.literal("START_GENERATION"),
    nodeId,
    generationType: z.enum(["IMAGE", "VIDEO", "MUSIC"])
  }),
  z.object({
    type: z.literal("AUTO_LAYOUT"),
    nodeIds: z.array(nodeId).min(1).max(100)
  })
]);

export const canvasDirectorPlanSchema = z.object({
  planId: z.string().uuid(),
  projectId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
  skill: z.enum(DIRECTOR_SKILLS),
  actions: z.array(canvasActionSchema).min(1).max(100),
  estimatedCredits: z.number().int().min(0).max(100_000),
  estimatedTime: z.object({
    minMinutes: z.number().int().min(1).max(240),
    maxMinutes: z.number().int().min(1).max(480)
  }),
  requiresConfirmation: z.literal(true),
  provider: z.string().max(80)
});

export const canvasDirectorRequestSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().trim().min(3).max(4000),
  skill: z.enum(DIRECTOR_SKILLS).default("AD_VIDEO")
});

export const canvasDirectorApplySchema = z.object({
  projectId: z.string().uuid(),
  plan: canvasDirectorPlanSchema
});

export const canvasPromptEnhanceSchema = z
  .object({
    projectId: z.string().uuid(),
    field: z.enum(["music_style", "video_prompt"]),
    text: z.string(),
    languageCode: z.string().max(20).optional().nullable()
  })
  .superRefine((value, ctx) => {
    const trimmed = value.text.trim();
    const maxLength = CANVAS_PROMPT_ENHANCE_MAX_LENGTH[value.field as CanvasPromptEnhanceField];

    if (value.field === "music_style") {
      if (!trimmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Style description is required"
        });
        return;
      }
      if (trimmed.length > maxLength) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: maxLength,
          type: "string",
          inclusive: true,
          message: musicFieldLimitMessage(maxLength)
        });
      }
      return;
    }

    if (trimmed.length > VIDEO_PROMPT_ENHANCE_MAX) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: VIDEO_PROMPT_ENHANCE_MAX,
        type: "string",
        inclusive: true,
        message: `Prompt must be at most ${VIDEO_PROMPT_ENHANCE_MAX} characters`
      });
    }
  });

export function assertCanvasPayloadSize(value: unknown) {
  const size = new TextEncoder().encode(JSON.stringify(value)).byteLength;
  if (size > MAX_CANVAS_SNAPSHOT_BYTES) {
    throw appError("VALIDATION_ERROR", "Canvas snapshot exceeds the 1MB limit");
  }
}
