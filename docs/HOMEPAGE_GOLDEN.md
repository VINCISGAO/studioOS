# Homepage Golden Baseline

**Status:** Canonical anchor for the marketing homepage.

**Current golden baseline:** owner-approved homepage re-anchored **2026-07-09** — multilingual hero videos, footer redesign, landing section polish, capsule eyebrows.

**Legacy branch:** `homepage-golden`  
**Legacy tag:** `homepage-v1`

## Policy

The homepage is **frozen**. Do not change copy, layout, spacing, responsiveness, structure, visual hierarchy, interaction design, animations, assets, or logo treatment unless the project owner explicitly commands that exact homepage change in the current conversation.

See:

- [`AGENT.md`](../AGENT.md) — Homepage Freeze Policy
- [`components/marketing/README.md`](../components/marketing/README.md)

## Allowed without redesign

Bug fixes, accessibility improvements, localization, and content updates — **only when explicitly requested by the owner** and only if they do not exceed the requested scope.

## Restore homepage only

```bash
git checkout homepage-v1 -- components/marketing/
git checkout homepage-golden -- app/page.tsx
git checkout homepage-golden -- components/marketing/
git checkout homepage-golden -- components/language-switcher.tsx
git checkout homepage-golden -- lib/marketing/
git checkout homepage-golden -- app/globals.css
git checkout homepage-golden -- public/images/home-hero-space.png
git checkout homepage-golden -- public/images/login-space-bg.png
git checkout homepage-golden -- public/images/login/
git checkout homepage-golden -- public/images/social-sources/
```

Hero videos are on R2/CDN (not git). Re-upload locally with `npm run marketing:upload-hero-videos` when filenames change.

## Anchor contents (homepage stack)

- `app/page.tsx` → `HomeLandingPage` / `CinematicHomePage`
- `app/globals.css` — landing / marketing utility styles used by homepage
- `components/marketing/**` — cinematic hero, hero video, sections, footer, landing copy wiring
- `components/language-switcher.tsx` — footer language control (icon variant)
- `lib/marketing/**` — cinematic + landing copy
- `app/api/home-hero-space/route.ts` + `lib/studioos/home-hero-space-asset.ts`
- `public/images/home-hero-space.png`, login marketing images, `public/images/social-sources/` (footer SVGs)
- `public/videos/home/hero/*.mp4` — multilingual homepage hero MP4s (**hosted on R2/CDN**, not in git; upload via `npm run marketing:upload-hero-videos`)
- `NEXT_PUBLIC_MARKETING_CDN_URL` — public CDN base for hero videos in production
- `lib/studioos/marketing-headline-font.ts` — silver gradient headline

## Owner override

Only replace, redesign, or edit homepage files when the owner **explicitly** commands that exact change in the current task.

## Publish / re-anchor this baseline

When the owner approves a new golden snapshot:

```bash
npm run homepage:anchor
```

This commits homepage stack files, updates `homepage-v1` tag and `homepage-golden` branch, and pushes to GitHub. Log: `.homepage-golden-anchor.log`
