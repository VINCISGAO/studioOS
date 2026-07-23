import type { Edge, Node, Viewport } from "@xyflow/react";

export const CANVAS_NODE_TYPES = [
  "image",
  "video",
  "music",
  "text",
  "frame",
  "upload",
  "loading"
] as const;

export type CanvasNodeType = (typeof CANVAS_NODE_TYPES)[number];
export type CanvasMediaStatus = "idle" | "loading" | "ready" | "failed";

export type CanvasNodeData = {
  [key: string]: unknown;
  title: string;
  status: CanvasMediaStatus;
  prompt?: string;
  url?: string;
  assetId?: string;
  fileName?: string;
  mimeType?: string;
  jobId?: string;
  generationType?: "IMAGE" | "VIDEO" | "MUSIC";
  progress?: number;
  error?: string;
  locked?: boolean;
  hidden?: boolean;
  text?: string;
  skill?: string;
  generationModel?: string;
  generationParameters?: Record<string, string | number | boolean>;
  generationMode?: string;
  chargedCredits?: number;
  layoutKind?: "VIDEO_GENERATION" | "IMAGE_GENERATION" | "MUSIC_GENERATION";
  layoutIndex?: number;
};

export type VincisCanvasNode = Node<CanvasNodeData, CanvasNodeType>;
export type VincisCanvasEdge = Edge;

export type CanvasSnapshot = {
  projectId: string;
  canvasId: string;
  mode: "STANDALONE" | "ORDER";
  title: string;
  campaignId: string | null;
  campaignTitle: string;
  projectContext: {
    orderId: string | null;
    clientName: string | null;
    deadline: string | null;
    currentVersion: number;
    reviewHref: string | null;
    creditsUsed: number;
    tokenBalance: number;
    reservedCredits?: number;
    brandKit: {
      connected: boolean;
      logoUrl: string | null;
      assetCount: number;
      hasBrandDna: boolean;
    };
  };
  nodes: VincisCanvasNode[];
  edges: VincisCanvasEdge[];
  viewport: Viewport;
  canvasBackgroundColor: string;
  version: number;
  updatedAt: string;
};

export const DIRECTOR_SKILLS = [
  "AD_VIDEO",
  "PRODUCT_FILM",
  "SEEDANCE_VIDEO",
  "IMAGE_TO_VIDEO",
  "BRAND_KEY_VISUAL",
  "SOCIAL_AD",
  "MUSIC_SCORE",
  "LOGO_MOTION"
] as const;

export type DirectorSkill = (typeof DIRECTOR_SKILLS)[number];

export type CanvasAction =
  | {
      type: "CREATE_NODE";
      node: {
        id: string;
        nodeType: "image" | "video" | "music" | "text";
        title: string;
        prompt?: string;
        text?: string;
        x: number;
        y: number;
        width: number;
        height: number;
        parentId?: string;
      };
    }
  | {
      type: "UPDATE_NODE";
      nodeId: string;
      patch: Partial<CanvasNodeData>;
    }
  | {
      type: "CREATE_FRAME";
      frame: {
        id: string;
        title: string;
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }
  | {
      type: "CONNECT_NODES";
      sourceId: string;
      targetId: string;
    }
  | {
      type: "START_GENERATION";
      nodeId: string;
      generationType: "IMAGE" | "VIDEO" | "MUSIC";
    }
  | {
      type: "AUTO_LAYOUT";
      nodeIds: string[];
    };

export type CanvasDirectorPlan = {
  planId: string;
  projectId: string;
  message: string;
  skill: DirectorSkill;
  actions: CanvasAction[];
  estimatedCredits: number;
  estimatedTime: { minMinutes: number; maxMinutes: number };
  requiresConfirmation: true;
  provider: string;
};

export type GenerationJobEvent = {
  id: string;
  nodeId: string | null;
  type: "IMAGE" | "VIDEO" | "MUSIC";
  status: "QUEUED" | "SUBMITTING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  progress: number;
  outputAssetId: string | null;
  errorMessage: string | null;
  chargedCredits?: number;
  creditsRefunded?: number;
};
