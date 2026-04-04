# Athenea Native-Feel UI/UX Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Athenea's visual layer into a premium, mobile-first native-feel Android app — unified design tokens, bottom tab navigation, glass morphism Omnibar, zero hardcoded colors, Android edge-to-edge immersive mode.

**Architecture:** All styling flows from `src/styles/tokens.css` → shared `src/components/ui/` library → page CSS files. Navigation is handled by a new `AppShell` component that renders `BottomTabBar` on mobile (≤768px) and `TopNavbar` on desktop. The Omnibar becomes a bottom sheet on mobile via CSS class + animation, removing the conflicting `:root` in `Omnibar.css`.

**Tech Stack:** React 18 JSX/TSX, CSS custom properties (no CSS-in-JS), Capacitor Android, `@capacitor/haptics` (already installed), `react-router-dom` v6, Redux Toolkit.

---

## File Map

**Modified:**
- `src/styles/tokens.css` — complete token update: new colors, radius, shadows, motion, safe areas
- `src/index.css` — add `prefers-reduced-motion`, fix focus color to new token value
- `src/pages/Layout.jsx` — replace `<Navbar>` + `<FloatingOmnibarFab>` with `<AppShell>`
- `src/components/Omnibar/Omnibar.css` — full rewrite removing conflicting `:root`
- `src/components/Omnibar/Omnibar.tsx` — add mobile sheet CSS class + `role="status"` on stream area
- `src/pages/WorkHub.css` — hardcoded hex → tokens
- `src/pages/PersonalHub.css` — hardcoded hex → tokens
- `src/pages/FinanceHub.css` — hardcoded hex → tokens
- `src/pages/Settings.css` — remove duplicate `.settings-button.primary`
- `src/pages/MyTasks.css`, `Projects.css`, `ProjectDetails.css`, `Notes.css`, `Routines.css` — token cleanup
- `src/pages/Calendar.css`, `Todos.css`, `Payments.css`, `Profile.css` — token cleanup
- `src/pages/FocusMode.css`, `Journal.css`, `WeeklyReview.css`, `StatsPage.css` — token cleanup
- `android/app/src/main/java/com/athenea/app/MainActivity.java` — edge-to-edge immersive mode
- `android/app/src/main/res/values/styles.xml` — transparent nav/status bars

**Created:**
- `src/components/ui/Button.tsx` + `src/components/ui/Button.css`
- `src/components/ui/Card.tsx` + `src/components/ui/Card.css`
- `src/components/ui/Badge.tsx` + `src/components/ui/Badge.css`
- `src/components/ui/Input.tsx` + `src/components/ui/Input.css`
- `src/components/ui/ProgressBar.tsx` + `src/components/ui/ProgressBar.css`
- `src/components/AppShell/AppShell.tsx` + `src/components/AppShell/AppShell.css`
- `src/components/AppShell/BottomTabBar.tsx` + `src/components/AppShell/BottomTabBar.css`
- `src/components/AppShell/TopNavbar.tsx` + `src/components/AppShell/TopNavbar.css`

**Deleted (content moved to TopNavbar):**
- `src/components/Navbar.jsx`
- `src/components/Navbar.css`

---

## Task 1: Expand Token System

**Files:**
- Modify: `src/styles/tokens.css`

This is the foundation — every subsequent task depends on these values being correct.
The current `tokens.css` has several wrong/missing values. We replace the entire `:root` block.

- [ ] **Step 1: Read the current file**

  Open `src/styles/tokens.css` and confirm it starts at line 1 with `/* ATHENEA — Design Tokens */`.

- [ ] **Step 2: Replace the entire `:root` block**

  Replace lines 7–93 (the full `:root { ... }`) with:

  ```css
  :root {
    /* ── Backgrounds ────────────────────────────────────── */
    --bg-base:     #0b0b0b;   /* OLED black */
    --bg-surface:  #0d1a2b;   /* card surface */
    --bg-card:     #0f1c2e;   /* inline card */
    --bg-elevated: #122033;   /* elevated panel */
    --bg-overlay:  rgba(13, 26, 43, 0.95);

    /* ── Borders ─────────────────────────────────────────── */
    --border-default: #1a3350;              /* visible border */
    --border-subtle:  rgba(255,255,255,0.05); /* ultra-subtle divider */
    --border-strong:  #c9a227;              /* gold border */

    /* ── Text ────────────────────────────────────────────── */
    --text-primary:   #d4dae6;  /* off-white, never pure white */
    --text-secondary: #8a96a8;
    --text-muted:     #5a6478;
    --text-inverse:   #0b0b0b;

    /* ── Accents ─────────────────────────────────────────── */
    --accent-gold:     #c9a227;
    --accent-gold-dim: rgba(201, 162, 39, 0.12);
    --accent-cyan:     #17b8e0;
    --accent-cyan-dim: rgba(23, 184, 224, 0.14);

    /* ── Semantic ─────────────────────────────────────────── */
    --color-success: #1ea854;
    --color-warning: #d4880a;
    --color-error:   #d94040;
    --color-info:    #3b82f6;

    /* ── Typography ──────────────────────────────────────── */
    --font-base: system-ui, -apple-system, sans-serif;
    --font-mono: 'Consolas', 'Courier New', monospace;

    --font-size-xs:  0.75rem;
    --font-size-sm:  0.875rem;
    --font-size-md:  1rem;
    --font-size-lg:  1.125rem;
    --font-size-xl:  1.375rem;
    --font-size-2xl: 1.75rem;

    /* ── Spacing ──────────────────────────────────────────── */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 24px;
    --space-6: 32px;
    --space-7: 48px;

    /* ── Radius ───────────────────────────────────────────── */
    --radius-sm:   8px;
    --radius-md:   12px;
    --radius-lg:   16px;
    --radius-xl:   24px;
    --radius-full: 9999px;
    --radius-pill: 999px;

    /* ── Elevation shadows ────────────────────────────────── */
    --shadow-card:      0 2px 8px rgba(0,0,0,0.45);
    --shadow-elevated:  0 4px 16px rgba(0,0,0,0.6);
    --shadow-glow-cyan: 0 0 14px rgba(23,184,224,0.2);
    --shadow-glow-gold: 0 0 14px rgba(201,162,39,0.18);

    /* ── Safe areas (Capacitor Android) ─────────────────── */
    --safe-top:    env(safe-area-inset-top,    0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
    --safe-left:   env(safe-area-inset-left,   0px);
    --safe-right:  env(safe-area-inset-right,  0px);

    /* ── Motion ──────────────────────────────────────────── */
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --ease-decel:  cubic-bezier(0.0, 0.0, 0.2, 1);
    --ease-accel:  cubic-bezier(0.4, 0.0, 1, 1);
    --duration-fast:   150ms;
    --duration-normal: 250ms;
    --duration-slow:   400ms;

    /* ── Legacy transition aliases (keep for existing code) ── */
    --transition-fast:   0.15s ease;
    --transition-normal: 0.25s ease;
  }
  ```

- [ ] **Step 3: Verify build**

  ```bash
  cd c:/Users/gazav/OneDrive/Desktop/Athenea/scope
  npm run build 2>&1 | tail -20
  ```
  Expected: build completes with no CSS errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/styles/tokens.css
  git commit -m "feat(tokens): expand design system — muted palette, safe areas, motion, radius"
  ```

---

## Task 2: Android Edge-to-Edge Immersive Mode

**Files:**
- Modify: `android/app/src/main/java/com/athenea/app/MainActivity.java`
- Modify: `android/app/src/main/res/values/styles.xml`

Hides the Android system navigation bar (back/home/recents) and status bar chrome so the app fills the entire screen.

- [ ] **Step 1: Update MainActivity.java**

  Replace the entire file content:

  ```java
  package com.athenea.app;

  import android.os.Bundle;
  import androidx.core.view.WindowCompat;
  import androidx.core.view.WindowInsetsCompat;
  import androidx.core.view.WindowInsetsControllerCompat;

  import com.getcapacitor.BridgeActivity;

  public class MainActivity extends BridgeActivity {
      @Override
      public void onCreate(Bundle savedInstanceState) {
          super.onCreate(savedInstanceState);
          registerPlugin(WidgetBridgePlugin.class);
          registerPlugin(AtheneaWidgetPlugin.class);
          registerPlugin(NotificationListenerPlugin.class);

          // Edge-to-edge: let app draw behind system bars
          WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

          // Hide navigation bar (back/home/recents) in sticky immersive mode
          WindowInsetsControllerCompat controller =
              WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
          controller.hide(WindowInsetsCompat.Type.navigationBars());
          controller.setSystemBarsBehavior(
              WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
          );
      }
  }
  ```

- [ ] **Step 2: Update styles.xml**

  Replace the file content:

  ```xml
  <?xml version="1.0" encoding="utf-8"?>
  <resources>

      <!-- Base application theme -->
      <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
          <item name="colorPrimary">@color/colorPrimary</item>
          <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
          <item name="colorAccent">@color/colorAccent</item>
      </style>

      <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
          <item name="windowActionBar">false</item>
          <item name="windowNoTitle">true</item>
          <item name="android:background">@null</item>
          <!-- Edge-to-edge: transparent system bars -->
          <item name="android:navigationBarColor">@android:color/transparent</item>
          <item name="android:statusBarColor">@android:color/transparent</item>
          <item name="android:windowTranslucentNavigation">true</item>
          <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
      </style>

      <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
          <item name="android:background">@drawable/splash</item>
      </style>

  </resources>
  ```

- [ ] **Step 3: Verify the import compiles**

  ```bash
  cd c:/Users/gazav/OneDrive/Desktop/Athenea/scope
  npx cap build android 2>&1 | grep -E "(error|BUILD)" | head -20
  ```
  Expected: BUILD SUCCESSFUL. If you see "cannot find symbol WindowCompat", the `androidx.core:core` dependency may need to be added to `android/app/build.gradle` — add `implementation 'androidx.core:core:1.12.0'` under dependencies.

- [ ] **Step 4: Commit**

  ```bash
  git add android/app/src/main/java/com/athenea/app/MainActivity.java \
          android/app/src/main/res/values/styles.xml
  git commit -m "feat(android): enable edge-to-edge immersive mode — hide system nav bar"
  ```

---

## Task 3: Global CSS Polish

**Files:**
- Modify: `src/index.css`

Add `prefers-reduced-motion`, update focus ring color to new token, add mobile scroll polish. This is a small task but must be done before the components reference these global styles.

- [ ] **Step 1: Update the focus-visible rule (line ~102)**

  Find:
  ```css
  :focus-visible {
    outline: 2px solid var(--accent-cyan);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
  ```
  Replace with (same rule — token values updated automatically via Task 1, but add `transition`):
  ```css
  :focus-visible {
    outline: 2px solid var(--accent-cyan);
    outline-offset: 3px;
    border-radius: var(--radius-sm);
    transition: outline-offset var(--duration-fast) ease;
  }
  ```

- [ ] **Step 2: Update input global focus shadow (line ~166)**

  Find:
  ```css
  input:focus,
  select:focus,
  textarea:focus {
    border-color: var(--accent-cyan);
    box-shadow: 0 0 0 2px rgba(30, 201, 255, 0.15);
    outline: none;
  }
  ```
  Replace with:
  ```css
  input:focus,
  select:focus,
  textarea:focus {
    border-color: var(--accent-cyan);
    box-shadow: 0 0 0 3px var(--accent-cyan-dim);
    outline: none;
  }
  ```

- [ ] **Step 3: Append prefers-reduced-motion + mobile scroll at end of file**

  Add to the end of `src/index.css`:

  ```css
  /* ─────────────────────────────────────────────────────────────
     Accessibility — respect reduced motion preference
  ──────────────────────────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Mobile scroll polish
  ──────────────────────────────────────────────────────────────── */
  .scroll-container {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  /* ─────────────────────────────────────────────────────────────
     Bottom tab bar body padding (applied when BottomTabBar renders)
  ──────────────────────────────────────────────────────────────── */
  body.has-bottom-tab {
    padding-bottom: calc(64px + var(--safe-bottom));
  }
  ```

- [ ] **Step 4: Verify build**

  ```bash
  cd c:/Users/gazav/OneDrive/Desktop/Athenea/scope
  npm run build 2>&1 | tail -10
  ```
  Expected: build completes, no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/index.css
  git commit -m "feat(global): prefers-reduced-motion, mobile scroll polish, bottom tab body class"
  ```

---

## Task 4: Shared UI Component Library

**Files:**
- Create: `src/components/ui/Button.tsx` + `src/components/ui/Button.css`
- Create: `src/components/ui/Card.tsx` + `src/components/ui/Card.css`
- Create: `src/components/ui/Badge.tsx` + `src/components/ui/Badge.css`
- Create: `src/components/ui/Input.tsx` + `src/components/ui/Input.css`
- Create: `src/components/ui/ProgressBar.tsx` + `src/components/ui/ProgressBar.css`

These components replace the duplicated styles across all hub and page CSS files. They are used starting in Task 7. Build them first, hub pages adopt them after.

- [ ] **Step 1: Create Button.css**

  Create `src/components/ui/Button.css`:

  ```css
  .ui-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 44px;
    padding: 0.45rem 1.25rem;
    border-radius: var(--radius-pill);
    border: 1px solid transparent;
    font-size: 0.82rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    cursor: pointer;
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast),
      opacity var(--transition-fast);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ui-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* Primary — cyan fill */
  .ui-btn--primary {
    background: var(--accent-cyan);
    color: var(--bg-base);
    border-color: var(--accent-cyan);
  }
  .ui-btn--primary:not(:disabled):hover {
    opacity: 0.85;
  }

  /* Secondary — cyan outline */
  .ui-btn--secondary {
    background: transparent;
    color: var(--accent-cyan);
    border-color: var(--accent-cyan);
  }
  .ui-btn--secondary:not(:disabled):hover {
    background: var(--accent-cyan);
    color: var(--bg-base);
  }

  /* Gold — gold outline */
  .ui-btn--gold {
    background: transparent;
    color: var(--accent-gold);
    border-color: var(--accent-gold);
    font-weight: 700;
  }
  .ui-btn--gold:not(:disabled):hover {
    background: var(--accent-gold);
    color: var(--bg-base);
  }

  /* Danger — red outline */
  .ui-btn--danger {
    background: transparent;
    color: var(--color-error);
    border-color: var(--color-error);
  }
  .ui-btn--danger:not(:disabled):hover {
    background: var(--color-error);
    color: #fff;
  }

  /* Ghost — no border */
  .ui-btn--ghost {
    background: transparent;
    color: var(--text-secondary);
    border-color: transparent;
  }
  .ui-btn--ghost:not(:disabled):hover {
    color: var(--text-primary);
    background: var(--accent-cyan-dim);
  }

  /* Size: small */
  .ui-btn--sm {
    min-height: 32px;
    padding: 0.2rem 0.75rem;
    font-size: 0.75rem;
  }

  /* Size: icon-only */
  .ui-btn--icon {
    padding: 0;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
  }

  @media (max-width: 768px) {
    .ui-btn {
      min-height: 48px;
    }
    .ui-btn--sm {
      min-height: 36px;
    }
  }
  ```

- [ ] **Step 2: Create Button.tsx**

  Create `src/components/ui/Button.tsx`:

  ```tsx
  import './Button.css';

  type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'danger' | 'ghost';
  type ButtonSize = 'sm' | 'md' | 'icon';

  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }

  export function Button({
    variant = 'secondary',
    size = 'md',
    className = '',
    children,
    ...props
  }: ButtonProps) {
    const sizeClass = size !== 'md' ? ` ui-btn--${size}` : '';
    return (
      <button
        type="button"
        className={`ui-btn ui-btn--${variant}${sizeClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
  ```

- [ ] **Step 3: Create Card.css**

  Create `src/components/ui/Card.css`:

  ```css
  .ui-card {
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: 1rem 1.25rem;
    background: var(--bg-surface);
  }

  .ui-card--elevated {
    background: var(--bg-elevated);
    box-shadow: var(--shadow-card);
  }

  .ui-card--inset {
    background: var(--bg-card);
  }

  .ui-card__title {
    margin: 0 0 0.75rem;
    color: var(--accent-gold);
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  ```

- [ ] **Step 4: Create Card.tsx**

  Create `src/components/ui/Card.tsx`:

  ```tsx
  import './Card.css';

  type CardVariant = 'default' | 'elevated' | 'inset';

  interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    title?: string;
  }

  export function Card({
    variant = 'default',
    title,
    className = '',
    children,
    ...props
  }: CardProps) {
    const variantClass = variant !== 'default' ? ` ui-card--${variant}` : '';
    return (
      <div className={`ui-card${variantClass} ${className}`.trim()} {...props}>
        {title && <h2 className="ui-card__title">{title}</h2>}
        {children}
      </div>
    );
  }
  ```

- [ ] **Step 5: Create Badge.css**

  Create `src/components/ui/Badge.css`:

  ```css
  .ui-badge {
    display: inline-flex;
    align-items: center;
    border: 1px solid currentColor;
    border-radius: var(--radius-pill);
    padding: 2px 8px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
    line-height: 1.4;
  }

  .ui-badge--cyan    { color: var(--accent-cyan);    border-color: var(--accent-cyan); }
  .ui-badge--gold    { color: var(--accent-gold);    border-color: var(--accent-gold); }
  .ui-badge--red     { color: var(--color-error);    border-color: var(--color-error); }
  .ui-badge--green   { color: var(--color-success);  border-color: var(--color-success); }
  .ui-badge--amber   { color: var(--color-warning);  border-color: var(--color-warning); }
  .ui-badge--gray    { color: var(--text-muted);     border-color: var(--text-muted); }
  .ui-badge--orange  { color: #e07820;               border-color: #e07820; }
  ```

- [ ] **Step 6: Create Badge.tsx**

  Create `src/components/ui/Badge.tsx`:

  ```tsx
  import './Badge.css';

  type BadgeColor = 'cyan' | 'gold' | 'red' | 'green' | 'amber' | 'gray' | 'orange';

  interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    color?: BadgeColor;
  }

  export function Badge({ color = 'cyan', className = '', children, ...props }: BadgeProps) {
    return (
      <span className={`ui-badge ui-badge--${color} ${className}`.trim()} {...props}>
        {children}
      </span>
    );
  }
  ```

- [ ] **Step 7: Create Input.css**

  Create `src/components/ui/Input.css`:

  ```css
  .ui-input,
  .ui-select {
    width: 100%;
    background: var(--bg-base);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    padding: 0.55rem 0.75rem;
    font-size: 0.95rem;
    font-family: var(--font-base);
    transition:
      border-color var(--transition-fast),
      box-shadow var(--transition-fast);
    -webkit-text-fill-color: var(--text-primary);
  }

  .ui-input::placeholder { color: var(--text-secondary); -webkit-text-fill-color: var(--text-secondary); }
  .ui-input:focus,
  .ui-select:focus {
    outline: none;
    border-color: var(--accent-cyan);
    box-shadow: 0 0 0 3px var(--accent-cyan-dim);
  }

  @media (max-width: 768px) {
    .ui-input,
    .ui-select {
      min-height: 44px;
    }
  }
  ```

- [ ] **Step 8: Create Input.tsx**

  Create `src/components/ui/Input.tsx`:

  ```tsx
  import './Input.css';

  export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { className = '', ...rest } = props;
    return <input className={`ui-input ${className}`.trim()} {...rest} />;
  }

  export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    const { className = '', ...rest } = props;
    return <select className={`ui-select ${className}`.trim()} {...rest} />;
  }
  ```

- [ ] **Step 9: Create ProgressBar.css**

  Create `src/components/ui/ProgressBar.css`:

  ```css
  .ui-progress {
    width: 100%;
    height: 8px;
    border-radius: var(--radius-pill);
    background: var(--bg-card);
    border: 1px solid var(--border-default);
    overflow: hidden;
  }

  .ui-progress--tall { height: 10px; }
  .ui-progress--thin { height: 4px; }

  .ui-progress__fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--accent-cyan), #0ea5e9);
    transition: width var(--duration-normal) var(--ease-decel);
  }

  .ui-progress--gold .ui-progress__fill {
    background: linear-gradient(90deg, var(--accent-gold), #b8860b);
  }

  .ui-progress--red .ui-progress__fill {
    background: linear-gradient(90deg, var(--color-error), #b91c1c);
  }
  ```

- [ ] **Step 10: Create ProgressBar.tsx**

  Create `src/components/ui/ProgressBar.tsx`:

  ```tsx
  import './ProgressBar.css';

  type ProgressColor = 'cyan' | 'gold' | 'red';
  type ProgressSize = 'thin' | 'md' | 'tall';

  interface ProgressBarProps {
    value: number;       // 0–100
    color?: ProgressColor;
    size?: ProgressSize;
    className?: string;
  }

  export function ProgressBar({ value, color = 'cyan', size = 'md', className = '' }: ProgressBarProps) {
    const pct = Math.min(100, Math.max(0, value));
    const sizeClass = size !== 'md' ? ` ui-progress--${size}` : '';
    const colorClass = color !== 'cyan' ? ` ui-progress--${color}` : '';
    return (
      <div className={`ui-progress${sizeClass}${colorClass} ${className}`.trim()}>
        <div className="ui-progress__fill" style={{ width: `${pct}%` }} />
      </div>
    );
  }
  ```

- [ ] **Step 11: Verify build**

  ```bash
  cd c:/Users/gazav/OneDrive/Desktop/Athenea/scope
  npm run build 2>&1 | tail -10
  ```
  Expected: build completes, TypeScript finds no errors in the new files.

- [ ] **Step 12: Commit**

  ```bash
  git add src/components/ui/
  git commit -m "feat(ui): shared component library — Button, Card, Badge, Input, ProgressBar"
  ```

---

## Task 5: AppShell + Navigation

**Files:**
- Create: `src/components/AppShell/AppShell.tsx` + `AppShell.css`
- Create: `src/components/AppShell/BottomTabBar.tsx` + `BottomTabBar.css`
- Create: `src/components/AppShell/TopNavbar.tsx` + `TopNavbar.css`
- Modify: `src/pages/Layout.jsx`
- Delete: `src/components/Navbar.jsx`, `src/components/Navbar.css`

The `AppShell` renders a `BottomTabBar` on mobile (≤768px) and `TopNavbar` on desktop. `Layout.jsx` is updated to use `AppShell`. The `FloatingOmnibarFab` is hidden on mobile (replaced by the center FAB in `BottomTabBar`).

- [ ] **Step 1: Create BottomTabBar.css**

  Create `src/components/AppShell/BottomTabBar.css`:

  ```css
  .bottom-tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    height: 56px;
    padding-bottom: var(--safe-bottom);
    background: var(--bg-surface);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--border-subtle);
    box-shadow: 0 -2px 12px rgba(0,0,0,0.3);
  }

  .bottom-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 100%;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 0 4px;
    transition: color var(--transition-fast);
    -webkit-tap-highlight-color: transparent;
    position: relative;
  }

  .bottom-tab:active { transform: scale(0.94); }

  .bottom-tab.active {
    color: var(--accent-cyan);
  }

  .bottom-tab.active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 25%;
    right: 25%;
    height: 2px;
    background: var(--accent-cyan);
    border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  }

  .bottom-tab__icon {
    font-size: 1.4rem;
    line-height: 1;
  }

  .bottom-tab__label {
    font-size: 0.62rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Center FAB slot */
  .bottom-tab--fab {
    flex: 1.2;
  }

  .bottom-tab-fab-btn {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--bg-elevated);
    border: 1px solid var(--accent-cyan);
    box-shadow: var(--shadow-glow-cyan);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      transform var(--duration-fast) var(--ease-spring),
      box-shadow var(--transition-fast);
    -webkit-tap-highlight-color: transparent;
    position: relative;
    overflow: hidden;
  }

  .bottom-tab-fab-btn:active {
    transform: scale(0.92);
  }

  .bottom-tab-fab-btn img {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }

  .bottom-tab-fab-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    background: var(--color-error);
    color: #fff;
    border-radius: var(--radius-pill);
    font-size: 0.6rem;
    font-weight: 700;
    padding: 1px 4px;
    min-width: 16px;
    text-align: center;
    line-height: 1.4;
  }
  ```

- [ ] **Step 2: Create BottomTabBar.tsx**

  Create `src/components/AppShell/BottomTabBar.tsx`:

  ```tsx
  import { useNavigate, useLocation } from 'react-router-dom';
  import { Haptics, ImpactStyle } from '@capacitor/haptics';
  import { useOmnibar } from '../Omnibar/useOmnibar';
  import athenaLogo from '../../assets/img/Athena-logo.png';
  import './BottomTabBar.css';

  const TABS = [
    { label: 'Work',     icon: '⚡', path: '/workhub' },
    { label: 'Personal', icon: '🌿', path: '/personalhub' },
    { label: 'Finance',  icon: '💎', path: '/financehub' },
    { label: 'Settings', icon: '⚙️', path: '/settings' },
  ] as const;

  // Insert FAB between Personal and Finance
  const LEFT_TABS  = TABS.slice(0, 2);
  const RIGHT_TABS = TABS.slice(2);

  interface BottomTabBarProps {
    highInsightsCount?: number;
  }

  export function BottomTabBar({ highInsightsCount = 0 }: BottomTabBarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { openOmnibar } = useOmnibar();

    const handleTab = async (path: string) => {
      try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* desktop */ }
      navigate(path);
    };

    const handleFab = async () => {
      try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* desktop */ }
      openOmnibar();
    };

    const isActive = (path: string) =>
      location.pathname === path || location.pathname.startsWith(path + '/');

    return (
      <nav className="bottom-tab-bar" aria-label="Main navigation">
        {LEFT_TABS.map(tab => (
          <button
            key={tab.path}
            className={`bottom-tab${isActive(tab.path) ? ' active' : ''}`}
            onClick={() => handleTab(tab.path)}
            aria-label={tab.label}
            aria-current={isActive(tab.path) ? 'page' : undefined}
          >
            <span className="bottom-tab__icon" aria-hidden="true">{tab.icon}</span>
            <span className="bottom-tab__label">{tab.label}</span>
          </button>
        ))}

        <div className="bottom-tab bottom-tab--fab">
          <button
            className="bottom-tab-fab-btn"
            onClick={handleFab}
            aria-label="Open Athenea assistant"
          >
            <img src={athenaLogo} alt="Athenea" />
            {highInsightsCount > 0 && (
              <span className="bottom-tab-fab-badge">
                {highInsightsCount > 9 ? '9+' : highInsightsCount}
              </span>
            )}
          </button>
        </div>

        {RIGHT_TABS.map(tab => (
          <button
            key={tab.path}
            className={`bottom-tab${isActive(tab.path) ? ' active' : ''}`}
            onClick={() => handleTab(tab.path)}
            aria-label={tab.label}
            aria-current={isActive(tab.path) ? 'page' : undefined}
          >
            <span className="bottom-tab__icon" aria-hidden="true">{tab.icon}</span>
            <span className="bottom-tab__label">{tab.label}</span>
          </button>
        ))}
      </nav>
    );
  }
  ```

- [ ] **Step 3: Create TopNavbar.tsx**

  The `TopNavbar` is the existing `Navbar.jsx` with starburst animations removed and hardcoded colors replaced. Copy the full logic from `src/components/Navbar.jsx` and make these changes:
  - Change `import './Navbar.css'` to `import './TopNavbar.css'`
  - Rename `export const Navbar` → `export function TopNavbar`
  - In `Navbar.css`: find all `@keyframes starburst` rules and their references — remove them entirely.

  Create `src/components/AppShell/TopNavbar.tsx` as a copy of `src/components/Navbar.jsx` with:
  1. File extension `.tsx`, import path updated to `./TopNavbar.css`
  2. Export renamed to `TopNavbar`
  3. All occurrences of `#1f2937` replaced with `var(--bg-elevated)`
  4. All occurrences of `#111827` replaced with `var(--bg-base)`

  ```bash
  cp "src/components/Navbar.jsx" "src/components/AppShell/TopNavbar.tsx"
  ```
  Then make the edits above using Edit tool.

- [ ] **Step 4: Create TopNavbar.css**

  Copy `src/components/Navbar.css` to `src/components/AppShell/TopNavbar.css`, then:

  ```bash
  cp "src/components/Navbar.css" "src/components/AppShell/TopNavbar.css"
  ```

  Then remove the starburst animation from `TopNavbar.css`. Search for and delete these blocks:
  - `@keyframes starburst` (any variant)
  - Any selector that references `.starburst` or uses `clip-path` animation
  - Replace all `#1f2937` with `var(--bg-elevated)`
  - Replace all `#111827` with `var(--bg-base)`

- [ ] **Step 5: Create AppShell.css**

  Create `src/components/AppShell/AppShell.css`:

  ```css
  /* Desktop: show top navbar, hide bottom tab bar */
  .app-shell-top-nav  { display: block; }
  .app-shell-bottom-nav { display: none; }

  /* Mobile: hide top navbar, show bottom tab bar */
  @media (max-width: 768px) {
    .app-shell-top-nav  { display: none; }
    .app-shell-bottom-nav { display: flex; }
  }
  ```

- [ ] **Step 6: Create AppShell.tsx**

  AppShell renders only the navigation elements — it does NOT wrap page content.
  This keeps the existing `app-shell`/`app-content` layout untouched in Layout.jsx.

  Create `src/components/AppShell/AppShell.tsx`:

  ```tsx
  import { useEffect } from 'react';
  import { TopNavbar } from './TopNavbar';
  import { BottomTabBar } from './BottomTabBar';
  import './AppShell.css';

  interface AppShellProps {
    highInsightsCount?: number;
  }

  export function AppShell({ highInsightsCount = 0 }: AppShellProps) {
    // Toggle body class so CSS in index.css adds correct bottom padding on mobile
    useEffect(() => {
      const update = () => {
        if (window.innerWidth <= 768) document.body.classList.add('has-bottom-tab');
        else document.body.classList.remove('has-bottom-tab');
      };
      update();
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('resize', update);
        document.body.classList.remove('has-bottom-tab');
      };
    }, []);

    return (
      <>
        <div className="app-shell-top-nav">
          <TopNavbar />
        </div>
        <div className="app-shell-bottom-nav">
          <BottomTabBar highInsightsCount={highInsightsCount} />
        </div>
      </>
    );
  }
  ```

- [ ] **Step 7: Update Layout.jsx**

  Replace the content of `src/pages/Layout.jsx`:

  ```jsx
  import { Outlet, useLocation } from "react-router-dom"
  import ScrollToTop from "../components/ScrollToTop"
  import { AppShell } from "../components/AppShell/AppShell"
  import { GatekeeperModal } from "../components/modals/GatekeeperModal"
  import { ReminderToasts } from "../components/ReminderToasts"
  import NativeReminderNotifications from "../components/NativeReminderNotifications"
  import { Omnibar } from "../components/Omnibar/Omnibar"
  import { FloatingOmnibarFab } from "../components/Omnibar/FloatingOmnibarFab"
  import { FABShowToggle } from "../components/Omnibar/FABShowToggle"
  import { ToastContainer, showToast } from "../components/Toast"
  import {
      useExternalCalendarObserver,
      useInsightNotificationBridge,
      useProactiveInsights,
      useWidgetDataBridge
  } from "../modules/intelligence"
  import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary"
  import { useRoutineAlarms } from "../hooks/useRoutineAlarms"
  import { useDeepLink } from "../hooks/useDeepLink"
  import { useAppWidgetSync } from "../hooks/useAppWidgetSync"

  export const Layout = () => {
      const location = useLocation();
      const { insights } = useProactiveInsights();
      useInsightNotificationBridge(true);
      useExternalCalendarObserver(true);
      useWidgetDataBridge(true);
      useRoutineAlarms();
      useDeepLink();
      useAppWidgetSync();

      const highInsightsCount = insights.filter((i) => i.severity === 'high').length;

      const handleOmnibarActionExecuted = (result) => {
          if (result?.success) {
              showToast(result.message || 'Action completed', 'success', 2600, '✓');
              return;
          }
          showToast(result?.message || 'Action could not be completed', 'warning', 3200, '!');
      };

      return (
          <ScrollToTop>
              {/* AppShell renders TopNavbar (desktop) OR BottomTabBar (mobile) */}
              <AppShell highInsightsCount={highInsightsCount} />
              <div className="app-shell">
                  <main className="app-content">
                      <ErrorBoundary key={location.pathname} message="This page had an unexpected error.">
                          <Outlet />
                      </ErrorBoundary>
                  </main>
              </div>
              <GatekeeperModal />
              <ReminderToasts />
              <NativeReminderNotifications />
              <Omnibar defaultHub="WorkHub" onActionExecuted={handleOmnibarActionExecuted} />
              <ToastContainer />
              {/* FloatingOmnibarFab hidden on mobile via CSS — bottom tab has its own FAB */}
              <FloatingOmnibarFab highInsightsCount={highInsightsCount} />
              <FABShowToggle />
          </ScrollToTop>
      )
  }
  ```

  Note: `FloatingOmnibarFab` stays in the tree but is visually hidden on mobile. Add this to `src/components/Omnibar/FloatingOmnibarFab.css`:
  ```css
  @media (max-width: 768px) {
    .omnibar-fab { display: none !important; }
  }
  ```

- [ ] **Step 8: Verify build — no Navbar import errors**

  ```bash
  cd c:/Users/gazav/OneDrive/Desktop/Athenea/scope
  npm run build 2>&1 | grep -E "(error|Error|cannot find)" | head -20
  ```
  Expected: no import errors. If you see `Cannot find module '../components/Navbar'`, search for remaining imports of the old Navbar and update them to use `TopNavbar` from AppShell.

- [ ] **Step 9: Delete old Navbar files**

  ```bash
  rm src/components/Navbar.jsx src/components/Navbar.css
  ```

- [ ] **Step 10: Final build check**

  ```bash
  npm run build 2>&1 | tail -10
  ```
  Expected: clean build.

- [ ] **Step 11: Commit**

  ```bash
  git add src/components/AppShell/ src/pages/Layout.jsx src/components/Omnibar/FloatingOmnibarFab.css
  git rm src/components/Navbar.jsx src/components/Navbar.css
  git commit -m "feat(nav): AppShell with BottomTabBar (mobile) + TopNavbar (desktop), remove old Navbar"
  ```

---

## Task 6: Omnibar Redesign

**Files:**
- Modify: `src/components/Omnibar/Omnibar.css` (full rewrite)
- Modify: `src/components/Omnibar/Omnibar.tsx` (add mobile sheet class + aria)

This removes the conflicting `:root` block and purple/blue values, replacing with the app's cyan/gold system.

- [ ] **Step 1: Read the current Omnibar.css**

  Read the full file to understand all sections before rewriting.

- [ ] **Step 2: Delete the conflicting `:root` block**

  The file starts with a `:root` block (lines 1–21 approx) that defines `--athenea-primary`, `--bg-primary`, `--text-primary`, etc. This block MUST be removed entirely. It overrides global tokens app-wide.

  Find the block starting with `:root {` and ending with the matching `}` and delete it completely.

- [ ] **Step 3: Replace `.omnibar-top-strip`**

  Find:
  ```css
  .omnibar-top-strip {
    height: 6px;
    width: 100%;
    background: linear-gradient(90deg, var(--color-info) 0%, #667eea 35%, #8b5cf6 70%, #ec4899 100%);
    box-shadow: 0 6px 18px rgba(102, 126, 234, 0.35);
  }
  ```
  Replace with:
  ```css
  .omnibar-top-strip {
    height: 4px;
    width: 100%;
    background: linear-gradient(90deg, var(--accent-cyan), var(--accent-gold));
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }
  ```

- [ ] **Step 4: Replace `.omnibar-header` background**

  Find:
  ```css
  .omnibar-header {
    ...
    background: linear-gradient(135deg, rgba(26, 26, 53, 0.8) 0%, rgba(15, 15, 35, 0.9) 100%);
    border-bottom: 1px solid rgba(124, 143, 245, 0.2);
    ...
  }
  ```
  Replace those two properties with:
  ```css
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
  ```

- [ ] **Step 5: Replace `.omnibar-header::after` border gradient**

  Find:
  ```css
  .omnibar-header::after {
    ...
    background: linear-gradient(90deg, transparent, var(--border-color), transparent);
  }
  ```
  Replace with:
  ```css
  .omnibar-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-default), transparent);
  }
  ```

- [ ] **Step 6: Fix `.omnibar-title` color**

  Find: `color: #f1f5f9;`
  Replace: `color: var(--text-primary);`

- [ ] **Step 7: Fix `.omnibar-version` colors**

  Find:
  ```css
  .omnibar-version {
    ...
    border: 1px solid rgba(124, 143, 245, 0.5);
    background: rgba(124, 143, 245, 0.15);
    color: #a5b4fc;
    ...
  }
  ```
  Replace those three properties:
  ```css
    border: 1px solid var(--accent-cyan);
    background: var(--accent-cyan-dim);
    color: var(--accent-cyan);
  ```

- [ ] **Step 8: Fix `.omnibar-shortcut` colors**

  Find:
  ```css
  .omnibar-shortcut {
    ...
    background: rgba(37, 37, 71, 0.6);
    border: 1px solid rgba(124, 143, 245, 0.25);
    ...
  }
  .omnibar-shortcut:hover {
    background: rgba(124, 143, 245, 0.2);
    ...
  }
  ```
  Replace:
  ```css
  .omnibar-shortcut {
    font-size: 10px;
    color: var(--text-muted);
    background: var(--bg-card);
    border: 1px solid var(--border-default);
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-weight: 500;
    transition: all var(--duration-fast) ease;
  }
  .omnibar-shortcut:hover {
    background: var(--accent-cyan-dim);
    color: var(--accent-cyan);
  }
  ```

- [ ] **Step 9: Fix `.omnibar-tabs` background**

  Find:
  ```css
  .omnibar-tabs {
    ...
    background: linear-gradient(180deg, rgba(26, 26, 53, 0.6) 0%, rgba(15, 15, 35, 0.8) 100%);
    border-bottom: 1px solid rgba(124, 143, 245, 0.15);
  }
  ```
  Replace those two properties:
  ```css
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
  ```

- [ ] **Step 10: Fix `.omnibar-tab` colors (inactive and active)**

  Find:
  ```css
  .omnibar-tab {
    ...
    background: rgba(37, 37, 71, 0.3);
    ...
    color: var(--text-tertiary);
    ...
  }
  .omnibar-tab::before {
    ...
    background: var(--athenea-primary);
    ...
  }
  .omnibar-tab:hover:not(.active) {
    color: #a5b4fc;
    background: rgba(124, 143, 245, 0.15);
    border: 1px solid rgba(124, 143, 245, 0.3);
  }
  .omnibar-tab.active {
    color: white;
    background: linear-gradient(135deg, var(--athenea-primary) 0%, var(--athenea-primary-light) 100%);
    box-shadow: 0 8px 18px rgba(102, 126, 234, 0.36);
    border-color: transparent;
  }
  /* Tab-specific colors */
  .omnibar-tab:nth-child(1).active { ... }
  .omnibar-tab:nth-child(2).active { ... }
  .omnibar-tab:nth-child(3).active { ... }
  ```

  Replace all of the above tab color rules with:
  ```css
  .omnibar-tab {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: var(--radius-md);
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--duration-fast) ease;
  }

  .omnibar-tab:hover:not(.active) {
    color: var(--text-secondary);
    background: var(--accent-cyan-dim);
  }

  /* Work tab */
  .omnibar-tab:nth-child(1).active {
    background: var(--accent-cyan-dim);
    color: var(--accent-cyan);
    border-color: var(--accent-cyan);
    box-shadow: none;
  }

  /* Personal tab */
  .omnibar-tab:nth-child(2).active {
    background: rgba(244, 63, 94, 0.12);
    color: #f43f5e;
    border-color: #f43f5e;
    box-shadow: none;
  }

  /* Finance tab */
  .omnibar-tab:nth-child(3).active {
    background: var(--accent-gold-dim);
    color: var(--accent-gold);
    border-color: var(--accent-gold);
    box-shadow: none;
  }
  ```

- [ ] **Step 11: Fix `.omnibar-content` background**

  Find: `background: var(--bg-primary);`
  Replace: `background: var(--bg-base);`

- [ ] **Step 12: Add mobile sheet + desktop modal layout**

  Append to the end of `Omnibar.css`:

  ```css
  /* ── Mobile: bottom sheet ───────────────────────────────── */
  @media (max-width: 768px) {
    .omnibar-overlay {
      align-items: flex-end;
    }

    .omnibar-modal {
      width: 100%;
      max-width: 100%;
      max-height: 90vh;
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      border-bottom: none;
    }

    .omnibar-top-strip {
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    }

    /* Slide-up entry animation on mobile */
    .omnibar-modal {
      animation: omnibar-slide-up var(--duration-normal) var(--ease-spring) forwards;
    }

    @keyframes omnibar-slide-up {
      from { transform: translateY(100%); opacity: 0.8; }
      to   { transform: translateY(0);    opacity: 1; }
    }
  }

  /* ── Desktop: centered modal (existing behavior) ───────── */
  @media (min-width: 769px) {
    .omnibar-modal {
      animation: omnibar-scale-in var(--duration-normal) var(--ease-spring) forwards;
    }

    @keyframes omnibar-scale-in {
      from { transform: scale(0.95); opacity: 0; }
      to   { transform: scale(1);    opacity: 1; }
    }
  }
  ```

- [ ] **Step 13: Update Omnibar.tsx — add role="status" on stream area**

  In `src/components/Omnibar/Omnibar.tsx`, find the element that wraps the streaming message text (the agent bubble `<div>` that receives streamed tokens). Add `role="status" aria-live="polite"` to it.

  Find the element that renders `renderMarkdown(msg.text)` inside the chat message map and ensure its container has:
  ```tsx
  <div role="status" aria-live="polite" aria-atomic="false">
    {/* rendered markdown content */}
  </div>
  ```

- [ ] **Step 14: Verify build**

  ```bash
  cd c:/Users/gazav/OneDrive/Desktop/Athenea/scope
  npm run build 2>&1 | tail -10
  ```

- [ ] **Step 15: Commit**

  ```bash
  git add src/components/Omnibar/
  git commit -m "feat(omnibar): glass morphism redesign — remove :root conflict, cyan/gold unified, mobile sheet"
  ```

---

## Task 7: Hub Pages Token Cleanup

**Files:**
- Modify: `src/pages/WorkHub.css`
- Modify: `src/pages/PersonalHub.css`
- Modify: `src/pages/FinanceHub.css`

Replace all hardcoded hex values with design tokens. Add missing transitions.

- [ ] **Step 1: WorkHub.css — replace hardcoded border-radius values**

  In `src/pages/WorkHub.css`, do a search-and-replace for:
  - `border-radius: 14px` → `border-radius: var(--radius-md)`
  - `border-radius: 16px` → `border-radius: var(--radius-lg)`
  - `border-radius: 10px` → `border-radius: var(--radius-sm)`
  - `border-radius: 999px` → `border-radius: var(--radius-pill)`

- [ ] **Step 2: WorkHub.css — replace hardcoded shadow-glow-cyan references**

  Find `rgba(30, 201, 255,` and replace with references using `var(--accent-cyan-dim)` where appropriate.
  Specifically the `.cortana-briefing` border-color:
  - `color-mix(in srgb, var(--accent-cyan) 30%, transparent)` → `var(--border-default)`
  - `color-mix(in srgb, var(--accent-cyan) 6%, var(--bg-surface))` → `var(--accent-cyan-dim)`
  - `color-mix(in srgb, var(--accent-cyan) 8%, var(--bg-base))` → `var(--accent-cyan-dim)`

- [ ] **Step 3: WorkHub.css — fix workhub-progress-bar fill color**

  Find: `background: linear-gradient(90deg, var(--accent-cyan), #0ea5e9);`
  Replace: `background: linear-gradient(90deg, var(--accent-cyan), #0891b2);`

- [ ] **Step 4: PersonalHub.css — replace hardcoded form input colors**

  Find:
  ```css
  .personalhub-form input {
    border-radius: 10px;
    border: 1px solid #3e5d7d;
    background: #122a42;
    color: #f5f8ff;
    -webkit-text-fill-color: #f5f8ff;
    ...
  }
  .personalhub-form input::placeholder {
    color: #b9c8d9;
    -webkit-text-fill-color: #b9c8d9;
  }
  ```
  Replace with:
  ```css
  .personalhub-form input {
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-base);
    color: var(--text-primary);
    -webkit-text-fill-color: var(--text-primary);
    padding: 0.5rem 0.75rem;
    font-size: 0.95rem;
  }
  .personalhub-form input::placeholder {
    color: var(--text-secondary);
    -webkit-text-fill-color: var(--text-secondary);
  }
  ```

- [ ] **Step 5: PersonalHub.css — add transition on action buttons**

  Find `.personalhub-actions button {` and add inside the rule:
  ```css
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  ```

  Add hover state:
  ```css
  .personalhub-actions button:hover {
    background: var(--accent-cyan);
    color: var(--bg-base);
  }
  ```

- [ ] **Step 6: PersonalHub.css — replace all border-radius hardcoded values**

  - `border-radius: 16px` → `border-radius: var(--radius-lg)`
  - `border-radius: 10px` → `border-radius: var(--radius-sm)`
  - `border-radius: 999px` → `border-radius: var(--radius-pill)`
  - `border-radius: 6px` → `border-radius: var(--radius-sm)`

- [ ] **Step 7: FinanceHub.css — replace hardcoded form input colors**

  Find:
  ```css
  .financehub-form input,
  .financehub-form select {
    border-radius: 10px;
    border: 1px solid #3e5d7d;
    background: #122a42;
    color: #f5f8ff;
    -webkit-text-fill-color: #f5f8ff;
    ...
  }
  .financehub-form input::placeholder {
    color: #b9c8d9;
    -webkit-text-fill-color: #b9c8d9;
  }
  ```
  Replace:
  ```css
  .financehub-form input,
  .financehub-form select {
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-base);
    color: var(--text-primary);
    -webkit-text-fill-color: var(--text-primary);
    padding: 0.55rem 0.75rem;
    font-size: 0.95rem;
  }
  .financehub-form input::placeholder {
    color: var(--text-secondary);
    -webkit-text-fill-color: var(--text-secondary);
  }
  ```

- [ ] **Step 8: FinanceHub.css — fix hardcoded saldo colors**

  Find:
  ```css
  .financehub-stat-saldo {
    border-color: #0891b2;
    box-shadow: 0 0 0 1px rgba(8, 145, 178, 0.25);
  }
  .financehub-stat-saldo strong {
    color: #67e8f9;
  }
  ```
  Replace:
  ```css
  .financehub-stat-saldo {
    border-color: var(--accent-cyan);
    box-shadow: var(--shadow-glow-cyan);
  }
  .financehub-stat-saldo strong {
    color: var(--accent-cyan);
  }
  ```

- [ ] **Step 9: FinanceHub.css — replace all border-radius hardcoded values**

  - `border-radius: 16px` → `var(--radius-lg)`
  - `border-radius: 14px` → `var(--radius-md)`
  - `border-radius: 10px` → `var(--radius-sm)`
  - `border-radius: 999px` → `var(--radius-pill)`
  - `border-radius: 6px` → `var(--radius-sm)`

- [ ] **Step 10: Verify build**

  ```bash
  cd c:/Users/gazav/OneDrive/Desktop/Athenea/scope
  npm run build 2>&1 | tail -10
  ```

- [ ] **Step 11: Commit**

  ```bash
  git add src/pages/WorkHub.css src/pages/PersonalHub.css src/pages/FinanceHub.css
  git commit -m "fix(hubs): replace all hardcoded hex with design tokens, add missing transitions"
  ```

---

## Task 8: Settings Cleanup

**Files:**
- Modify: `src/pages/Settings.css`

Remove the duplicate `.settings-button.primary` rule and fix undefined token references.

- [ ] **Step 1: Remove the gradient-based `.settings-button.primary` definition**

  In `Settings.css` around lines 98–106 there is a first `.settings-button.primary` definition that uses `linear-gradient`. The canonical definition (cyan solid) is at lines ~339–351. Delete the first duplicate:

  Find and remove:
  ```css
  .settings-button.primary {
    background: linear-gradient(135deg, var(--core-accent), var(--core-accent-2));
    color: #ffffff;
  }

  .settings-button.primary:hover {
    filter: brightness(1.05);
    transform: translateY(-1px);
  }
  ```

- [ ] **Step 2: Fix `--accent-cyan-dim` usage in Settings**

  The file uses `--core-accent-2: var(--accent-cyan-dim)`. Now that `--accent-cyan-dim` is defined in tokens (Task 1), this works. Verify `--core-accent-2` resolves correctly — no change needed if it does.

- [ ] **Step 3: Replace hardcoded border-radius in Settings**

  - `border-radius: 14px` → `var(--radius-md)`
  - `border-radius: 9px` → `var(--radius-sm)`
  - `border-radius: 10px` → `var(--radius-sm)`
  - `border-radius: 4px` → `var(--radius-sm)` (only 4px ones from old token)

- [ ] **Step 4: Verify build**

  ```bash
  cd c:/Users/gazav/OneDrive/Desktop/Athenea/scope
  npm run build 2>&1 | tail -10
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/Settings.css
  git commit -m "fix(settings): remove duplicate .settings-button.primary, standardize border-radius"
  ```

---

## Task 9: Secondary Pages Token Cleanup

**Files:**
- Modify: `src/pages/MyTasks.css`, `Projects.css`, `ProjectDetails.css`, `Notes.css`, `Routines.css`, `Calendar.css`, `Todos.css`, `Payments.css`, `Profile.css`, `FocusMode.css`, `Journal.css`, `WeeklyReview.css`, `StatsPage.css`, `Fleet.css`
- Modify: `src/pages/FinanceBudgeting.jsx` (inline styles if any), `FinanceDebts.css`, `FinanceSections.css`, `FinanceWallets.css`

For each file: replace hardcoded hex → tokens, standardize border-radius, add `overscroll-behavior` to scroll containers.

- [ ] **Step 1: Run a global search for hardcoded problematic values**

  ```bash
  cd c:/Users/gazav/OneDrive/Desktop/Athenea/scope/src/pages
  grep -rn "#122a42\|#3e5d7d\|#f5f8ff\|#b9c8d9\|#1f2937\|#111827\|rgba(26,\|rgba(26, " --include="*.css" --include="*.jsx" --include="*.tsx"
  ```
  Note every file returned. Fix each one:
  - `#122a42` → `var(--bg-base)`
  - `#3e5d7d` → `var(--border-default)`
  - `#f5f8ff` → `var(--text-primary)`
  - `#b9c8d9` → `var(--text-secondary)`
  - `#1f2937` → `var(--bg-elevated)`
  - `#111827` → `var(--bg-base)`
  - `rgba(26, 26, 53, ...)` → `var(--bg-surface)` or `var(--bg-elevated)`

- [ ] **Step 2: Replace border-radius ad-hoc values globally**

  ```bash
  grep -rn "border-radius: 1[04]px\|border-radius: 16px" --include="*.css" src/pages/
  ```
  For each match, apply the token mapping:
  - `14px` → `var(--radius-md)`
  - `16px` → `var(--radius-lg)`
  - `10px` → `var(--radius-sm)`

- [ ] **Step 3: Add mobile scroll polish to pages with scroll containers**

  For each page that has a scrollable list or feed (MyTasks, Notes, Calendar, Journal), find the scroll container and add:
  ```css
  .mytasks-list,
  .notes-list,
  .journal-entries,
  .calendar-body {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  ```
  (Use the actual class names found in each file.)

- [ ] **Step 4: Verify no remaining hardcoded input colors**

  ```bash
  grep -rn "#122a42\|#3e5d7d\|rgba(124, 143" --include="*.css" src/
  ```
  Expected: no output.

- [ ] **Step 5: Verify build**

  ```bash
  cd c:/Users/gazav/OneDrive/Desktop/Athenea/scope
  npm run build 2>&1 | tail -10
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/
  git commit -m "fix(pages): token cleanup across all secondary pages — no hardcoded hex, standardized radius"
  ```

---

## Self-Review Checklist

After all tasks are complete, verify the success criteria from the spec:

```bash
# 1. No hardcoded hex outside tokens.css
grep -rn "#[0-9a-fA-F]\{6\}\|#[0-9a-fA-F]\{3\}" --include="*.css" src/ | grep -v "tokens.css" | grep -v ".min.css"

# 2. No purple/blue Omnibar values remain
grep -rn "667eea\|8b5cf6\|ec4899\|26, 26, 53\|124, 143, 245" src/components/Omnibar/

# 3. No perpetual animations in navbar/omnibar
grep -rn "animation.*infinite" --include="*.css" src/components/AppShell/ src/components/Omnibar/

# 4. Build is clean
npm run build 2>&1 | tail -5
```

Expected outputs:
1. Only `tokens.css` lines — no other CSS files with raw hex
2. No output (all purple/blue removed)
3. No output (no perpetual animations in nav/omnibar)
4. `✓ built in X.XXs` or equivalent success message
