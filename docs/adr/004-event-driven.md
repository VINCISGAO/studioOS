# ADR-004: Event Driven Side Effects

**Status:** Accepted

## Decision

状态变更后的邮件/Push/WebSocket 全部通过 Event Bus + Worker，禁止业务 Action inline 发送。
