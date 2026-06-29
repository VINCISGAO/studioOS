# ADR-002: HLS Not MP4

**Status:** Accepted

## Decision

Review 播放统一 HLS.js + Signed URL，禁止直接播放 MP4 公开链接。

## Consequences

需要 Video Worker（FFmpeg → HLS → watermark）
