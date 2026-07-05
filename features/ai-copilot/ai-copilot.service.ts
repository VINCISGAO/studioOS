import type { AuthUserDto } from "@/features/auth/auth.service";
import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { activityService } from "@/features/campaign/activity.service";
import { aiCopilotContextBuilder } from "@/features/ai-copilot/ai-copilot-context.builder";
import { aiCopilotRepository } from "@/features/ai-copilot/ai-copilot.repository";
import { aiCopilotToolRouter } from "@/features/ai-copilot/ai-copilot-tool.router";
import type {
  AiCopilotAnswer,
  AiCopilotContext,
  AiCopilotFeedbackRating,
  AiCopilotRequest,
  AiCopilotToolResult
} from "@/features/ai-copilot/ai-copilot.types";
import { normalizeCopilotRole } from "@/features/ai-copilot/ai-copilot.types";
import { appError } from "@/lib/core/errors";
import { asInputJson } from "@/lib/core/prisma-json";
import { getStoredCreatorProfile } from "@/lib/creator-profile-service";
import { resolveBrandDisplayName } from "@/lib/studioos/brand-account-display";
import { resolveCreatorIdByEmail } from "@/lib/studioos/creator-settings-service";

function isZh(language: string) {
  return language === "zh-CN" || language === "zh-TW" || language === "zh";
}

function suggestedQuestions(role: string, language: string) {
  const zh = isZh(language);
  if (role === "CREATOR") {
    return zh
      ? ["为什么我最近没有收到邀请？", "我怎么提高接单率？", "我的主页哪里需要优化？", "我的收益什么时候可提现？"]
      : ["Why haven't I received invitations lately?", "How can I improve my acceptance rate?", "What should I optimize on my profile?", "When can I withdraw my earnings?"];
  }
  if (role === "ADMIN" || role === "SUPPORT") {
    return zh
      ? ["今天平台有什么异常？", "哪些订单卡住了？", "哪些提现需要处理？", "哪些 AI 决策置信度低？"]
      : ["What platform issues need attention today?", "Which orders are stuck?", "Which withdrawals need handling?", "Which AI decisions have low confidence?"];
  }
  return zh
    ? ["我的项目现在到哪一步？", "为什么推荐这个 Creator？", "我的预算合理吗？", "下一步我应该做什么？"]
    : ["Where is my project now?", "Why was this creator recommended?", "Is my budget reasonable?", "What should I do next?"];
}

function hasUsefulToolData(toolCalls: AiCopilotToolResult[]) {
  return toolCalls.some((call) => JSON.stringify(call.output) !== "{}");
}

function insufficientDataMessage(language: string) {
  if (language === "zh-CN" || language === "zh-TW") return "我现在没有足够数据判断。";
  if (language === "ja") return "現時点では判断するための十分なデータがありません。";
  if (language === "ko") return "현재 판단할 충분한 데이터가 없습니다.";
  if (language === "km") return "ខ្ញុំមិនមានទិន្នន័យគ្រប់គ្រាន់ដើម្បីវាយតម្លៃនៅពេលនេះទេ។";
  return "I don't have enough data to judge that right now.";
}

function templateAnswer(input: {
  message: string;
  context: AiCopilotContext;
  toolCalls: AiCopilotToolResult[];
}) {
  const language = input.context.language;
  if (!hasUsefulToolData(input.toolCalls)) return insufficientDataMessage(language);

  const headline =
    language === "zh-CN" || language === "zh-TW"
      ? "我已经读取了你当前账号有权限访问的真实 VINCIS 数据。"
      : "I checked the real VINCIS data available to your current account.";
  const evidence =
    language === "zh-CN" || language === "zh-TW"
      ? `我参考了你的项目、通知和业务摘要，整理出当前最相关的信息。`
      : "I reviewed your projects, notifications, and workspace summary to focus on the most relevant signals.";
  const nextStep =
    language === "zh-CN" || language === "zh-TW"
      ? "你可以继续问我项目进度、预算健康度、创作者推荐原因，或下一步应该怎么推进。"
      : "You can ask me about project progress, budget health, creator recommendations, or the best next step.";

  return `${headline}\n\n${evidence}\n\n${nextStep}`;
}

function modelUnavailableAnswer(language: string) {
  if (language === "zh-CN" || language === "zh-TW" || language === "zh") {
    return [
      "我已经准备好协助你分析 VINCIS 工作区。",
      "",
      "你可以问我项目进度、预算是否合理、为什么推荐某个 Creator，或者下一步应该怎么推进。",
      "",
      "如果当前问题需要更多上下文，我会直接告诉你还缺哪些资料。"
    ].join("\n");
  }
  return [
    "I am ready to help you analyze your VINCIS workspace.",
    "",
    "You can ask about project progress, budget health, creator recommendations, or the best next step.",
    "",
    "If a question needs more context, I will tell you exactly what information is missing."
  ].join("\n");
}

function buildSystemPrompt(context: AiCopilotContext) {
  return [
    "You are VINCIS AI Assistant V1, an embedded SaaS assistant.",
    "You can query, explain, suggest, and guide. You must not execute dangerous write operations.",
    "Forbidden operations: direct payment, fund release, data deletion, delivery confirmation, order status changes, sending invitations, or choosing creators for the user.",
    "Only answer from the provided context and tool outputs. If data is missing, say you do not have enough data.",
    "Never invent orders, amounts, creators, payments, income, views, or AI learning results.",
    "Always answer in the user's preferred language. Never mix languages unless the user asks for translation.",
    "Use summaries.qaKnowledge as the approved product Q&A knowledge base. Prefer its tone and facts when relevant.",
    "Use summaries.aiFeedback to avoid repeating answer styles or content that this user marked as not helpful.",
    `User language: ${context.language}`,
    `Page context: ${JSON.stringify({
      pagePath: context.pagePath,
      entityType: context.entityType,
      entityId: context.entityId
    })}`
  ].join("\n");
}

function buildUserPrompt(message: string, toolCalls: AiCopilotToolResult[], context: AiCopilotContext) {
  return JSON.stringify({
    userMessage: message,
    approvedQaKnowledge: context.summaries.qaKnowledge ?? [],
    recentUserFeedback: context.summaries.aiFeedback ?? [],
    readOnlyToolOutputs: toolCalls.map((call) => ({
      toolName: call.toolName,
      status: call.status,
      output: call.output
    }))
  });
}

function activityActorRole(role: string): "brand" | "creator" | "admin" | "system" {
  if (role === "BRAND") return "brand";
  if (role === "CREATOR") return "creator";
  if (role === "ADMIN") return "admin";
  return "system";
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function messageFeedbackFromMetadata(metadataJson: unknown) {
  const metadata = asRecord(metadataJson);
  const feedback = asRecord(metadata.feedback);
  const rating = feedback.rating;
  if (rating !== "HELPFUL" && rating !== "NOT_HELPFUL") return null;
  return {
    rating,
    reason: typeof feedback.reason === "string" ? feedback.reason : null,
    createdAt: typeof feedback.createdAt === "string" ? feedback.createdAt : new Date().toISOString()
  };
}

function feedbackMemoryText(input: {
  rating: AiCopilotFeedbackRating;
  messageContent: string;
  language: string;
}) {
  return JSON.stringify({
    rating: input.rating,
    signal: input.rating === "NOT_HELPFUL" ? "user_disliked_without_prompted_reason" : "user_liked",
    assistantMessage: input.messageContent.slice(0, 1200),
    language: input.language,
    recordedAt: new Date().toISOString()
  });
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function moneyValue(value: unknown) {
  const amount = numberValue(value);
  return `$${Math.round(amount).toLocaleString()}`;
}

type KnowledgeQaCandidate = Awaited<ReturnType<typeof aiCopilotRepository.listActiveKnowledgeQa>>[number];

function knowledgeLanguageCode(language: string) {
  return isZh(language) ? "zh-CN" : language;
}

function compactSearchText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function wordTerms(value: string) {
  return value
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
}

function charNgrams(value: string) {
  const chars = Array.from(value);
  if (chars.length < 2 || chars.length > 80) return [];
  const grams: string[] = [];
  for (let index = 0; index < chars.length - 1; index += 1) {
    grams.push(`${chars[index]}${chars[index + 1]}`);
  }
  return grams;
}

function knowledgeScore(message: string, candidate: KnowledgeQaCandidate) {
  const query = compactSearchText(message);
  const question = compactSearchText(candidate.question);
  const searchText = compactSearchText(candidate.searchText);
  if (!query) return 0;

  let score = 0;
  if (question === query) score += 200;
  if (question.includes(query) || query.includes(question)) score += 120;

  const terms = Array.from(new Set([...wordTerms(message), ...charNgrams(query)]));
  for (const term of terms) {
    if (question.includes(term)) score += 6;
    else if (searchText.includes(term)) score += 2;
  }
  return score;
}

async function findKnowledgeMatches(message: string, language: string) {
  const candidates = await aiCopilotRepository.listActiveKnowledgeQa(knowledgeLanguageCode(language));
  return candidates
    .map((candidate) => ({ ...candidate, score: knowledgeScore(message, candidate) }))
    .filter((candidate) => candidate.score >= 12)
    .sort((a, b) => b.score - a.score || b.usageCount - a.usageCount)
    .slice(0, 3)
    .map((candidate) => ({
      id: candidate.id,
      sourceKey: candidate.sourceKey,
      module: candidate.module,
      question: candidate.question,
      answer: candidate.answer,
      score: candidate.score
    }));
}

function answerFromKnowledge(matches: Awaited<ReturnType<typeof findKnowledgeMatches>>) {
  return matches[0]?.answer ?? null;
}

async function resolveCreatorDisplayName(user: AuthUserDto, fallback: string) {
  const creatorId = await resolveCreatorIdByEmail(user.email);
  if (!creatorId) {
    return user.displayName ?? user.fullName ?? fallback;
  }
  const profile = await getStoredCreatorProfile(creatorId);
  return profile?.name.trim() || user.displayName || user.fullName || fallback;
}

async function buildWorkspaceSnapshot(user: AuthUserDto, role: string, context: AiCopilotContext) {
  const language = context.language;
  const zh = isZh(language);
  const summaries = context.summaries;
  const displayName = user.displayName ?? user.companyName ?? user.fullName ?? user.email.split("@")[0] ?? "VINCIS";

  if (role === "CREATOR") {
    const creator = asRecord(summaries.creator);
    const invitations = asArray(summaries.invitations);
    const wallet = asRecord(summaries.wallet);
    const workspaceName = await resolveCreatorDisplayName(user, String(creator.displayName ?? displayName));
    return {
      roleLabel: zh ? "创作者" : "Creator",
      displayName: workspaceName,
      workspaceName,
      greeting: zh ? `早上好，${workspaceName}` : `Good morning, ${workspaceName}`,
      subtitle: zh
        ? "我会根据你的真实收入、接单率、Portfolio、Review、Invitation 和 Wallet 给出建议。"
        : "I analyze your real income, acceptance rate, portfolio, reviews, invitations, and wallet.",
      stats: [
        { label: zh ? "待回复邀请" : "Pending invitations", value: String(invitations.length), detail: zh ? "来自数据库" : "From database", icon: "box" },
        { label: zh ? "作品资产" : "Portfolio works", value: String(numberValue(creator.portfolioCount)), detail: zh ? "可用于 AI 学习" : "Available for AI learning", icon: "brain" },
        { label: zh ? "可提现余额" : "Available balance", value: moneyValue(wallet.available), detail: zh ? "以数据库为准" : "Database-backed", icon: "wallet" },
        { label: zh ? "成长建议" : "Growth signals", value: String(Math.max(1, invitations.length + numberValue(creator.portfolioCount))), detail: zh ? "基于当前资料" : "Based on current profile", icon: "compass" }
      ]
    };
  }

  if (role === "ADMIN" || role === "SUPPORT") {
    const platform = asRecord(summaries.platform);
    const orderStatus = asArray(platform.orderStatus);
    return {
      roleLabel: zh ? "管理员" : "Admin",
      displayName,
      workspaceName: zh ? "平台管理工作区" : "Platform Admin",
      greeting: zh ? `早上好，${displayName}` : `Good morning, ${displayName}`,
      subtitle: zh ? "我会读取平台真实数据，帮你查看成交、异常订单、提现和运营状态。" : "I read platform data to summarize deals, stuck orders, withdrawals, and operations.",
      stats: [
        { label: zh ? "订单状态" : "Order states", value: String(orderStatus.length), detail: zh ? "实时聚合" : "Live aggregate", icon: "box" },
        { label: zh ? "待处理提现" : "Pending withdrawals", value: String(numberValue(platform.pendingWithdrawals)), detail: zh ? "来自数据库" : "From database", icon: "wallet" },
        { label: zh ? "开放争议" : "Open disputes", value: String(numberValue(platform.openDisputes)), detail: zh ? "需要关注" : "Needs attention", icon: "brain" },
        { label: zh ? "异常事件" : "Failed events", value: String(numberValue(platform.failedEvents)), detail: zh ? "系统监控" : "System monitor", icon: "compass" }
      ]
    };
  }

  const brand = asRecord(summaries.brand);
  const workspaceName = await resolveBrandDisplayName(user.email);
  return {
    roleLabel: zh ? "广告主" : "Brand",
    displayName: workspaceName,
    workspaceName,
    greeting: zh ? `早上好，${workspaceName}` : `Good morning, ${workspaceName}`,
    subtitle: zh
      ? "我会根据你的真实 Campaign、订单、付款、归因和通知数据提供建议。"
      : "I use your real campaigns, orders, payments, attribution, and notifications to suggest next steps.",
    stats: [
      { label: zh ? "全部广告" : "All ads", value: String(numberValue(brand.campaignCount)), detail: zh ? "与品牌首页一致" : "Same as brand dashboard", icon: "box" },
      { label: zh ? "草稿" : "Drafts", value: String(numberValue(brand.draftCampaigns)), detail: zh ? "来自数据库" : "From database", icon: "brain" },
      { label: zh ? "进行中" : "In progress", value: String(numberValue(brand.activeCampaigns)), detail: zh ? "来自数据库" : "From database", icon: "wallet" },
      { label: zh ? "已完成" : "Completed", value: String(numberValue(brand.completedCampaigns)), detail: zh ? "来自数据库" : "From database", icon: "compass" }
    ]
  };
}

export class AiCopilotService {
  async listSessions(user: AuthUserDto, input: { languageCode?: string | null } = {}) {
    if (!aiCopilotRepository.isEnabled()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    const role = normalizeCopilotRole(user);
    const [sessions, context] = await Promise.all([
      aiCopilotRepository.listSessionsForUser(user.id),
      aiCopilotContextBuilder.build(user, { languageCode: input.languageCode ?? null })
    ]);
    const workspace = await buildWorkspaceSnapshot(user, role, context);
    return {
      sessions: sessions.map((session) => ({
        id: session.id,
        title: session.title,
        role: session.role,
        updatedAt: session.updatedAt.toISOString(),
        lastMessage: session.messages[0]?.content ?? null
      })),
      suggestedQuestions: suggestedQuestions(role, context.language),
      workspace
    };
  }

  async getSession(user: AuthUserDto, sessionId: string, input: { languageCode?: string | null } = {}) {
    if (!aiCopilotRepository.isEnabled()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    const [session, context] = await Promise.all([
      aiCopilotRepository.getSession(sessionId),
      aiCopilotContextBuilder.build(user, { languageCode: input.languageCode ?? null })
    ]);
    if (!session || session.userId !== user.id) {
      throw appError("NOT_FOUND", "AI Copilot session not found");
    }
    return {
      session: {
        id: session.id,
        title: session.title,
        role: session.role,
        updatedAt: session.updatedAt.toISOString(),
        messages: session.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          feedback: messageFeedbackFromMetadata(message.metadataJson)
        }))
      },
      suggestedQuestions: suggestedQuestions(normalizeCopilotRole(user), context.language)
    };
  }

  async answer(user: AuthUserDto, input: AiCopilotRequest): Promise<AiCopilotAnswer> {
    if (!input.message.trim()) throw appError("VALIDATION_ERROR", "Message is required");
    if (!aiCopilotRepository.isEnabled()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");

    const role = normalizeCopilotRole(user);
    const session = input.sessionId
      ? await aiCopilotRepository.getSession(input.sessionId)
      : await aiCopilotRepository.createSession({
          userId: user.id,
          role,
          title: input.message.trim().slice(0, 80)
        });

    if (!session || session.userId !== user.id) {
      throw appError("NOT_FOUND", "AI Copilot session not found");
    }

    const userMessage = await aiCopilotRepository.createMessage({
      sessionId: session.id,
      userId: user.id,
      role: "USER",
      content: input.message.trim(),
      metadataJson: asInputJson({
        pagePath: input.pagePath ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        languageCode: input.languageCode ?? null
      })
    });

    const context = await aiCopilotContextBuilder.build(user, {
      pagePath: input.pagePath ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      languageCode: input.languageCode ?? null
    });
    const qaKnowledge = await findKnowledgeMatches(input.message, context.language);
    const contextWithKnowledge: AiCopilotContext = {
      ...context,
      summaries: {
        ...context.summaries,
        qaKnowledge
      }
    };

    await aiCopilotRepository.createContext({
      sessionId: session.id,
      userId: user.id,
      role,
      pagePath: input.pagePath ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      contextJson: asInputJson(contextWithKnowledge) ?? {}
    });

    const toolCalls = aiCopilotToolRouter.run(input.message, contextWithKnowledge);
    await Promise.all(
      toolCalls.map((call) =>
        aiCopilotRepository.createToolCall({
          sessionId: session.id,
          messageId: userMessage.id,
          toolName: call.toolName,
          inputJson: asInputJson({
            pagePath: input.pagePath ?? null,
            entityType: input.entityType ?? null,
            entityId: input.entityId ?? null,
            languageCode: input.languageCode ?? null
          }),
          outputJson: asInputJson(call.output),
          status: call.status,
          durationMs: call.durationMs
        })
      )
    );
    const activityCampaignId = input.entityType === "campaign" ? input.entityId : null;
    if (activityCampaignId) {
      await Promise.all(
        toolCalls.map((call) =>
          activityService.write(
            activityCampaignId,
            "AI_COPILOT_TOOL_READ",
            { userId: user.id, email: user.email, role: activityActorRole(role) },
            { tool_name: call.toolName, session_id: session.id }
          ).catch(() => null)
        )
      );
    }

    let answerMode: "model" | "model_unconfigured" | "template" | "knowledge_base" = "model_unconfigured";
    let answer = answerFromKnowledge(qaKnowledge) ?? modelUnavailableAnswer(contextWithKnowledge.language);
    if (qaKnowledge.length > 0) {
      answerMode = "knowledge_base";
      await Promise.all([
        aiCopilotRepository.markKnowledgeQaUsed(qaKnowledge.map((item) => item.id)),
        aiCopilotRepository.createLearning({
          sourceEventId: userMessage.id,
          entityType: "chat_message",
          entityId: userMessage.id,
          learningType: "ai_copilot_qa_retrieval",
          after: {
            message: input.message.trim(),
            language: contextWithKnowledge.language,
            matches: qaKnowledge.map((item) => ({
              id: item.id,
              sourceKey: item.sourceKey,
              question: item.question,
              score: item.score
            }))
          },
          confidence: Math.min(1, (qaKnowledge[0]?.score ?? 0) / 120)
        })
      ]);
    }
    if (aiGatewayService.isConfigured()) {
      const result = await aiGatewayService.chatCompletion({
        system: buildSystemPrompt(contextWithKnowledge),
        user: buildUserPrompt(input.message, toolCalls, contextWithKnowledge),
        temperature: 0.2,
        language: contextWithKnowledge.language
      });
      answer = result.content || answerFromKnowledge(qaKnowledge) || templateAnswer({ message: input.message, context: contextWithKnowledge, toolCalls });
      answerMode = result.content ? "model" : qaKnowledge.length > 0 ? "knowledge_base" : "template";
    }

    const assistantMessage = await aiCopilotRepository.createMessage({
      sessionId: session.id,
      userId: null,
      role: "ASSISTANT",
      content: answer,
      metadataJson: asInputJson({
        answerMode,
        knowledgeQaIds: qaKnowledge.map((item) => item.id),
        toolCalls: toolCalls.map((call) => call.toolName)
      })
    });
    await aiCopilotRepository.touchSession(session.id);

    return {
      sessionId: session.id,
      messageId: assistantMessage.id,
      answer,
      suggestedQuestions: suggestedQuestions(role, context.language),
      context: {
        pagePath: input.pagePath ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null
      },
      toolCalls
    };
  }

  async recordFeedback(user: AuthUserDto, input: {
    messageId: string;
    rating: AiCopilotFeedbackRating;
    languageCode?: string | null;
  }) {
    if (!aiCopilotRepository.isEnabled()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    const message = await aiCopilotRepository.getMessageWithSession(input.messageId);
    if (!message || message.session.userId !== user.id || message.role !== "ASSISTANT") {
      throw appError("NOT_FOUND", "AI assistant message not found");
    }

    const metadata = asRecord(message.metadataJson);
    const existingFeedback = messageFeedbackFromMetadata(metadata);
    if (existingFeedback) {
      return { messageId: message.id, feedback: existingFeedback };
    }

    const context = await aiCopilotContextBuilder.build(user, { languageCode: input.languageCode ?? null });
    const feedback = {
      rating: input.rating,
      createdAt: new Date().toISOString()
    };

    await aiCopilotRepository.updateMessageMetadata(message.id, {
      ...metadata,
      feedback
    });
    await aiCopilotRepository.replaceUserFeedbackMemory({
      userId: user.id,
      role: normalizeCopilotRole(user),
      messageId: message.id,
      factValue: feedbackMemoryText({
        rating: input.rating,
        messageContent: message.content,
        language: context.language
      })
    });
    await aiCopilotRepository.recordKnowledgeQaFeedback(asStringArray(metadata.knowledgeQaIds), input.rating);

    return { messageId: message.id, feedback };
  }
}

export const aiCopilotService = new AiCopilotService();
