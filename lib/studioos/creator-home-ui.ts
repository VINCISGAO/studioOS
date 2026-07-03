import type { Locale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/order-types";
import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import {
  creatorTodayTaskLabels,
  type CreatorTodayTask
} from "@/lib/studioos/creator-order-lifecycle";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { withLocale } from "@/lib/i18n";

export const CREATOR_HOME_DEMO_CREATOR_ID = "creator_01";

export type CreatorProjectTab = "all" | "production" | "review" | "pending" | "completed";

export type CreatorProjectStatusTone = "amber" | "blue" | "violet" | "zinc" | "emerald";

export type CreatorPendingTaskCard = {
  id: string;
  tone: "purple" | "blue" | "orange";
  tag: string;
  title: string;
  subtitle: string;
  metaLines: string[];
  href: string;
  actionLabel: string;
};

export type CreatorHomeProjectRow = {
  id: string;
  title: string;
  code: string;
  brand: string;
  budget: number;
  status: StoredOrder["status"];
  statusLabel: string;
  statusTone: CreatorProjectStatusTone;
  deadline: string;
  dateLabel: string;
  progress?: number;
  href: string;
  thumbnailUrl?: string;
  listTab?: CreatorProjectTab | "all_only";
  listTabs?: CreatorProjectTab[];
};

export type CreatorHomeMessageRow = {
  id: string;
  brand: string;
  preview: string;
  time: string;
  href: string;
  brandLogoUrl?: string;
  brandTone?: string;
};

export type CreatorHomeStats = {
  totalEarnings: number;
  activeProjects: number;
  pendingTasks: number;
  verifiedLabel: string;
  avgResponseHours: number;
  earningsTrend: string;
  activeTrend: string;
  pendingTrend: string;
  responseTrend: string;
};

export type CreatorPhaseCount = {
  invitations: number;
  production: number;
  review: number;
  completed: number;
};

export function isCreatorHomeDemoCreator(creatorId: string) {
  return creatorId === CREATOR_HOME_DEMO_CREATOR_ID;
}

export function creatorHomeDemoDateLabel(locale: Locale) {
  if (locale === "zh") {
    return "今天是 2025年6月2日，星期一";
  }
  return "Monday, June 2, 2025";
}

const statusLabelsZh: Record<StoredOrder["status"], string> = {
  waiting_payment: "等待品牌选择",
  paid: "已付款",
  in_production: "制作中",
  review: "审核中",
  revision: "修改中",
  ready_for_completion: "待确认完成",
  settling: "结算中",
  dispute: "争议中",
  completed: "已完成",
  cancelled: "已取消"
};

const statusLabelsEn: Record<StoredOrder["status"], string> = {
  waiting_payment: "Awaiting brand",
  paid: "Paid",
  in_production: "In production",
  review: "In review",
  revision: "Revision",
  ready_for_completion: "Ready to complete",
  settling: "Settling",
  dispute: "Dispute",
  completed: "Completed",
  cancelled: "Cancelled"
};

const statusToneForOrder: Record<StoredOrder["status"], CreatorProjectStatusTone> = {
  waiting_payment: "amber",
  paid: "amber",
  in_production: "blue",
  review: "violet",
  revision: "violet",
  ready_for_completion: "emerald",
  settling: "emerald",
  dispute: "amber",
  completed: "emerald",
  cancelled: "zinc"
};

function formatProjectDate(iso: string, locale: Locale) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  if (locale === "zh") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function buildCreatorHomeStats(input: {
  locale: Locale;
  orders: StoredOrder[];
  pendingTasks: number;
  isVerified: boolean;
  responseRate: number;
  totalEarningsOverride?: number;
}): CreatorHomeStats {
  const activeProjects = input.orders.filter((order) =>
    ["in_production", "review", "revision", "waiting_payment"].includes(order.status)
  ).length;
  const totalEarnings =
    input.totalEarningsOverride ??
    input.orders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + order.creator_payout, 0);

  const avgResponseHours = Math.max(1, Math.round((100 - input.responseRate) / 25 + 1.8));

  if (input.locale === "zh") {
    return {
      totalEarnings,
      activeProjects,
      pendingTasks: input.pendingTasks,
      verifiedLabel: input.isVerified ? "已认证" : "待认证",
      avgResponseHours,
      earningsTrend: "较上月 ↑ 28.5%",
      activeTrend: `较上月 ↑ ${Math.max(1, activeProjects - 3)}`,
      pendingTrend: `较上月 ↓ ${Math.max(0, 4 - input.pendingTasks)}`,
      responseTrend: "较上月 ↓ 0.6h"
    };
  }

  return {
    totalEarnings,
    activeProjects,
    pendingTasks: input.pendingTasks,
    verifiedLabel: input.isVerified ? "Verified" : "Pending",
    avgResponseHours,
    earningsTrend: "vs last month ↑ 28.5%",
    activeTrend: `vs last month ↑ ${Math.max(1, activeProjects - 3)}`,
    pendingTrend: `vs last month ↓ ${Math.max(0, 4 - input.pendingTasks)}`,
    responseTrend: "vs last month ↓ 0.6h"
  };
}

export function buildDemoCreatorHomeStats(locale: Locale): CreatorHomeStats {
  if (locale === "zh") {
    return {
      totalEarnings: 128900,
      activeProjects: 5,
      pendingTasks: 3,
      verifiedLabel: "已认证",
      avgResponseHours: 2.4,
      earningsTrend: "较上月 ↑ 28.5%",
      activeTrend: "较上月 ↑ 2",
      pendingTrend: "较上月 ↓ 1",
      responseTrend: "较上月 ↓ 0.6h"
    };
  }

  return {
    totalEarnings: 128900,
    activeProjects: 5,
    pendingTasks: 3,
    verifiedLabel: "Verified",
    avgResponseHours: 2.4,
    earningsTrend: "vs last month ↑ 28.5%",
    activeTrend: "vs last month ↑ 2",
    pendingTrend: "vs last month ↓ 1",
    responseTrend: "vs last month ↓ 0.6h"
  };
}

export function buildCreatorPendingTaskCards(input: {
  locale: Locale;
  tasks: CreatorTodayTask[];
  orders: StoredOrder[];
  invitations: CreatorPortalInvitationView[];
}): CreatorPendingTaskCard[] {
  const labels = creatorTodayTaskLabels[input.locale];
  const cards: CreatorPendingTaskCard[] = [];

  if (input.tasks.includes("accept_invitation")) {
    const invitation =
      input.invitations.find((item) => item.status === "pending") ?? input.invitations[0];
    cards.push({
      id: "accept_invitation",
      tone: "purple",
      tag: input.locale === "zh" ? "即将到期" : "Due soon",
      title: input.locale === "zh" ? "接受项目邀请" : labels.accept_invitation,
      subtitle: invitation?.title ?? invitation?.brandName ?? "Campaign",
      metaLines:
        input.locale === "zh"
          ? [`品牌：${invitation?.brandName ?? "Nike"}`, "截止时间：今天 23:59"]
          : [`Brand: ${invitation?.brandName ?? "Nike"}`, "Deadline: today 23:59"],
      href: withLocale(creatorPortalRoutes.invitations, input.locale),
      actionLabel: input.locale === "zh" ? "去处理" : "Handle"
    });
  }

  if (input.tasks.includes("upload_work")) {
    const order =
      input.orders.find(
        (item) =>
          ["in_production", "revision"].includes(item.status) &&
          item.title.length > 0
      ) ?? input.orders.find((item) => item.status === "in_production");
    cards.push({
      id: "upload_work",
      tone: "blue",
      tag: input.locale === "zh" ? "待上传" : "Upload needed",
      title: input.locale === "zh" ? "上传第一版" : labels.upload_work,
      subtitle: order?.title ?? order?.company_name ?? "Project",
      metaLines:
        input.locale === "zh"
          ? [`截止时间：剩余 1 天`]
          : ["Deadline: 1 day left"],
      href: order
        ? withLocale(creatorPortalRoutes.review(order.id), input.locale)
        : withLocale(creatorPortalRoutes.projects, input.locale),
      actionLabel: input.locale === "zh" ? "去上传" : "Upload"
    });
  }

  if (input.tasks.includes("brand_review") || input.tasks.includes("wait_brand_selection")) {
    const order = input.orders.find((item) => item.status === "revision" || item.status === "review");
    cards.push({
      id: "revision",
      tone: "orange",
      tag: input.locale === "zh" ? "品牌已回复" : "Brand replied",
      title: input.locale === "zh" ? "修改第二版" : labels.brand_review,
      subtitle: order?.title ?? order?.company_name ?? "Project",
      metaLines:
        input.locale === "zh"
          ? ["品牌意见：请优化开头节奏"]
          : ["Brand feedback: tighten opening rhythm"],
      href: order
        ? withLocale(creatorPortalRoutes.review(order.id), input.locale)
        : withLocale(creatorPortalRoutes.reviewHub, input.locale),
      actionLabel: input.locale === "zh" ? "去查看" : "Review"
    });
  }

  return cards.slice(0, 3);
}

export function buildDemoCreatorPendingTaskCards(locale: Locale): CreatorPendingTaskCard[] {
  if (locale === "zh") {
    return [
      {
        id: "demo_accept",
        tone: "purple",
        tag: "即将到期",
        title: "接受项目邀请",
        subtitle: "Nike 产品广告",
        metaLines: ["品牌：Nike", "截止时间：今天 23:59"],
        href: withLocale(creatorPortalRoutes.invitations, locale),
        actionLabel: "去处理"
      },
      {
        id: "demo_upload",
        tone: "blue",
        tag: "待上传",
        title: "上传第一版",
        subtitle: "Apple iPhone 18 发布视频",
        metaLines: ["截止时间：剩余 1 天"],
        href: withLocale(creatorPortalRoutes.projects, locale),
        actionLabel: "去上传"
      },
      {
        id: "demo_revision",
        tone: "orange",
        tag: "品牌已回复",
        title: "修改第二版",
        subtitle: "DJI 新品宣传片",
        metaLines: ["品牌意见：请优化开头节奏"],
        href: withLocale(creatorPortalRoutes.reviewHub, locale),
        actionLabel: "去查看"
      }
    ];
  }

  return [
    {
      id: "demo_accept",
      tone: "purple",
      tag: "Due soon",
      title: "Accept invitation",
      subtitle: "Nike product ad",
      metaLines: ["Brand: Nike", "Deadline: today 23:59"],
      href: withLocale(creatorPortalRoutes.invitations, locale),
      actionLabel: "Handle"
    },
    {
      id: "demo_upload",
      tone: "blue",
      tag: "Upload needed",
      title: "Upload first cut",
      subtitle: "Apple iPhone 18 launch film",
      metaLines: ["Deadline: 1 day left"],
      href: withLocale(creatorPortalRoutes.projects, locale),
      actionLabel: "Upload"
    },
    {
      id: "demo_revision",
      tone: "orange",
      tag: "Brand replied",
      title: "Revise second cut",
      subtitle: "DJI product film",
      metaLines: ["Brand feedback: tighten opening rhythm"],
      href: withLocale(creatorPortalRoutes.reviewHub, locale),
      actionLabel: "Review"
    }
  ];
}

export function buildCreatorHomeProjects(input: {
  locale: Locale;
  orders: StoredOrder[];
}): CreatorHomeProjectRow[] {
  const labels = input.locale === "zh" ? statusLabelsZh : statusLabelsEn;

  return input.orders
    .filter((order) => order.status !== "cancelled")
    .slice(0, 6)
    .map((order, index) => {
      const deadline = order.completed_at ?? order.paid_at ?? order.created_at;
      return {
        id: order.id,
        title: order.title || order.company_name,
        code: `#CAM-${order.created_at.slice(0, 10).replace(/-/g, "")}-${String(index + 1).padStart(2, "0")}`,
        brand: order.company_name || order.client_name,
        budget: order.creator_payout,
        status: order.status,
        statusLabel: labels[order.status],
        statusTone: statusToneForOrder[order.status],
        deadline,
        dateLabel: formatProjectDate(deadline, input.locale),
        progress:
          order.status === "in_production" || order.status === "revision"
            ? 60
            : order.status === "review"
              ? 80
              : undefined,
        href: withLocale(creatorPortalRoutes.project(order.id), input.locale)
      };
    });
}

export function buildDemoCreatorHomeProjects(locale: Locale): CreatorHomeProjectRow[] {
  const projectsHref = withLocale(creatorPortalRoutes.projects, locale);

  if (locale === "zh") {
    return [
      {
        id: "demo_proj_nike",
        title: "Nike 产品广告",
        code: "#CAM-2025-0601",
        brand: "Nike",
        budget: 8500,
        status: "waiting_payment",
        statusLabel: "等待品牌选择",
        statusTone: "amber",
        deadline: "2025-06-05",
        dateLabel: "2025-06-05",
        href: projectsHref,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=240&auto=format&fit=crop",
        listTab: "all_only"
      },
      {
        id: "demo_proj_apple",
        title: "Apple iPhone 18 发布视频",
        code: "#CAM-2025-0602",
        brand: "Apple",
        budget: 12000,
        status: "in_production",
        statusLabel: "制作中",
        statusTone: "blue",
        deadline: "2025-06-06",
        dateLabel: "2025-06-06",
        progress: 60,
        href: projectsHref,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=240&auto=format&fit=crop",
        listTab: "production"
      },
      {
        id: "demo_proj_dji",
        title: "DJI 新品宣传片",
        code: "#CAM-2025-0603",
        brand: "DJI",
        budget: 6800,
        status: "review",
        statusLabel: "审核中",
        statusTone: "violet",
        deadline: "2025-06-03",
        dateLabel: "2025-06-03",
        href: projectsHref,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=240&auto=format&fit=crop",
        listTabs: ["production", "review"]
      },
      {
        id: "demo_proj_bmw",
        title: "BMW 品牌故事短片",
        code: "#CAM-2025-0604",
        brand: "BMW",
        budget: 9000,
        status: "waiting_payment",
        statusLabel: "待开始",
        statusTone: "zinc",
        deadline: "2025-06-08",
        dateLabel: "2025-06-08",
        href: projectsHref,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=240&auto=format&fit=crop",
        listTab: "pending"
      },
      {
        id: "demo_proj_coke",
        title: "Coca-Cola 夏季广告",
        code: "#CAM-2025-0605",
        brand: "Coca-Cola",
        budget: 7500,
        status: "completed",
        statusLabel: "已完成",
        statusTone: "emerald",
        deadline: "2025-05-28",
        dateLabel: "2025-05-28",
        href: projectsHref,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?q=80&w=240&auto=format&fit=crop",
        listTab: "completed"
      }
    ];
  }

  return [
    {
      id: "demo_proj_nike",
      title: "Nike product ad",
      code: "#CAM-2025-0601",
      brand: "Nike",
      budget: 8500,
      status: "waiting_payment",
      statusLabel: "Awaiting brand",
      statusTone: "amber",
      deadline: "2025-06-05",
      dateLabel: "Jun 5, 2025",
      href: projectsHref,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=240&auto=format&fit=crop",
      listTab: "all_only"
    },
    {
      id: "demo_proj_apple",
      title: "Apple iPhone 18 launch film",
      code: "#CAM-2025-0602",
      brand: "Apple",
      budget: 12000,
      status: "in_production",
      statusLabel: "In production",
      statusTone: "blue",
      deadline: "2025-06-06",
      dateLabel: "Jun 6, 2025",
      progress: 60,
      href: projectsHref,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=240&auto=format&fit=crop",
      listTab: "production"
    },
    {
      id: "demo_proj_dji",
      title: "DJI product film",
      code: "#CAM-2025-0603",
      brand: "DJI",
      budget: 6800,
      status: "review",
      statusLabel: "In review",
      statusTone: "violet",
      deadline: "2025-06-03",
      dateLabel: "Jun 3, 2025",
      href: projectsHref,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=240&auto=format&fit=crop",
      listTabs: ["production", "review"]
    },
    {
      id: "demo_proj_bmw",
      title: "BMW brand story",
      code: "#CAM-2025-0604",
      brand: "BMW",
      budget: 9000,
      status: "waiting_payment",
      statusLabel: "Pending start",
      statusTone: "zinc",
      deadline: "2025-06-08",
      dateLabel: "Jun 8, 2025",
      href: projectsHref,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=240&auto=format&fit=crop",
      listTab: "pending"
    },
    {
      id: "demo_proj_coke",
      title: "Coca-Cola summer ad",
      code: "#CAM-2025-0605",
      brand: "Coca-Cola",
      budget: 7500,
      status: "completed",
      statusLabel: "Completed",
      statusTone: "emerald",
      deadline: "2025-05-28",
      dateLabel: "May 28, 2025",
      href: projectsHref,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?q=80&w=240&auto=format&fit=crop",
      listTab: "completed"
    }
  ];
}

export function buildDemoCreatorHomeMessages(locale: Locale): CreatorHomeMessageRow[] {
  const messagesHref = withLocale(creatorPortalRoutes.messages, locale);

  if (locale === "zh") {
    return [
      {
        id: "demo_msg_nike",
        brand: "Nike",
        preview: "Nike 对项目「产品广告」选择了您！",
        time: "10:30",
        href: messagesHref,
        brandTone: "bg-zinc-900"
      },
      {
        id: "demo_msg_dji",
        brand: "DJI",
        preview: "品牌方对第二版提出了修改意见，请查看批注。",
        time: "昨天 16:45",
        href: messagesHref,
        brandTone: "bg-zinc-800"
      },
      {
        id: "demo_msg_apple",
        brand: "Apple",
        preview: "项目「iPhone 18 发布视频」已通过品牌验收。",
        time: "Jun 28",
        href: messagesHref,
        brandTone: "bg-zinc-700"
      }
    ];
  }

  return [
    {
      id: "demo_msg_nike",
      brand: "Nike",
      preview: "Nike selected you for the product ad project.",
      time: "10:30",
      href: messagesHref,
      brandTone: "bg-zinc-900"
    },
    {
      id: "demo_msg_dji",
      brand: "DJI",
      preview: "The brand left revision notes on your second cut.",
      time: "Yesterday 16:45",
      href: messagesHref,
      brandTone: "bg-zinc-800"
    },
    {
      id: "demo_msg_apple",
      brand: "Apple",
      preview: "Your iPhone 18 launch film was approved.",
      time: "Jun 28",
      href: messagesHref,
      brandTone: "bg-zinc-700"
    }
  ];
}

export function buildDemoCreatorPhaseCounts(): CreatorPhaseCount {
  return {
    invitations: 2,
    production: 2,
    review: 1,
    completed: 1
  };
}

export function buildCreatorPhaseCounts(input: {
  invitations: CreatorPortalInvitationView[];
  orders: StoredOrder[];
}): CreatorPhaseCount {
  return {
    invitations: input.invitations.filter((item) =>
      ["pending", "accepted", "selected"].includes(item.status)
    ).length,
    production: input.orders.filter((item) =>
      ["in_production", "revision"].includes(item.status)
    ).length,
    review: input.orders.filter((item) => item.status === "review").length,
    completed: input.orders.filter((item) => item.status === "completed").length
  };
}

export function projectTabForStatus(status: StoredOrder["status"]): CreatorProjectTab {
  if (status === "completed") return "completed";
  if (status === "review") return "review";
  if (status === "waiting_payment") return "pending";
  if (status === "in_production" || status === "revision") return "production";
  return "pending";
}

export function matchesProjectTab(row: CreatorHomeProjectRow, tab: CreatorProjectTab): boolean {
  if (tab === "all") return true;
  if (row.listTab === "all_only") return false;
  if (row.listTabs?.length) return row.listTabs.includes(tab);
  if (row.listTab) return row.listTab === tab;
  return projectTabForStatus(row.status) === tab;
}

export function countProjectsForTab(projects: CreatorHomeProjectRow[], tab: CreatorProjectTab): number {
  if (tab === "all") return projects.length;
  return projects.filter((row) => matchesProjectTab(row, tab)).length;
}

export function projectStatusToneClass(tone: CreatorProjectStatusTone) {
  switch (tone) {
    case "amber":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "blue":
      return "bg-blue-50 text-blue-700 ring-blue-100";
    case "violet":
      return "bg-violet-50 text-violet-700 ring-violet-100";
    case "emerald":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    default:
      return "bg-zinc-100 text-zinc-600 ring-zinc-200";
  }
}

export function trendToneClass(trend: string | null) {
  if (!trend) return "text-zinc-500";
  if (trend.includes("↓")) return "text-rose-600";
  if (trend.includes("↑")) return "text-emerald-600";
  return "text-zinc-500";
}
