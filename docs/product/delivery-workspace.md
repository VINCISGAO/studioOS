# Delivery Workspace（交付工作台）

> 创作者上传审片版本，品牌在线审片，确认后自动交付最终母版。

## Product naming

- **English:** Delivery Workspace
- **Chinese:** 交付工作台
- **Route:** `/studio/delivery` (legacy `/studio/upload` redirects here)
- **Do not use:** “Upload & delivery”, “上传交付” — reads like a file dump /网盘

## Core principle

Brands never receive commercially usable masters before approval.

```text
Studio upload
  ↓
AI generates Review Version (720p, watermarked)
  ↓
Brand reviews online (timeline comments)
  ↓
Revise & re-upload (versioned, never overwritten)
  ↓
Approve → escrow release
  ↓
Studio uploads Master
  ↓
Brand downloads Master
  ↓
Order complete
```

## Page layout (Review OS, not upload-first)

The workspace opens on **status and collaboration**, not a giant upload box:

1. Campaign breadcrumb + selector (no left project list)
2. Summary cards: current version · review status · open feedback · AI quality · deadline
3. Main grid: player + timeline comments + delivery pipeline stepper
4. Secondary row: version history · upload review version · AI quality detail
5. Project info footer

Upload is one action among version control, approval, and delivery.

## Security layers (target architecture)

| Layer | Function |
| ----- | -------- |
| Review Version (720p) | Never expose master |
| HLS + AES-128 | Prevent direct MP4 grab |
| Dynamic visible watermark | Brand, email, session, date |
| Invisible fingerprint | Leak tracing |
| Token auth + audit log | Anti-hotlink, forensics |

### MVP today

- Versioned deliverables + timeline comments
- ffprobe quality panel (display-only)
- CSS review watermark overlay on player
- `/studio/upload` → `/studio/delivery` redirect

### Not yet built

- FFmpeg review transcode pipeline
- HLS encrypted playback
- Invisible watermark embedding
- Master upload + integrity check vs review
- QA gate blocking failed uploads
- Full audit log (play, seek, download, IP)

## Related files

- `app/studio/delivery/page.tsx`
- `components/studioos/studio-delivery-hub.tsx`
- `components/studioos/delivery-status-stepper.tsx`
- `components/studioos/review-watermark-overlay.tsx`
- `components/studioos/video-review-player.tsx`
