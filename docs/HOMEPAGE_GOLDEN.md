# Homepage Golden Baseline

**Status:** Canonical anchor — **owner-locked 2026-07-11**  
**Supersedes:** 2026-07-10 · commit `17a98b7`  
**Tag / branch:** `homepage-v1` · `homepage-golden` (re-anchor via `npm run homepage:anchor` after owner approval)

> **Owner rule (2026-07-11):** 没有项目 owner 在**当前对话**中的明确命令，**绝对不可以**改动首页栈的任何内容——包括文案、视频 URL、**手机 / iPad / 电脑版布局与响应式断点**、间距、动画、资产、导航交互、以及 `HomeHeroVideo` 播放组件。  
> No agent and no engineer may change homepage stack files **without the project owner's explicit command in the current conversation.**

## Policy

The homepage is **frozen**. See [`AGENT.md`](../AGENT.md) · [`components/marketing/README.md`](../components/marketing/README.md).

Allowed **only** when the owner explicitly requests in the **current** task:

- The exact homepage change they named (nothing extra)

Not allowed without owner command:

- Refactors, redesigns, copy tweaks, spacing, **responsive layout at any breakpoint**, animations, assets, logo treatment, video filenames, cache version bumps, nav menu structure, hero Earth background sizing, CTA sizing, cost-table mobile layout

## Anchor contents (homepage stack)

| Area | Path |
|------|------|
| Page entry | `app/page.tsx` → `HomeLandingPage` |
| Video player (frozen) | `components/marketing/home-hero-video.tsx` |
| Video resolver | `lib/marketing/home-hero-video-sources.ts` |
| Copy | `lib/marketing/landing-copy.ts`, `lib/marketing/cinematic-copy.ts`, `lib/marketing/footer-copy.ts` |
| UI | `components/marketing/**`, `components/language-switcher.tsx` |
| Styles | `app/globals.css` (marketing utilities) |
| Proxy | `lib/marketing/marketing-video-proxy.ts`, `app/videos/[...path]/route.ts` |
| Upload / verify | `scripts/upload-home-hero-videos-r2.mjs`, `scripts/verify-home-hero-r2.mjs` |

**No** `<link rel="preload" as="video">` on homepage (Safari download bug) — `app/page.tsx` passes `heroVideoSrc` only to `HomeHeroVideo`.

## Section order (frozen)

`HomeLandingPage` in `components/marketing/landing/home-landing-page.tsx`:

1. `CinematicNav`
2. `CinematicHero`
3. **`HomeHeroVideo`** ← protected video playback component
4. `HomeHeroMetrics`
5. `LandingCostComparison` (`#cost`)
6. `LandingRecentWork` (`#work`)
7. `LandingHowItWorks` (`#how-it-works`)
8. `CinematicNetwork` (`#network`)
9. `CinematicEscrow` (`#escrow`)
10. `LandingCta` (`#cta`)
11. `MarketingFooter`

Do not reorder, remove, or replace sections without owner command.

## Responsive layout baseline (frozen 2026-07-10)

Breakpoints follow Tailwind defaults: **mobile** `< sm`, **iPad** `md`–`lg` (below `lg`), **desktop** `lg+`.

### Hero background (`CinematicHero`)

**Asset:** `/images/home-hero-space.png` — owner file in `public/images/` (source of truth; synced to bundled at build).

| Breakpoint | `background-size` | `background-position` |
|------------|-------------------|-------------------------|
| Mobile (default) | `auto 73%` | `center 80% 38%` |
| iPad (`md`, below `lg`) | `auto 118%` (synced with desktop) | `center 77% 48%` |
| Desktop (`lg`) | `auto 118%` | `center 77% 48%` |

### Hero typography compact locales

Locales with **×0.8 mobile headline scale** only (`< md`): `vi`, `es`, `fr`, `ms`, `ja`, `en`. **iPad (`md+`) matches desktop.**

- **Latin desktop hero** (`en`, `es`, `fr`, `ms`, `vi`): from `md` — title cap `3.5rem`, subtitle `text-pretty`, title **exactly 2 lines** from `titleLine1` + `titleLine2`.
- Legacy compact title set (`vi`, `es`, `fr`, `ms`): separate title scale path in `cinematic-hero.tsx`.

### Hero CTA buttons (`HeroCtaButton`)

- Mobile (`< md`): compact sizing where applicable.
- **iPad + desktop (`md+`)**: full-size (`min-h-[6.35rem]`, desktop text/gap/padding).

### Mobile navigation (`CinematicNav` · `sm:hidden` only)

Card menu (not plain text list):

- Order: 登录 → 关于我们 → 流程 → 案例 → 价格 → 资源
- Each row: glass card, left purple icon in dark rounded square, title + description
- Copy: `cinematicText("mobileNav")` descriptions + `cinematicText("nav")` titles
- Desktop / iPad top nav: unchanged centered links

### Cost comparison (`LandingCostComparison`)

- Mobile: rebalanced grid; value cells stack icon above text
- Long-locale labels shortened where needed (e.g. French `aiWorkflow` row)

### Desktop / iPad nav bar

- Center nav visible `lg:flex` only
- Login pill `sm:inline-flex`; hamburger `sm:hidden`

## Hero copy (zh-CN baseline — no trailing periods)

| Field | Value |
|-------|-------|
| eyebrow | `AI 驱动 · 全球协作` |
| titleLine1 | `连接全球品牌` |
| titleLine2 | `与 AI 创作者` |
| subtitle | `顶级广告不再是大公司专属` |

All 11 marketing locales: single-line `hero.subtitle` — see `landingCopy.hero` + `landingCopyTranslations.hero` in `lib/marketing/landing-copy.ts`.

## Hero video — 11 languages (canonical, unchanged)

**Player:** `components/marketing/home-hero-video.tsx` — controls, poster, locale copy, fullscreen, seek, mute. **Do not replace or remove.**

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

When the owner approves a **new** golden snapshot (after committing desired homepage changes):

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
