# StudioOS AI Copilot V1 Implementation Report

## Scope

StudioOS AI Copilot V1 is an authenticated, database-backed assistant for logged-in Brand, Creator, Admin, and Support users.

V1 supports:

- Querying real StudioOS business summaries.
- Explaining current state.
- Giving suggestions and next-step guidance.
- Respecting user language through `User.languageCode`.
- Recording chat messages, context snapshots, and read-only tool calls.

V1 explicitly does not support:

- Direct payment.
- Fund release.
- Data deletion.
- Delivery confirmation.
- Order status changes.
- Sending invitations.
- Choosing creators on behalf of the user.

## New Database Tables

- `chat_sessions`
- `chat_messages`
- `ai_tool_calls`
- `ai_copilot_contexts`

Migration:

- `prisma/migrations/20260704064000_ai_copilot_v1/migration.sql`

## New API

- `GET /api/ai-copilot`
  - Requires logged-in database user.
  - Returns recent sessions and role-based suggested questions.
  - Supports `?sessionId=` to load saved chat history for the current user.

- `POST /api/ai-copilot`
  - Requires logged-in database user.
  - Saves the user message.
  - Builds a permission-scoped context.
  - Runs read-only tools.
  - Records `ai_tool_calls`.
  - Saves the assistant response.

## New Read-Only Tools

- `get_current_user`
- `get_brand_summary`
- `get_creator_summary`
- `get_campaign_status`
- `get_order_status`
- `get_payment_status`
- `get_wallet_summary`
- `get_review_status`
- `get_matching_explanation`
- `get_budget_score`
- `get_attribution_summary`
- `get_ai_memory_summary`
- `get_notifications`
- `get_timeline`

## Permission Model

Copilot uses the existing `requireApiUser` and `PermissionService`.

- Brand users read only their own campaigns, orders, notifications, attribution-related campaign summaries, and review/order state.
- Creator users read only their own profile, invitations, orders, wallet, and notifications.
- Admin users read platform aggregate summaries.
- Support users receive a restricted operational summary and cannot use dangerous tools.

All V1 tools are read-only.

## UI

The global root layout now renders a bottom-right `AI Copilot` button.

The right drawer includes:

- AI avatar.
- Role badge.
- Page context badge.
- Message list.
- Suggested questions.
- Loading state.
- Empty state.
- Error state.

Dedicated pages:

- `/copilot`
- `/brand/copilot`
- `/brand/ai`
- `/studio/copilot`
- `/admin/copilot`

The full-page UI includes:

- Role-aware hero copy.
- Suggested actions/questions.
- Chat history sidebar.
- Message history display.
- Loading state.
- Error state.
- Responsive desktop/mobile layout.

## i18n

`AICopilotContextBuilder` reads `User.languageCode` and passes it to the AI prompt.

System prompt rule:

> Always answer in the user's preferred language. Never mix languages unless the user explicitly requests translation.

## Files Added

- `features/ai-copilot/ai-copilot.types.ts`
- `features/ai-copilot/ai-copilot.repository.ts`
- `features/ai-copilot/ai-copilot-context.builder.ts`
- `features/ai-copilot/ai-copilot-tool.router.ts`
- `features/ai-copilot/ai-copilot.service.ts`
- `app/api/ai-copilot/route.ts`
- `components/ai-copilot/ai-copilot-drawer.tsx`
- `components/ai-copilot/ai-copilot-page.tsx`
- `docs/AI_COPILOT_V1_IMPLEMENTATION_REPORT.md`
- `app/copilot/page.tsx`
- `app/admin/copilot/page.tsx`
- `app/brand/ai/page.tsx`

## Files Updated

- `prisma/schema.prisma`
- `app/layout.tsx`
- `app/brand/copilot/page.tsx`
- `app/studio/copilot/page.tsx`

