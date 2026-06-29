# StudioOS AI Engineering Constitution

## Article 1 — Source of Truth

业务规则只来自：Prisma · OpenAPI · State Machine · Feature Spec · Design System

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
