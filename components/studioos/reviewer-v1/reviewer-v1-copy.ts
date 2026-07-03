import type { Locale } from "@/lib/i18n";

export const reviewerV1Copy = {
  en: {
    reviewPending: "Pending review",
    back: "Back",
    download: "Download",
    compare: "Version compare",
    completeReview: "Complete review",
    toolbar: {
      select: "Select",
      pen: "Pen",
      arrow: "Arrow",
      rect: "Rectangle",
      circle: "Circle",
      text: "Text",
      delete: "Delete",
      eraser: "Eraser",
      undo: "Undo",
      clearAll: "Clear annotations"
    },
    comments: {
      all: "All",
      open: "Pending",
      resolved: "Resolved",
      empty: "No comments yet",
      add: "Add comment",
      placeholder: "Describe what should change...",
      brandOnly: "Only the brand can leave comments",
      noVideo: "No video yet — leave text feedback at 0:00",
      textOnlyFallback: "Video unavailable — text feedback at 0:00 is still saved",
      send: "Send",
      openStatus: "Open",
      resolvedStatus: "Resolved"
    },
    timeline: {
      label: "Timeline"
    },
    versions: {
      title: "Versions",
      current: "Current",
      upload: "Upload new version",
      notes: "Version notes"
    },
    player: {
      pauseToComment: "Pause video before commenting",
      loadingVideo: "Loading video…",
      videoMissing: "No video uploaded for this version",
      videoLoadFailed: "Video failed to load — the file may have been removed",
      videoLoadFailedCreator: "Upload a new MP4 from the version dock below",
      quality: "1080P",
      speed: "Speed"
    }
  },
  zh: {
    reviewPending: "待审片",
    back: "返回",
    download: "下载",
    compare: "版本对比",
    completeReview: "完成审片",
    toolbar: {
      select: "选择",
      pen: "画笔",
      arrow: "箭头",
      rect: "矩形",
      circle: "圆形",
      text: "文本",
      delete: "删除",
      eraser: "橡皮擦",
      undo: "撤销",
      clearAll: "清空批注"
    },
    comments: {
      all: "全部",
      open: "待处理",
      resolved: "已解决",
      empty: "暂无评论",
      add: "添加评论",
      placeholder: "描述需要修改的内容...",
      brandOnly: "仅品牌方可留言",
      noVideo: "暂无视频 — 可在 0:00 提交文字反馈",
      textOnlyFallback: "视频无法播放 — 仍可在 0:00 提交文字反馈",
      send: "发送",
      openStatus: "待处理",
      resolvedStatus: "已解决"
    },
    timeline: {
      label: "时间线"
    },
    versions: {
      title: "版本",
      current: "当前版本",
      upload: "上传新版本",
      notes: "版本说明"
    },
    player: {
      pauseToComment: "请先暂停视频再评论",
      loadingVideo: "视频加载中…",
      videoMissing: "此版本尚未上传视频",
      videoLoadFailed: "视频加载失败 — 文件可能已被清理",
      videoLoadFailedCreator: "请在下方版本栏重新上传 MP4",
      quality: "1080P",
      speed: "倍速"
    }
  }
} as const;

export function getReviewerV1Copy(locale: Locale) {
  return reviewerV1Copy[locale];
}
