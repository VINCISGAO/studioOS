# Homepage Golden Baseline

**Status:** Canonical anchor — **owner-locked 2026-07-09 (post-publish)**  
**Git commit:** `17a98b7` on `main`  
**Tag / branch:** `homepage-v1` · `homepage-golden` (re-anchored via `npm run homepage:anchor`)

> **Owner rule (2026-07-09):** No agent and no engineer may change homepage stack files **without the project owner's explicit command in the current conversation.** This includes copy, video URLs, layout, animations, and assets.

## Policy

The homepage is **frozen**. See [`AGENT.md`](../AGENT.md) · [`components/marketing/README.md`](../components/marketing/README.md).

Allowed **only** when the owner explicitly requests in the **current** task:

- The exact homepage change they named (nothing extra)

Not allowed without owner command:

- Refactors, redesigns, copy tweaks, spacing, responsiveness, animations, assets, logo treatment, video filenames, cache version bumps

## Anchor contents (homepage stack)

| Area | Path |
|------|------|
| Page entry | `app/page.tsx` → `HomeLandingPage` / `CinematicHomePage` |
| Video resolver | `lib/marketing/home-hero-video-sources.ts` |
| Copy | `lib/marketing/landing-copy.ts`, `lib/marketing/cinematic-copy.ts`, `lib/marketing/footer-copy.ts` |
| UI | `components/marketing/**`, `components/language-switcher.tsx` |
| Styles | `app/globals.css` (marketing utilities) |
| Proxy | `lib/marketing/marketing-video-proxy.ts`, `app/videos/[...path]/route.ts` |
| Upload / verify | `scripts/upload-home-hero-videos-r2.mjs`, `scripts/verify-home-hero-r2.mjs` |

**No** `<link rel="preload" as="video">` on homepage (Safari download bug) — `app/page.tsx` passes `heroVideoSrc` only to `HomeHeroVideo`.

## Hero copy (zh-CN baseline — no trailing periods)

| Field | Value |
|-------|-------|
| eyebrow | `AI 驱动 · 全球协作` |
| titleLine1 | `连接全球品牌与AI创作者` |
| subtitle line 1 | `让好的创意不再因成本、时间或资源被埋没` |
| subtitle line 2 | `世界级广告不再是大公司的专属` |

All 11 marketing locales: subtitle **two lines, no sentence-ending punctuation** — see `landingCopy.hero` + `landingCopyTranslations.hero` in `lib/marketing/landing-copy.ts`.

## Hero video — 11 languages (canonical)

**Resolver:** `resolveHomeHeroVideoPlaybackSrc(locale)` in `lib/marketing/home-hero-video-sources.ts`  
**Cache bust:** `HERO_VIDEO_CACHE_VERSION = "7"` → query `?cv=7`  
**Public path pattern:** `/videos/home/hero/{encodeURIComponent(filename)}?cv=7`  
**Production origin:** `https://vincis.app` (same-origin proxy → R2 via `MARKETING_CDN_UPSTREAM`)  
**R2 key candidates (in order):** `videos/home/hero/{filename}` then flat `{filename}`

| `lang` param | R2 / CDN filename | Full playback URL (production) |
|--------------|-------------------|--------------------------------|
| `en` | `VINCIS Brand Film (EN).mp4` | `https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(EN).mp4?cv=7` |
| `zh-CN` (also `zh`) | `VINCIS Brand Film (ZH-CN).mp4` | `https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(ZH-CN).mp4?cv=7` |
| `zh-TW` | `VINCIS Brand Film (ZH-TW).mp4` | `https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(ZH-TW).mp4?cv=7` |
| `ja` | `VINCIS Brand Film (JA).mp4` | `https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(JA).mp4?cv=7` |
| `ko` | `VINCIS Brand Film (KO).mp4` | `https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(KO).mp4?cv=7` |
| `ms` | `VINCIS Brand Film (MS).mp4` | `https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(MS).mp4?cv=7` |
| `km` | `VINCIS Brand Film (KM).mp4` | `https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(KM).mp4?cv=7` |
| `th` | `VINCIS Brand Film (TH).mp4` | `https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(TH).mp4?cv=7` |
| `vi` | `VINCIS Brand Film (VI).mp4` | `https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(VI).mp4?cv=7` |
| `fr` | `VINCIS Brand Film (FR).mp4` | `https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(FR).mp4?cv=7` |
| `es` | `VINCIS Brand Film (ES).mp4` | `https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(ES).mp4?cv=7` |

**Homepage with locale:** `https://vincis.app/?lang={code}` (e.g. `?lang=ja`).

**Deploy videos to R2:** `npm run marketing:deploy-hero-videos`  
**Verify R2 objects:** `npm run marketing:verify-hero-videos`

## Re-anchor this baseline

When the owner approves a **new** golden snapshot:

```bash
npm run homepage:anchor
```

Updates `homepage-v1` tag + `homepage-golden` branch, pushes to GitHub. Log: `.homepage-golden-anchor.log`

## Restore homepage only (without touching product)

```bash
git checkout homepage-v1 -- components/marketing/
# or full stack:
git checkout homepage-golden -- app/page.tsx components/marketing/ lib/marketing/ app/globals.css
```

Hero MP4s live on **R2**, not git — re-upload with `npm run marketing:deploy-hero-videos` if filenames change.
