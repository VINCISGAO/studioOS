# ⚠️ Frozen Marketing Homepage

This folder is the **canonical marketing homepage**.

**Golden baseline:** owner-locked **2026-07-15** · supersedes **2026-07-11** · 11-language hero videos (`cv=7`), **`HomeHeroVideo` player frozen**, unified mobile hero typography (11 langs), mobile banner `109.5%`, hero-to-video flush, dark video shell on mobile/iPad. See [`docs/HOMEPAGE_GOLDEN.md`](../docs/HOMEPAGE_GOLDEN.md), [`.cursor/rules/homepage-absolute-lock.mdc`](../../.cursor/rules/homepage-absolute-lock.mdc). Verify: `npm run homepage:verify-lock`.

## Agent policy

**Owner lock (2026-07-15):** 没有项目 owner 在**当前对话**中的明确命令，**绝对不可以**改动首页栈。包括文案、视频 URL、**手机 / iPad / 电脑版布局**、间距、响应式断点、动画、资产、导航、以及 `components/marketing/home-hero-video.tsx`。

Do not change anything in the homepage stack unless the project owner **explicitly commands that exact change in the current conversation.** No copy tweaks, no video URL changes, no layout fixes, no refactors — ask first if unsure.

No AI agent may:

- refactor
- redesign
- simplify
- remove animations
- replace sections
- change layout hierarchy
- change responsive behavior at any breakpoint (mobile / iPad / desktop)
- swap or delete homepage components (including `HomeHeroVideo`)
- change homepage copy, spacing, responsiveness, assets, or logo treatment

…unless the project owner **explicitly commands that homepage change in the current conversation**.

**Treat this folder as read-only by default.**

Allowed without explicit override:

- bug fixes **only if they do not change layout, visual hierarchy, responsive behavior, or interaction design**
- changes the owner explicitly requested in the current task

If unsure, **preserve the existing homepage**.

## Scope

This freeze applies to the marketing homepage stack, including (non-exhaustive):

- `components/marketing/**` (including `home-hero-video.tsx`)
- `components/language-switcher.tsx` (footer language control)
- `lib/marketing/**`
- `app/page.tsx` and homepage-related app routes that render this UI
- `app/globals.css` (marketing / landing styles)
- homepage assets under `public/images/` used by the cinematic landing
- hero videos under `public/videos/home/hero/` (local dev only; production via R2 + `MARKETING_CDN_UPSTREAM` rewrite on `vincis.app`)

It does **not** block changes to admin, brand portal, creator portal, APIs, database, or backend features.

## Restore homepage only

If the homepage was changed incorrectly, restore from the golden baseline **without** touching the rest of the product:

```bash
git checkout homepage-golden -- app/page.tsx
git checkout homepage-golden -- components/marketing/
git checkout homepage-golden -- components/language-switcher.tsx
git checkout homepage-golden -- lib/marketing/
git checkout homepage-golden -- app/globals.css
git checkout homepage-golden -- public/images/home-hero-space.png
git checkout homepage-golden -- public/images/home-hero-studio.png
git checkout homepage-golden -- public/images/login-space-bg.png
git checkout homepage-golden -- public/images/login/
git checkout homepage-golden -- public/images/social-sources/
git checkout homepage-golden -- public/videos/home/hero/
```

Adjust paths if your golden baseline used different asset names. Prefer the tagged snapshot:

```bash
git checkout homepage-v1 -- components/marketing/
```

## Override rule

Only overwrite homepage files when the owner explicitly commands that exact homepage change in the current instruction. Otherwise, do not touch copy, layout, spacing, responsiveness, animations, assets, logo treatment, or section composition.
