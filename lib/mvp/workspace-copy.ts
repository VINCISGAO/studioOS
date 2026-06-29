import type { Locale } from "@/lib/i18n";

export const workspaceCopy = {
  studio: {
    en: {
      eyebrow: "Review center",
      title: "Assigned projects",
      subtitle: "Open a project to review versions, leave timestamp notes, and resolve brand feedback.",
      brand: "Brand",
      status: "Status",
      issues: "Open issues",
      version: "Latest version",
      action: "Action",
      review: "Open review",
      empty: "No assigned projects yet.",
      issuesCount: (n: number, v: number) => `${n} open issues · v${v} uploaded`
    },
    zh: {
      eyebrow: "审片中心",
      title: "分配项目",
      subtitle: "进入项目审阅版本、打时间戳批注，并处理 Brand 反馈。",
      brand: "品牌",
      status: "状态",
      issues: "待处理意见",
      version: "最新版本",
      action: "操作",
      review: "进入审片",
      empty: "暂无分配项目。",
      issuesCount: (n: number, v: number) => `${n} 条待处理 · 已上传 v${v}`
    }
  },
  brand: {
    en: {
      eyebrow: "Review center",
      title: "My projects",
      subtitle: "Review studio drafts and approve final cuts.",
      newProject: "New project",
      review: "Open review",
      empty: "No projects yet. Create one to start reviewing video drafts.",
      meta: (v: number | string, n: number) => `Latest v${v} · ${n} open issues`
    },
    zh: {
      eyebrow: "审片中心",
      title: "我的项目",
      subtitle: "审阅 Studio 提交的版本，并确认最终成片。",
      newProject: "新建项目",
      review: "进入审片",
      empty: "还没有项目。新建后即可开始审片。",
      meta: (v: number | string, n: number) => `最新 v${v} · ${n} 条待处理`
    }
  },
  review: {
    en: {
      project: "Project",
      brand: "Brand",
      versions: "Versions",
      issuesMeta: (open: number, resolved: number) => `${open} open · ${resolved} resolved`,
      upload: "Upload MP4",
      version: (n: number) => `Version ${n}`,
      noVideo: "No video uploaded yet.",
      addComment: "Add comment at current time",
      commentPlaceholder: "e.g. Logo too small at this frame",
      addIssue: "Add issue",
      issues: "Issues",
      open: "Open",
      resolved: "Resolved",
      total: "Total",
      resolve: "Resolve",
      reopen: "Reopen",
      noIssues: "No issues on this version yet.",
      noIssuesBrand: " Play the video and add a comment at the current time.",
      requestRevision: "Request revision",
      approveFinal: "Approve final",
      approvedFlash: "Final ad approved. Project marked as approved.",
      revisionFlash: "Revision requested. Studio can upload a new version.",
      commentStatus: { open: "open", resolved: "resolved", reopened: "reopened" }
    },
    zh: {
      project: "项目",
      brand: "品牌",
      versions: "版本数",
      issuesMeta: (open: number, resolved: number) => `${open} 条待处理 · ${resolved} 条已解决`,
      upload: "上传 MP4",
      version: (n: number) => `版本 ${n}`,
      noVideo: "还没有上传视频。",
      addComment: "在当前时间点添加批注",
      commentPlaceholder: "例如：这一帧 Logo 太小",
      addIssue: "添加意见",
      issues: "审片意见",
      open: "待处理",
      resolved: "已解决",
      total: "全部",
      resolve: "标记已解决",
      reopen: "重新打开",
      noIssues: "这个版本还没有审片意见。",
      noIssuesBrand: "播放视频后，可在当前时间点添加批注。",
      requestRevision: "要求修改",
      approveFinal: "确认定稿",
      approvedFlash: "已定稿，项目状态已更新为已通过。",
      revisionFlash: "已发起修改请求，Studio 可上传新版本。",
      commentStatus: { open: "待处理", resolved: "已解决", reopened: "已重开" }
    }
  }
} as const;

export function wsCopy<T extends keyof typeof workspaceCopy>(
  section: T,
  locale: Locale
): (typeof workspaceCopy)[T][Locale] {
  return workspaceCopy[section][locale];
}
