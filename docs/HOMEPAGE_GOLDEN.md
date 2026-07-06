# Homepage Golden Baseline

**Status:** Canonical anchor for the marketing homepage.

**Current golden baseline:** the owner-approved homepage in the current working tree.

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

Only replace, redesign, or edit homepage files when the owner **explicitly** commands that exact change in the current task.

## Publish / re-anchor this baseline

When the owner approves a new golden snapshot:

```bash
npm run homepage:anchor
```

This commits homepage stack files, updates `homepage-v1` tag and `homepage-golden` branch, and pushes to GitHub. Log: `.homepage-golden-anchor.log`
