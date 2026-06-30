# Homepage Golden Baseline

**Status:** Canonical anchor for the marketing homepage.

**Branch:** `homepage-golden`  
**Tag:** `homepage-v1`

## Policy

The homepage is **frozen**. Do not change structure, visual hierarchy, interaction design, or animations unless the project owner explicitly requests a homepage redesign or override.

See:

- [`AGENT.md`](../AGENT.md) — Homepage Freeze Policy
- [`components/marketing/README.md`](../components/marketing/README.md)

## Allowed without redesign

Bug fixes, accessibility improvements, localization, and content updates — **only if** they do not change homepage structure, visual hierarchy, or interaction design.

## Restore homepage only

```bash
git checkout homepage-v1 -- components/marketing/
git checkout homepage-golden -- app/page.tsx
git checkout homepage-golden -- components/marketing/
git checkout homepage-golden -- public/images/home-hero-space.png
git checkout homepage-golden -- public/images/login-space-bg.png
git checkout homepage-golden -- public/images/login/
```

## Anchor contents (homepage stack)

- `app/page.tsx` → `HomeLandingPage` / `CinematicHomePage`
- `components/marketing/**` — cinematic hero, sections, landing copy wiring
- `lib/marketing/landing-copy.ts` — hero / cost / why copy
- `lib/studioos/marketing-headline-font.ts` — silver gradient headline
- `app/api/home-hero-space/route.ts` + `lib/studioos/home-hero-space-asset.ts`
- `public/images/home-hero-space.png` and login marketing images

## Owner override

Only replace or redesign homepage files when the owner **explicitly** says to override the frozen homepage in the current task.

## Publish / re-anchor this baseline

When the owner approves a new golden snapshot:

```bash
npm run homepage:anchor
```

This commits homepage stack files, updates `homepage-v1` tag and `homepage-golden` branch, and pushes to GitHub. Log: `.homepage-golden-anchor.log`
