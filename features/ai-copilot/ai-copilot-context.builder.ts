import { normalizeLanguageCode } from "@/features/i18n/language.constants";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { PermissionService } from "@/features/auth/permission.service";
import { brandCampaignQueryService } from "@/features/campaign/brand-campaign/brand-campaign-query.service";
import { getOrderForProject, listOrdersForClient } from "@/lib/order-service";
import { toBrandProjectRows } from "@/lib/studioos/brand-dashboard";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { appError } from "@/lib/core/errors";
import type { AiCopilotContext, AiCopilotPageContext } from "@/features/ai-copilot/ai-copilot.types";
import { normalizeCopilotRole } from "@/features/ai-copilot/ai-copilot.types";
import { getProject } from "@/lib/project-service";
import { canvasRepository } from "@/features/canvas/canvas.repository";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import {
  BRAND_PAYMENT_DEADLINE_MINUTES,
  BRAND_PAYMENT_TIMEOUT_CANCEL_REASON,
  formatBrandPaymentDeadlineRemaining,
  isBrandPaymentTimeoutCancellation,
  resolveBrandPaymentDeadlineAt
} from "@/lib/studioos/brand-payment-deadline";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export class AiCopilotContextBuilder {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async build(user: AuthUserDto, page: AiCopilotPageContext = {}): Promise<AiCopilotContext> {
    this.assertDb();
    const role = normalizeCopilotRole(user);
    if (role === "ADMIN" || role === "SUPPORT") {
      PermissionService.assert(user, role === "ADMIN" ? "admin.overview.read" : "campaign.read");
    } else {
      PermissionService.assert(user, "campaign.read");
    }
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, country: true, timezone: true, languageCode: true, language: true }
    });
    const language = normalizeLanguageCode(page.languageCode ?? dbUser?.languageCode ?? dbUser?.language ?? user.languageCode);

    const aiFeedback = await this.aiFeedbackSummary(user.id, role);

    const baseSummaries =
      role === "ADMIN" || role === "SUPPORT"
        ? await this.adminSummary()
        : role === "CREATOR"
          ? await this.creatorSummary(user.id)
          : await this.brandSummary(user.id, user.email, language, page);

    const summaries = { ...baseSummaries, aiFeedback };

    if (page.entityType === "canvas" && page.entityId) {
      const canvas = await this.canvasSummary(page.entityId, user.id);
      return {
        ...page,
        user: {
          id: user.id,
          email: user.email,
          role,
          fullName: user.fullName,
          languageCode: language
        },
        language,
        country: dbUser?.country ?? null,
        timezone: dbUser?.timezone ?? null,
        summaries: {
          ...summaries,
          canvas,
          currentPage: {
            pagePath: page.pagePath ?? null,
            entityType: "canvas",
            entityId: page.entityId,
            canvas
          }
        }
      };
    }

    return {
      ...page,
      user: {
        id: user.id,
        email: user.email,
        role,
        fullName: user.fullName,
        languageCode: language
      },
      language,
      country: dbUser?.country ?? null,
      timezone: dbUser?.timezone ?? null,
      summaries
    };
  }

  private async canvasSummary(projectId: string, ownerId: string) {
    const project = await canvasRepository.findProjectForOwner(projectId, ownerId);
    if (!project) return null;
    const canvas = await canvasRepository.findCanvas(projectId);
    const nodes = canvas?.nodes ?? [];
    return {
      projectId,
      title: project.title,
      mode: project.mode,
      campaignTitle: project.campaign?.title ?? null,
      nodeCount: nodes.length,
      nodes: nodes.slice(0, 24).map((node) => {
        const data =
          node.data && typeof node.data === "object" && !Array.isArray(node.data)
            ? (node.data as Record<string, unknown>)
            : {};
        return {
          id: node.id,
          type: node.type,
          title: typeof data.title === "string" ? data.title : node.type,
          status: typeof data.status === "string" ? data.status : null,
          prompt: typeof data.prompt === "string" ? data.prompt.slice(0, 160) : null
        };
      })
    };
  }

  private async aiFeedbackSummary(userId: string, role: string) {
    const ownerWhere =
      role === "CREATOR"
        ? { ownerType: "CREATOR" as const, creatorId: userId }
        : role === "BRAND"
          ? { ownerType: "BRAND" as const, brandId: userId }
          : null;
    if (!ownerWhere) return [];

    const facts = await prisma.memoryFact.findMany({
      where: {
        ...ownerWhere,
        category: "ai_copilot_feedback"
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { factKey: true, factValue: true, updatedAt: true }
    });
    return facts.map((fact) => ({
      key: fact.factKey,
      value: fact.factValue,
      updatedAt: fact.updatedAt.toISOString()
    }));
  }

  private async brandSummary(userId: string, userEmail: string, language: string, page: AiCopilotPageContext) {
    const locale = language === "en" ? "en" : "zh";
    const [portalProjects, portalOrders, notifications] = await Promise.all([
      brandCampaignQueryService.listForClientEmail(userEmail),
      listOrdersForClient(userEmail),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, content: true, readAt: true, createdAt: true }
      })
    ]);

    const visibleRows = toBrandProjectRows(portalOrders, portalProjects, locale);
    const draftRows = visibleRows.filter((row) => row.phase === "draft");
    const activeRows = visibleRows.filter((row) => row.phase === "active");
    const doneRows = visibleRows.filter((row) => row.phase === "done");

    const pageProject =
      page.entityType === "project" && page.entityId
        ? await getProject(page.entityId).catch(() => null)
        : null;
    const currentProject =
      pageProject?.client_email.toLowerCase() === userEmail.toLowerCase() ? pageProject : null;
    const currentOrder =
      currentProject ? await getOrderForProject(currentProject.id).catch(() => null) : null;
    const currentCampaignRow = currentProject
      ? visibleRows.find((item) => item.id === currentProject.id) ?? null
      : null;
    const currentCampaignStatus = currentProject ? normalizeCampaignStatus(currentProject.status) : null;
    const currentOrderCancelled =
      currentOrder?.status === "cancelled" || currentCampaignStatus === "cancelled";
    const paymentTimeoutCancelled = currentOrder ? isBrandPaymentTimeoutCancellation(currentOrder) : false;
    const rawCancellationReason =
      currentOrder?.cancel_reason ??
      (typeof currentProject?.settings_json?.cancellation === "object" &&
      currentProject.settings_json.cancellation !== null &&
      !Array.isArray(currentProject.settings_json.cancellation)
        ? (currentProject.settings_json.cancellation as { reason?: unknown }).reason
        : null);
    const cancellationReason =
      rawCancellationReason === BRAND_PAYMENT_TIMEOUT_CANCEL_REASON
        ? locale === "zh"
          ? "订单因下单后 30 分钟内未完成付款而自动取消。"
          : "The order was automatically cancelled because payment was not completed within 30 minutes."
        : typeof rawCancellationReason === "string"
          ? rawCancellationReason
          : null;
    const paymentDeadlineRemaining = currentOrder ? formatBrandPaymentDeadlineRemaining(currentOrder, locale) : null;

    return {
      currentPage:
        currentProject || currentOrder
          ? {
              pagePath: page.pagePath ?? null,
              entityType: page.entityType ?? null,
              entityId: page.entityId ?? null,
              project: currentProject
                ? {
                    id: currentProject.id,
                    title: currentProject.title,
                    rawStatus: currentProject.status,
                    normalizedStatus: currentCampaignStatus,
                    wizardStep: currentProject.wizard_step,
                    selectedStudioId: currentProject.selected_studio_id,
                    budgetRange: currentProject.budget_range,
                    deadline: currentProject.deadline,
                    rowStatus: currentCampaignRow?.status ?? null,
                    rowPhase: currentCampaignRow?.phase ?? null
                  }
                : null,
              order: currentOrder
                ? {
                    id: currentOrder.id,
                    projectId: currentOrder.project_id,
                    title: currentOrder.title,
                    status: currentOrder.status,
                    paymentStatus: currentOrder.payment_status,
                    amount: Number(currentOrder.amount),
                    currency: "USD",
                    createdAt: currentOrder.created_at,
                    paidAt: currentOrder.paid_at,
                    cancelledAt: currentOrder.cancelled_at ?? null,
                    cancelledBy: currentOrder.cancelled_by ?? null,
                    cancelReason: currentOrder.cancel_reason ?? null
                  }
                : null,
              paymentDeadline: currentOrder
                ? {
                    policyMinutes: BRAND_PAYMENT_DEADLINE_MINUTES,
                    deadlineAt: resolveBrandPaymentDeadlineAt(currentOrder).toISOString(),
                    remaining: paymentDeadlineRemaining,
                    expired: paymentDeadlineRemaining === (locale === "zh" ? "已超时" : "Expired")
                  }
                : null,
              cancellation: currentOrderCancelled
                ? {
                    cancelled: true,
                    reason: cancellationReason,
                    isPaymentTimeout: paymentTimeoutCancelled || rawCancellationReason === BRAND_PAYMENT_TIMEOUT_CANCEL_REASON
                  }
                : { cancelled: false }
            }
          : null,
      brand: {
        campaignCount: visibleRows.length,
        draftCampaigns: draftRows.length,
        activeCampaigns: activeRows.length,
        completedCampaigns: doneRows.length
      },
      campaigns: visibleRows.map((item) => ({
        id: item.id,
        kind: item.kind,
        title: item.name,
        status: item.status,
        phase: item.phase,
        category: item.category ?? null,
        budgetRange: item.budgetRange ?? null,
        deadline: item.deadline ?? null,
        updatedAt: item.updatedAt
      })),
      dashboardRows: visibleRows.map((item) => ({
        id: item.id,
        kind: item.kind,
        name: item.name,
        status: item.status,
        phase: item.phase,
        updatedAt: item.updatedAt
      })),
      orders: portalOrders.map((item) => ({
        id: item.id,
        campaignId: item.project_id,
        serviceProject: item.title,
        status: item.status,
        paymentStatus: item.payment_status,
        amount: Number(item.amount),
        currency: "USD",
        createdAt: item.created_at,
        paidAt: item.paid_at,
        cancelledAt: item.cancelled_at ?? null,
        cancelledBy: item.cancelled_by ?? null,
        cancelReason: item.cancel_reason ?? null
      })),
      notifications: notifications.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        unread: item.readAt == null,
        createdAt: item.createdAt.toISOString()
      }))
    };
  }

  private async creatorSummary(userId: string) {
    const [profile, invitations, orders, wallet, notifications] = await Promise.all([
      prisma.creatorProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          displayName: true,
          headline: true,
          minBudget: true,
          maxBudget: true,
          aiEnabled: true,
          portfolioWorks: { where: { deletedAt: null }, take: 8, orderBy: { updatedAt: "desc" } }
        }
      }),
      prisma.creatorInvitation.findMany({
        where: { creator: { userId } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { campaign: { select: { id: true, title: true, budget: true, currency: true, status: true } } }
      }),
      prisma.order.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, serviceProject: true, status: true, orderAmount: true, creatorIncome: true, currency: true }
      }),
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, content: true, readAt: true, createdAt: true }
      })
    ]);

    return {
      creator: {
        profileId: profile?.id ?? null,
        displayName: profile?.displayName ?? null,
        headline: profile?.headline ?? null,
        aiEnabled: profile?.aiEnabled ?? false,
        minBudget: profile?.minBudget == null ? null : Number(profile.minBudget),
        maxBudget: profile?.maxBudget == null ? null : Number(profile.maxBudget),
        portfolioCount: profile?.portfolioWorks.length ?? 0
      },
      invitations: invitations.map((item) => ({
        id: item.id,
        status: item.status,
        matchScore: Number(item.matchScore),
        campaignTitle: item.campaign.title,
        campaignStatus: item.campaign.status,
        budget: Number(item.campaign.budget),
        currency: item.campaign.currency,
        declineReason: item.declineReason
      })),
      orders: orders.map((item) => ({
        id: item.id,
        serviceProject: item.serviceProject,
        status: item.status,
        orderAmount: Number(item.orderAmount),
        creatorIncome: Number(item.creatorIncome),
        currency: item.currency
      })),
      wallet: wallet
        ? {
            available: roundMoney(Number(wallet.availableBalance)),
            pending: roundMoney(Number(wallet.pendingBalance)),
            totalEarned: roundMoney(Number(wallet.totalEarned)),
            totalWithdraw: roundMoney(Number(wallet.totalWithdraw))
          }
        : null,
      notifications: notifications.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        unread: item.readAt == null,
        createdAt: item.createdAt.toISOString()
      }))
    };
  }

  private async adminSummary() {
    const [campaigns, users, orders, pendingWithdrawals, disputes, failedEvents] = await Promise.all([
      prisma.campaign.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.user.groupBy({ by: ["role"], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true }, _sum: { orderAmount: true } }),
      prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
      prisma.dispute.count({ where: { status: { in: ["OPEN", "PROCESSING"] } } }),
      prisma.domainEvent.count({ where: { status: { in: ["FAILED", "DEAD_LETTER"] } } })
    ]);

    return {
      platform: {
        campaignStatus: campaigns.map((item) => ({ status: item.status, count: item._count._all })),
        userRoles: users.map((item) => ({ role: item.role, count: item._count._all })),
        orderStatus: orders.map((item) => ({
          status: item.status,
          count: item._count._all,
          gmv: roundMoney(Number(item._sum.orderAmount ?? 0))
        })),
        pendingWithdrawals,
        openDisputes: disputes,
        failedEvents
      }
    };
  }
}

export const aiCopilotContextBuilder = new AiCopilotContextBuilder();
