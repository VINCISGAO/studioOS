import type { ReviewComment, ReviewVersion } from "@/features/review/review.types";
import { REVIEW_ANNOTATION_COLOR } from "@/features/review/review.constants";

export const mockReviewVersions: ReviewVersion[] = [
  { version: 1, label: "Version 1", uploadedAt: "2026-06-28T10:00:00.000Z" },
  { version: 2, label: "Version 2", uploadedAt: "2026-06-30T14:30:00.000Z" }
];

export const mockReviewComments: ReviewComment[] = [
  {
    id: "rc_mock_01",
    time: 8,
    content: "Logo 再大一点，留出安全边距。",
    createdBy: "品牌方",
    createdAt: "2026-06-30T15:02:00.000Z",
    version: 2,
    annotations: [
      {
        id: "ann_mock_01",
        type: "circle",
        time: 8,
        x: 0.72,
        y: 0.18,
        width: 0.12,
        color: REVIEW_ANNOTATION_COLOR
      }
    ]
  },
  {
    id: "rc_mock_02",
    time: 18,
    content: "这里的字幕改成白色，背景压暗 20%。",
    createdBy: "品牌方",
    createdAt: "2026-06-30T15:05:00.000Z",
    version: 2,
    annotations: [
      {
        id: "ann_mock_02",
        type: "rect",
        time: 18,
        x: 0.22,
        y: 0.68,
        width: 0.56,
        height: 0.12,
        color: REVIEW_ANNOTATION_COLOR
      },
      {
        id: "ann_mock_03",
        type: "arrow",
        time: 18,
        x: 0.5,
        y: 0.55,
        endX: 0.5,
        endY: 0.68,
        color: REVIEW_ANNOTATION_COLOR
      }
    ]
  }
];
