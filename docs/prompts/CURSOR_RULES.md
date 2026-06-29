# Cursor Rules

> Cursor 每次开发前必须阅读此文档

## 阅读顺序

```
Product Bible → Database (Prisma) → OpenAPI → Feature Spec → State Machine → 开始开发
```

## 禁止

- 直接修改数据库 / 写 SQL / CREATE TABLE
- 直接调用 OpenAI / Stripe / Resend
- 页面里写 `fetch()` / `axios()` / `prisma()`
- 直接修改 `status` 或 `wallet.balance`
- 业务代码里发邮件 / Push
- 使用 `any` / `@ts-ignore` / `console.log`

## 必须

```
Action → Service → Repository → Prisma
```

状态变更：

```
Service.transition() → runTransition() → Audit + Event
```

## 开发结束

```bash
npm run lint && npm run typecheck && npm run build
```

## 文件限制

- 组件 ≤ 300 行
- 文件 ≤ 500 行
- Hook ≤ 200 行

## 冲突处理

若 Feature Spec、Prisma、OpenAPI 冲突 → **停止开发**，输出 `Missing Specification / Need Clarification`
