# Design System

> UI 尺寸统一 — Cursor 禁止自行发明 Padding/Radius

## Spacing Scale

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |

## Radius

| Component | Radius |
|-----------|--------|
| Button | 14px |
| Input | 14px |
| Card | 28px |
| Dialog | 28px |
| Video container | 20px |

## Button

- Height: 48px (lg) / 40px (md) / 32px (sm)
- Hover: opacity 0.9
- Disabled: opacity 0.4
- Loading: Spinner centered

## Card

- Padding: 24px
- Border: 1px solid `border-primary`
- Shadow: Shadow SM

## Sidebar

- Width: 280px (brand) / 248px (review compact)

## Review Timeline

- Height: 56px
- Marker size: 10px
- Marker hover scale: 1.15

## Wizard

- Steps: 7
- Step circle: 36px
- Gap between steps: 24px

## Colors (Semantic Tokens)

Use CSS variables / Tailwind theme — **禁止** raw `bg-blue-500`

- `background-primary` / `background-secondary`
- `text-primary` / `text-secondary`
- `danger` / `success` / `warning`
- Review annotation: `#FF4D4F` (danger)

## Typography

| Role | Usage |
|------|-------|
| Display | Hero headlines |
| Title | Page titles |
| Subtitle | Section headers |
| Body | Content |
| Caption | Meta / timestamps |
| Label | Form labels |

禁止页面随意 `text-4xl` / `text-5xl`

## Motion

- Duration: 200ms (micro) / 300ms (page)
- Ease: easeOut
- Hover scale: 1.02 max
