# Athenea — Native-Feel UI/UX Overhaul
**Date:** 2026-04-04  
**Status:** Approved  
**Scope:** Full UI/UX redesign — mobile-first, Capacitor/Android, premium native feel

---

## 1. Context & Problem Statement

Athenea is a React 18 + TypeScript + Redux + Vite app deployed on Android via Capacitor. Despite functional AI features (persona engine, streaming responses, WorkHub command center), the UI/UX has accumulated critical inconsistencies:

- **Omnibar color system conflict:** `Omnibar.css` defines its own `:root` with `--athenea-primary: #667eea` (purple/blue gradients) that overrides the app's global cyan/gold token system, making the Omnibar visually disconnected from all hub pages.
- **~60+ per-component CSS files** with duplicated card/button/form styles across WorkHub, PersonalHub, FinanceHub.
- **Hardcoded hex values** scattered across files (`#122a42`, `#3e5d7d`, `#f5f8ff`, `rgba(26,26,53,...)`) that ignore the token system.
- **Android system navigation bar always visible** — immersive/edge-to-edge mode not configured in Capacitor, breaking the native app feel.
- **No bottom tab bar** — top navbar is not mobile ergonomic; bottom navigation is the standard for Android/iOS apps.
- **GPU-draining perpetual animations** in navbar (starburst clip-path) and Omnibar icon spin.
- **Inconsistent border-radius** (10px, 14px, 16px mixed), **missing hover transitions** on some buttons, **no `prefers-reduced-motion` support**.
- **Touch targets below 44px** on many interactive elements.
- **Settings `.settings-button.primary` defined twice** with conflicting styles (gradient vs solid cyan).
- **`--bg-card`, `--bg-elevated`, `--accent-cyan-dim`** referenced in Settings but undefined or inconsistently defined in token system.

---

## 2. Goals

1. Create a unified mobile-first design system Athenea uses across every surface.
2. Make Athenea feel indistinguishable from a premium native Android app.
3. Fix every visual inconsistency and hardcoded value.
4. Hide Android system navigation buttons (edge-to-edge immersive mode).
5. Introduce bottom tab bar on mobile, refined top navbar on desktop.
6. Redesign the Omnibar as a premium glass morphism sheet unified to the cyan/gold system.
7. Optimize all animations for 60fps, add `prefers-reduced-motion` support.
8. Add haptic feedback on key interactions via Capacitor Haptics.

---

## 3. Design Decisions

### 3.1 Color System
The app's canonical color system is **cyan/gold on OLED dark**. The Omnibar's purple/blue system is a bug, not a feature. All purple/blue values are removed.

**Visual sensitivity note:** The user has photosensitivity to high-luminance colors (bright whites, neon/electric tones cause visual discomfort). All accent colors are tuned to be distinctive but never harsh — medium saturation, no neon, no pure white anywhere in the UI.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0b0b0b` | OLED black base |
| `--bg-surface` | `#0d1a2b` | Card surfaces |
| `--bg-elevated` | `#122033` | Elevated panels |
| `--bg-card` | `#0f1c2e` | Inline card bg |
| `--accent-cyan` | `#17b8e0` | Primary accent — muted teal-cyan (not neon) |
| `--accent-cyan-dim` | `rgba(23,184,224,0.14)` | Subtle cyan tint |
| `--accent-gold` | `#c9a227` | Secondary accent — warm amber-gold (not harsh yellow) |
| `--accent-gold-dim` | `rgba(201,162,39,0.12)` | Subtle gold tint |
| `--text-primary` | `#d4dae6` | Body text — warm off-white, never pure white |
| `--text-secondary` | `#8a96a8` | Muted text |
| `--text-muted` | `#5a6478` | Very muted |
| `--border-default` | `#1a3350` | Standard borders |
| `--border-subtle` | `rgba(255,255,255,0.05)` | Ultra-subtle dividers |
| `--color-error` | `#d94040` | Errors — muted red, not harsh |
| `--color-success` | `#1ea854` | Success — medium green |
| `--color-warning` | `#d4880a` | Warnings — amber, not electric yellow |

New tokens added to `src/styles/tokens.css`:
```css
/* Elevation shadows */
--shadow-1: 0 1px 3px rgba(0,0,0,0.4);
--shadow-2: 0 4px 12px rgba(0,0,0,0.5);
--shadow-3: 0 8px 24px rgba(0,0,0,0.6);
--shadow-glow-cyan: 0 0 16px rgba(30,201,255,0.2);
--shadow-glow-gold: 0 0 16px rgba(212,175,55,0.2);

/* Safe areas */
--safe-top: env(safe-area-inset-top, 0px);
--safe-bottom: env(safe-area-inset-bottom, 0px);
--safe-left: env(safe-area-inset-left, 0px);
--safe-right: env(safe-area-inset-right, 0px);

/* Motion */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-decel: cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-accel: cubic-bezier(0.4, 0.0, 1, 1);
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;

/* Border radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-pill: 999px;

/* Missing tokens to define */
--bg-card: #111f33;
--bg-elevated: #162236;
--accent-cyan-dim: rgba(23, 184, 224, 0.14);
--accent-gold-dim: rgba(201, 162, 39, 0.12);
```

### 3.2 Typography
No custom font changes — keep system font stack. Add `font-smoothing: antialiased` globally. Establish consistent scale:
- Headings: `1.8rem` (page), `1rem` (section) — already consistent, keep
- Body: `0.9rem` standard, `0.85rem` secondary, `0.8rem` label, `0.75rem` micro
- Mono: `var(--font-mono)` for code/keys

### 3.3 Border Radius Standardization
Replace all ad-hoc radius values with tokens:
- `10px` → `var(--radius-sm)` (list items, inputs)
- `14px` → `var(--radius-md)` (stat cards, small panels)
- `16px` → `var(--radius-lg)` (main cards, hub cards)
- `24px` → `var(--radius-xl)` (bottom sheet, modals)
- `999px` → `var(--radius-pill)` (badges, tags, buttons)

---

## 4. Architecture

### 4.1 Shared Component Library — `src/components/ui/`

Create the following shared components consumed by all hubs and pages:

| Component | File | Description |
|-----------|------|-------------|
| `Button` | `Button.tsx` + `Button.css` | Variants: primary (cyan), secondary (outline), danger (red), ghost. All 44px min-height mobile. |
| `Card` | `Card.tsx` + `Card.css` | Variants: default (surface), elevated, inset (base bg). Accepts `className`. |
| `Badge` | `Badge.tsx` + `Badge.css` | Color variants: cyan, gold, red, green, amber, gray. Pill shape. |
| `Input` | `Input.tsx` + `Input.css` | Unified form input. Token-based bg/border. Cyan focus ring. |
| `Select` | `Select.tsx` | Extends Input styles for `<select>`. |
| `ProgressBar` | `ProgressBar.tsx` + `ProgressBar.css` | Animated fill, color variants, height variants. |
| `Skeleton` | Already exists — extend for new shapes. |

Each hub (WorkHub, PersonalHub, FinanceHub) and secondary page replaces their locally-duplicated styles with these shared components.

### 4.2 AppShell & Navigation

Replace current navbar-only approach with `<AppShell>`:

```
src/components/AppShell/
  AppShell.tsx      — renders correct nav based on screen size
  AppShell.css
  BottomTabBar.tsx  — mobile bottom navigation (≤768px)
  BottomTabBar.css
  TopNavbar.tsx     — refined desktop navbar (>768px)  [refactored from Navbar.tsx]
  TopNavbar.css     [refactored from Navbar.css]
```

**BottomTabBar spec:**
- 4 tabs: Work (⚡), Personal (🌿), Finance (💎), Settings (⚙️)
- Tab icons: 24px, labels 10px, total tab height 56px
- Active tab: `--accent-cyan` icon + label, subtle cyan underline indicator
- Background: `var(--bg-surface)` + `backdrop-filter: blur(16px)` + top border `1px solid var(--border-subtle)`
- Bottom padding: `calc(12px + var(--safe-bottom))` for Android gesture nav
- FAB in center slot: Omnibar trigger, 52px circle, cyan gradient, `--shadow-glow-cyan`
- Haptic: light haptic on tab change via `Capacitor.Plugins.Haptics`

**TopNavbar:**
- Remove starburst clip-path animation (GPU drain, visually dated)
- Keep pill buttons but simplify to CSS transitions only
- Keep language toggle, dropdown menus — just clean up hardcoded colors

### 4.3 Omnibar — Complete Redesign

The Omnibar becomes a **bottom sheet on mobile, centered modal on desktop**.

**Visual design:**
- Background: `rgba(11,11,11,0.92)` + `backdrop-filter: blur(24px) saturate(180%)`
- Top strip: `linear-gradient(90deg, var(--accent-cyan), var(--accent-gold))`
- Border: `1px solid rgba(30,201,255,0.2)` (cyan ghost border)
- Border radius top: `var(--radius-xl)` (24px) — sheet feel
- No more `rgba(26,26,53,...)` or purple tones anywhere

**Tab bar (hub selector):**
- Work tab active: `--accent-cyan` background tint
- Personal tab active: coral/rose `#f43f5e` tint (distinct from cyan/gold)
- Finance tab active: `--accent-gold` tint
- Inactive: `var(--text-muted)` — no purple `rgba(124,143,245,...)`

**Chat bubbles:**
- Agent bubble: left-aligned, `var(--bg-elevated)` bg, persona emoji avatar
- User bubble: right-aligned, `var(--accent-cyan-dim)` bg
- Streaming cursor: `▌` with blink (already implemented — keep)
- Markdown rendered with proper `var(--text-primary)` color

**Input:**
- `var(--bg-base)` background, `var(--border-default)` border
- Focus: `--accent-cyan` border + `--shadow-glow-cyan`
- Persona indicator chip (🧿/👁️/🤖) left of input

**Animation (mobile):**
- Entry: slide-up from bottom with spring easing `var(--ease-spring)`, `translateY(100%) → translateY(0)`
- Exit: slide-down `var(--ease-accel)`
- Desktop: fade + scale `0.95 → 1`

**Remove from Omnibar.css:**
- Entire conflicting `:root` block
- All `#667eea`, `#8b5cf6`, `#ec4899`, `rgba(26,26,53,...)`, `rgba(124,143,245,...)` references
- `--athenea-primary`, `--hub-work`, `--hub-personal`, `--hub-finance` local vars

### 4.4 Android Edge-to-Edge (Immersive Mode)

**File:** `android/app/src/main/java/com/athenea/app/MainActivity.java`
```java
WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
WindowInsetsControllerCompat controller = 
    WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
controller.hide(WindowInsetsCompat.Type.navigationBars());
controller.setSystemBarsBehavior(
    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
);
```

**File:** `android/app/src/main/res/values/styles.xml`
Add to main app theme:
```xml
<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
<item name="android:navigationBarColor">@android:color/transparent</item>
<item name="android:statusBarColor">@android:color/transparent</item>
<item name="android:windowTranslucentNavigation">true</item>
```

**CSS:** Bottom tab bar uses `padding-bottom: calc(12px + var(--safe-bottom))` so content never hides under gesture indicator area.

### 4.5 Hub Pages Cleanup

Each hub (WorkHub, PersonalHub, FinanceHub) is updated to:
1. Replace duplicated `card`, `button`, `input`, `form` styles with shared components
2. Replace all hardcoded hex with tokens
3. Add missing `transition` properties on buttons
4. Ensure consistent padding/margin using spacing tokens
5. Add top padding accounting for navbar height (desktop) or zero (mobile with bottom tabs)

**Hardcoded values to replace across all hubs:**
- `#122a42` → `var(--bg-base)` (form input bg)
- `#3e5d7d` → `var(--border-default)` (form input border)
- `#f5f8ff` → `var(--text-primary)` (form input text)
- `#b9c8d9` → `var(--text-secondary)` (placeholder text)
- `#67e8f9` → `var(--accent-cyan)` (FinanceHub saldo)
- `#0891b2` → `var(--border-default)` (FinanceHub saldo border)

**Settings duplicate `.settings-button.primary`:** Remove first definition (gradient-based, lines 98-106). Keep second (cyan solid, lines 339-351) as canonical.

### 4.6 Motion & Performance

**Remove:**
- Navbar starburst `clip-path` animation (Navbar.css — `@keyframes starburst-*`)
- Continuous `omnibar-icon` spin animation (change to hover-only — already done in Omnibar.css comment OMNI-PERF-3, verify)
- Any `animation: X infinite` that runs without user trigger

**Add:**
- `@media (prefers-reduced-motion: reduce)` block in `index.css` that disables all transitions/animations globally
- `will-change: transform` only on elements that animate (add/remove dynamically, not on static elements)
- Page transitions: use existing `page-enter` animation, ensure it runs on all hub pages
- List item entry: stagger fade-in for task lists, expense lists (CSS `animation-delay` on `:nth-child`)

**60fps targets:**
- All animations use `transform` and `opacity` only (no layout-triggering properties)
- `backdrop-filter` on Omnibar — test on Android for performance, fallback to solid bg if needed

### 4.7 Accessibility

- All icon-only buttons: add `aria-label`
- All interactive elements: `min-height: 44px` on mobile (WCAG 2.5.5)
- `focus-visible` outline: `2px solid var(--accent-cyan)` offset `2px` — verify applied everywhere
- Color contrast: cyan `#17b8e0` on `#0b0b0b` = 5.9:1 ✅ (WCAG AA+), gold `#c9a227` on `#0b0b0b` = 5.1:1 ✅ (WCAG AA). No pure white anywhere — max text brightness is `#d4dae6`.
- `role="status"` on streaming response area for screen readers
- No information conveyed by color alone (badges have text labels + color)

### 4.8 Secondary Pages

Pages: MyTasks, Projects, ProjectDetails, Notes, Routines, Calendar, Todos, Payments, Profile, FocusMode, Journal, WeeklyReview, StatsPage, Fleet.

Each page:
1. Audit for hardcoded colors → replace with tokens
2. Replace any duplicated card/button/input styles with shared components
3. Add `overscroll-behavior: contain` on scroll containers
4. Add `-webkit-overflow-scrolling: touch` for smooth mobile scrolling
5. Verify touch targets ≥ 44px
6. Verify responsive layout at 375px, 390px, 414px (common Android widths)

---

## 5. File Structure

```
src/
  styles/
    tokens.css               ← MODIFIED: add new tokens
  components/
    ui/                      ← NEW: shared component library
      Button.tsx + Button.css
      Card.tsx + Card.css
      Badge.tsx + Badge.css
      Input.tsx + Input.css
      ProgressBar.tsx + ProgressBar.css
    AppShell/                ← NEW: navigation shell
      AppShell.tsx + AppShell.css
      BottomTabBar.tsx + BottomTabBar.css
      TopNavbar.tsx + TopNavbar.css  ← replaces Navbar.tsx + Navbar.css (originals deleted)
    Omnibar/
      Omnibar.css            ← REWRITTEN: remove :root conflict, full redesign
      Omnibar.tsx            ← minor updates (animation class, sheet behavior)
  pages/
    WorkHub.css              ← MODIFIED: tokens, remove duplicates
    PersonalHub.css          ← MODIFIED: tokens, remove hardcoded hex
    FinanceHub.css           ← MODIFIED: tokens, remove hardcoded hex
    Settings.css             ← MODIFIED: remove duplicate .primary, fix tokens
    [all other pages].css   ← MODIFIED: token cleanup, shared components
android/
  app/src/main/java/.../MainActivity.java  ← MODIFIED: edge-to-edge
  app/src/main/res/values/styles.xml       ← MODIFIED: transparent nav/status bars
```

---

## 6. Out of Scope

- Backend/AI logic changes (persona engine, Bridge, memory — already implemented)
- New features not related to UI (no new AI capabilities)
- React Native migration (app stays on Capacitor)
- iOS-specific safe area edge cases (Android is primary target)
- Light mode theme

---

## 7. Success Criteria

- [ ] Android system nav buttons hidden when app is open (immersive mode)
- [ ] Bottom tab bar visible on mobile, top navbar on desktop
- [ ] Omnibar uses only cyan/gold/dark tokens — no purple/blue anywhere
- [ ] Zero hardcoded hex values outside of `tokens.css`
- [ ] All hub pages use shared UI components for cards, buttons, inputs
- [ ] All interactive elements ≥ 44px touch target on mobile
- [ ] `prefers-reduced-motion` respected
- [ ] No perpetual GPU-draining animations
- [ ] Settings `.settings-button.primary` has exactly one definition
- [ ] `--bg-card`, `--bg-elevated`, `--accent-cyan-dim` defined in tokens.css
