# 06 — UI / UX

## Documents in this folder

| File | Description |
|------|-------------|
| [README_UI_AUDIT.md](README_UI_AUDIT.md) | UI components and visual system audit |
| [README_UX_AUDIT.md](README_UX_AUDIT.md) | User experience flow audit |

## Design System

All styles use CSS custom properties defined in `scope/src/styles/tokens.css`:

```css
/* Colors */
--bg-base, --bg-surface, --bg-card
--accent-gold, --accent-cyan, --accent-green
--text-primary, --text-secondary, --text-muted
--border-default, --border-subtle

/* Spacing / Radius */
--radius-sm, --radius-md, --radius-lg, --radius-xl
--transition-fast

/* Shadows */
--shadow-gold
```

## Component Library

| Component | Path | Purpose |
|-----------|------|---------|
| `EmptyState` | `components/EmptyState/` | Zero-data state with CTA |
| `ErrorBoundary` | `components/ErrorBoundary/` | React crash fallback |
| `Omnibar` | `components/Omnibar/` | AI interaction modal |
| `Navbar` | `components/Navbar/` | Bottom navigation |
| `ProactiveHUD` | `components/Omnibar/` | Proactive AI alerts |

## Responsive Breakpoints

| Breakpoint | Target |
|-----------|--------|
| `> 1200px` | Desktop / tablet landscape |
| `900px–1200px` | Tablet portrait |
| `600px–900px` | Large mobile |
| `< 600px` | Mobile (primary target) |

## Mobile-First Priority

ATHENEA targets Android phones as primary device. All layouts are designed mobile-first:
- Bottom navigation (`Navbar`)
- Touch-friendly tap targets (min 44px)
- No hover-only interactions
- Swipe-friendly list items

## Identity Hub — UI Status

Redesigned 2026-03-23 per spec:
- ✅ Single `preferredName` field (no first/last name split)
- ✅ Title as free text input (not dropdown)
- ✅ Agent name + alias per agent (3 cards)
- ✅ Auto-detect timezone with live clock
- ✅ Language toggle (ES / EN)
- ✅ Structured context fields (occupation, mainGoal, financialContext)
- ✅ Voice/Tone Protocol removed (non-functional)
- ✅ Preview section removed (per user request)
