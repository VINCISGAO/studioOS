export type AnnotationType = "circle" | "rect" | "arrow";

export interface ReviewAnnotation {
  id: string;
  type: AnnotationType;
  time: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  color: string;
}

export interface ReviewComment {
  id: string;
  time: number;
  content: string;
  createdBy: string;
  createdAt: string;
  version: number;
  annotations: ReviewAnnotation[];
}

export type ReviewTool = AnnotationType | null;

export interface ReviewVersion {
  version: number;
  label: string;
  uploadedAt: string;
}
