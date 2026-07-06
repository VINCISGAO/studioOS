# ⚠️ Frozen Marketing Homepage

This folder is the **canonical marketing homepage**.

**Golden baseline:** the current owner-approved homepage in this working tree. Treat the current homepage as the latest golden standard unless the owner explicitly re-anchors it. Legacy anchors: `homepage-golden` branch · `homepage-v1` tag · see [`docs/HOMEPAGE_GOLDEN.md`](../docs/HOMEPAGE_GOLDEN.md)

## Agent policy

No AI agent may:

- refactor
- redesign
- simplify
- remove animations
- replace sections
- change layout hierarchy
- swap or delete homepage components
- change homepage copy, spacing, responsiveness, assets, or logo treatment

…unless the project owner **explicitly commands that homepage change in the current conversation**.

**Treat this folder as read-only by default.**

Allowed without explicit override:

- bug fixes
- changes the owner explicitly requested in the current task

Bug fixes, accessibility improvements, localization, and content updates are allowed, provided they do not change the homepage structure, visual hierarchy, or interaction design.

允许进行 Bug 修复、文案更新、多语言、无障碍等修改，但不得改变首页结构、视觉层级、交互设计或动画行为。

If unsure, **preserve the existing homepage**.

## Scope

This freeze applies to the marketing homepage stack, including (non-exhaustive):

- `components/marketing/**`
- `app/page.tsx` and homepage-related app routes that render this UI
- homepage assets under `public/images/` used by the cinematic landing

It does **not** block changes to admin, brand portal, creator portal, APIs, database, or backend features.

## Restore homepage only

If the homepage was changed incorrectly, restore from the golden baseline **without** touching the rest of the product:

```bash
git checkout homepage-golden -- app/page.tsx
git checkout homepage-golden -- components/marketing/
git checkout homepage-golden -- public/images/home-hero-space.png
git checkout homepage-golden -- public/images/home-hero-studio.png
git checkout homepage-golden -- public/images/login-space-bg.png
git checkout homepage-golden -- public/images/login/
```

Adjust paths if your golden baseline used different asset names. Prefer the tagged snapshot:

```bash
git checkout homepage-v1 -- components/marketing/
```

## Override rule

Only overwrite homepage files when the owner explicitly commands that exact homepage change in the current instruction. Otherwise, do not touch copy, layout, spacing, responsiveness, animations, assets, logo treatment, or section composition.
