import type { Locale } from "@/lib/i18n";

export const brandReviewHubCopy = {
  zh: {
    title: "审片中心",
    subtitle: "查看制作团队提交的版本，添加时间码反馈并批准交付。与创作者共享同一套审片数据。",
    guide: "审片指南",
    guideTitle: "如何使用审片中心？",
    guideIntro:
      "审片中心是品牌方与创作者共同协作审核视频的地方。所有版本、批注和审核记录都会实时同步，避免重复沟通，确保每一次修改都有据可查。",
    filters: {
      all: "全部项目",
      pending: "待审阅",
      revision: "需要修改",
      approved: "已批准",
      archived: "已归档"
    },
    dateAll: "全部时间",
    date7d: "近 7 天",
    date30d: "近 30 天",
    date90d: "近 90 天",
    search: "搜索项目或版本",
    empty: "暂无审片项目",
    emptyBody: "制作团队上传审片版后，会出现在这里。",
    publish: "发布广告需求",
    open: "进入审片",
    versions: (n: number) => `${n} 个版本`,
    comments: (n: number) => `${n} 条未解决批注`,
    features: [
      {
        title: "高效审阅",
        body: "支持时间码评论、批注标记和版本对比，让反馈更精准。",
        iconKey: "shield" as const,
        tone: "bg-violet-100 text-violet-700"
      },
      {
        title: "安全可靠",
        body: "所有审片内容仅限项目成员访问，保障您的创意安全。",
        iconKey: "lock" as const,
        tone: "bg-sky-100 text-sky-700"
      },
      {
        title: "版本管理",
        body: "自动记录所有版本与反馈历史，方便追溯与管理。",
        iconKey: "clock" as const,
        tone: "bg-emerald-100 text-emerald-700"
      },
      {
        title: "协作无缝",
        body: "与制作团队实时协作，加速项目交付进度。",
        iconKey: "users" as const,
        tone: "bg-amber-100 text-amber-700"
      }
    ],
    status: {
      review: "待审阅",
      revision: "需要修改",
      completed: "已批准",
      in_production: "制作中",
      paid: "待上传"
    }
  },
  en: {
    title: "Review center",
    subtitle:
      "Review studio submissions, leave timed feedback, and approve delivery — synced with the creator review center.",
    guide: "Review guide",
    guideTitle: "How to use review center",
    guideIntro:
      "The review center is where brands and creators review videos together. Versions, comments, and records stay in sync.",
    filters: {
      all: "All projects",
      pending: "Pending review",
      revision: "Revision needed",
      approved: "Approved",
      archived: "Archived"
    },
    dateAll: "All time",
    date7d: "Last 7 days",
    date30d: "Last 30 days",
    date90d: "Last 90 days",
    search: "Search project or version",
    empty: "No review projects yet",
    emptyBody: "When a studio uploads a review version, it will appear here.",
    publish: "Publish ad brief",
    open: "Open review",
    versions: (n: number) => `${n} version${n === 1 ? "" : "s"}`,
    comments: (n: number) => `${n} open comment${n === 1 ? "" : "s"}`,
    features: [
      {
        title: "Efficient review",
        body: "Timed comments, annotations, and version compare keep feedback precise.",
        iconKey: "shield" as const,
        tone: "bg-violet-100 text-violet-700"
      },
      {
        title: "Secure",
        body: "Review content is visible only to project members.",
        iconKey: "lock" as const,
        tone: "bg-sky-100 text-sky-700"
      },
      {
        title: "Version history",
        body: "Every version and feedback thread is recorded for traceability.",
        iconKey: "clock" as const,
        tone: "bg-emerald-100 text-emerald-700"
      },
      {
        title: "Seamless collaboration",
        body: "Work with studios in real time to speed up delivery.",
        iconKey: "users" as const,
        tone: "bg-amber-100 text-amber-700"
      }
    ],
    status: {
      review: "Pending review",
      revision: "Revision",
      completed: "Approved",
      in_production: "In production",
      paid: "Awaiting upload"
    }
  }
} as const;

export type ReviewHubFilter = "all" | "pending" | "revision" | "approved" | "archived";
export type DateFilter = "all" | "7d" | "30d" | "90d";

export const reviewHubFilterOrder: ReviewHubFilter[] = ["all", "pending", "revision", "approved", "archived"];

export function reviewFilterBucket(item: { status: string }): Exclude<ReviewHubFilter, "all"> | null {
  if (item.status === "review") return "pending";
  if (item.status === "revision") return "revision";
  if (item.status === "completed") return "approved";
  if (item.status === "ready_for_completion" || item.status === "settling") return "archived";
  return null;
}

export function matchesReviewDateFilter(updatedAt: string, dateFilter: DateFilter) {
  if (dateFilter === "all") return true;
  const days = dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(updatedAt).getTime() >= cutoff;
}

export function brandReviewHubText(locale: Locale) {
  return brandReviewHubCopy[locale];
}
