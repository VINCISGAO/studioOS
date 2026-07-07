# VINCIS AI Engineering Constitution

## Article 1 — Source of Truth

业务规则只来自：Prisma · OpenAPI · State Machine · Feature Spec · Design System · AI Learning Rules

AI Preference Engine 是 VINCIS 的核心 AI 学习引擎。Creator 收藏必须被视为 `Save Creator` 行为和 AI Learning Event，而不是普通 Like 功能。相关规则以 `docs/AI_PREFERENCE_ENGINE.md` 为准。

AI Learning Foundation 是平台长期数据资产。`AiPreference`、`MemoryFact`、`RelationshipDna`、`AIEvent`、`AILearning`、`AiJob`、`features/memory/**`、`features/ai/ai-learning-*`、`features/ai-support/**`、AI Copilot、Creative DNA、Matching Memory、语言数据库、系统回复库、邮件/通知模板知识等只能迁移、扩展、升级，禁止作为僵尸代码删除。保护清单以 `docs/AI_LEARNING_FOUNDATION.md` 为准。

## Article 2 — Never Guess

缺 API / 字段 / 状态 / 权限 → 停止，输出 Missing Specification

## Article 3 — No Business Logic In UI

React 页面只 Render

## Article 4 — Service First

禁止跳层：Action → Service → Repository → Prisma

## Article 5 — Feature First

禁止 utils / misc / temp / old / copy

## Article 6 — Never Modify State

必须 StateMachine.transition()

## Article 7 — Never Modify Money

必须 Ledger

## Article 8 — Event Driven

禁止 inline 邮件/Push/Webhook

## Article 9 — Every Feature Has Tests

Unit + Integration + E2E

## Article 10 — OpenAPI Is Law

## Article 11 — Prisma Is Law

## Article 12 — Design System Is Law

## Article 13–21

Accessibility · Performance Budget · Security defaults · Idempotency · Logger · No Any · Stop Rule · Self Review

每完成 Feature 输出自检：Architecture ✅ OpenAPI ✅ Prisma ✅ Tests ✅ State Machine ✅
