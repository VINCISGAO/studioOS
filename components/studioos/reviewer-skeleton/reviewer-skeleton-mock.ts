import type { Locale } from "@/lib/i18n";

export type ReviewerSkeletonComment = {
  id: string;
  author: string;
  timeLabel: string;
  timestampSec: number;
  body: string;
  status: "open" | "resolved";
};

export type ReviewerSkeletonVersion = {
  version: number;
  label: string;
  notes: string;
  active?: boolean;
};

export type ReviewerSkeletonMock = {
  campaignTitle: string;
  orderId: string;
  createdAtLabel: string;
  statusLabel: string;
  durationSec: number;
  currentSec: number;
  currentTimeLabel: string;
  durationLabel: string;
  comments: ReviewerSkeletonComment[];
  versions: ReviewerSkeletonVersion[];
  commentPlaceholder: string;
  sendLabel: string;
};

export function getReviewerSkeletonMock(locale: Locale): ReviewerSkeletonMock {
  if (locale === "zh") {
    return {
      campaignTitle: "我的产品 Campaign",
      orderId: "ord_demo_nova_active",
      createdAtLabel: "2026-07-01",
      statusLabel: "待审片",
      durationSec: 42,
      currentSec: 12,
      currentTimeLabel: "00:12",
      durationLabel: "00:42",
      commentPlaceholder: "描述需要修改的内容…",
      sendLabel: "发送",
      comments: [
        {
          id: "c1",
          author: "品牌方",
          timeLabel: "00:07",
          timestampSec: 7,
          body: "Logo 放大一点，产品特写再慢一点。",
          status: "open"
        },
        {
          id: "c2",
          author: "品牌方",
          timeLabel: "00:21",
          timestampSec: 21,
          body: "字幕颜色太浅，结尾 CTA 再清晰一些。",
          status: "resolved"
        }
      ],
      versions: [
        { version: 1, label: "V1", notes: "首版审片", active: true },
        { version: 2, label: "V2", notes: "Logo 调整版" }
      ]
    };
  }

  return {
    campaignTitle: "My Product Campaign",
    orderId: "ord_demo_nova_active",
    createdAtLabel: "Jul 1, 2026",
    statusLabel: "Pending review",
    durationSec: 42,
    currentSec: 12,
    currentTimeLabel: "00:12",
    durationLabel: "00:42",
    commentPlaceholder: "Describe what needs to change…",
    sendLabel: "Send",
    comments: [
      {
        id: "c1",
        author: "Brand",
        timeLabel: "00:07",
        timestampSec: 7,
        body: "Make the logo slightly larger and slow down the product close-up.",
        status: "open"
      },
      {
        id: "c2",
        author: "Brand",
        timeLabel: "00:21",
        timestampSec: 21,
        body: "Subtitle contrast is too low; sharpen the ending CTA.",
        status: "resolved"
      }
    ],
    versions: [
      { version: 1, label: "V1", notes: "First review cut", active: true },
      { version: 2, label: "V2", notes: "Logo revision" }
    ]
  };
}
