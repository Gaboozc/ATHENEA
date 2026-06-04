# Frontend Implementation Plan: ATHENEA-PRIORITY-DASHBOARD Tactical Priority Dashboard Refactor

## 1. **Header**
- Title: `# Frontend Implementation Plan: ATHENEA-PRIORITY-DASHBOARD Tactical Priority Dashboard Refactor`

## 2. **Overview**
Refactor the legacy Production Tracking dashboard into the ATHENEA tactical priority system, preserving the existing app shell and extracting a standalone Sidebar component. Replace status-based task flow with a priority-score pipeline and introduce a 3-step Gatekeeper intake modal. Apply engineering dark mode (pitch black theme) with monospace typography and neon priority accents. Targeted TypeScript conversion will be applied to the new Dashboard and Gatekeeper modules, and to the priority calculation logic for full type safety. Sidebar navigation will be dedicated to operational views (Dashboard, Projects, Settings) and must not mirror the Navbar. The Navbar will be dedicated to global actions: the Gatekeeper "New Task" trigger and tenant context.

## 3. **Architecture Context**
- Components/services involved:
  - App shell: scope/src/pages/Layout.jsx, scope/src/components/Navbar.jsx
  - Production dashboard: scope/src/pages/ProductionTracking.jsx
  - Styles: scope/src/pages/ProductionTracking.css, scope/src/index.css
  - Permissions: scope/src/utils/permissions.js
  - Current user hook: scope/src/hooks/useCurrentUser.js
  - Store slice (production entries): scope/src/store/slices/productionSlice.js
- Sidebar: no standalone Sidebar component exists in scope/src/components. Must be extracted from main layout or created as a dedicated component with operational-only links (Dashboard, Projects, Settings).
- Navbar: refactor to host global actions only (Gatekeeper "New Task" trigger and tenant context).
- Routing: scope/src/routes.jsx (route for /production)
- State management: Redux slices with local UI state inside the dashboard page
- Targeted TypeScript conversion: new dashboard and Gatekeeper modules (new .tsx files and typed utilities)

## 4. **Implementation Steps**

#### **Step 0: Create Feature Branch**
- **Action**: Create and switch to a new feature branch following the development workflow.
- **Branch Naming**: `feature/gatekeeper-dashboard` (created from `main`)
- **Implementation Steps**:
  1. Ensure base branch `main` is up to date.
  2. Create new branch and verify.
- **Notes**: This must be the FIRST step before any code changes.

#### **Step 1: Locate or Extract Sidebar into Standalone Component**
- **File**: scope/src/components/Sidebar.jsx (new)
- **Action**: Locate any sidebar markup in layout or pages and extract it into a standalone component. If no sidebar exists, define a new Sidebar shell with operational-only links (Dashboard, Projects, Settings).
- **Implementation Steps**:
  1. Audit Layout and any layout-level JSX for sidebar elements.
  2. If found, extract to Sidebar component and replace with <Sidebar />.
  3. If not found, create Sidebar with operational-only navigation (Dashboard, Projects, Settings).
  4. Add Sidebar into Layout alongside Navbar and Outlet; apply engineering dark mode immediately (background #000000, subtle neon active state).
- **Dependencies**: React Router links, permissions utility (if used for conditional links).
- **Implementation Notes**: Sidebar must be a standalone component and retained across pages. Do not mirror Navbar links.

#### **Step 2: Introduce TypeScript Baseline for New Modules**
- **File**: scope/tsconfig.json (new), scope/vite.config.js (update if needed)
- **Action**: Add TypeScript configuration to support .ts/.tsx files in the legacy Vite React setup.
- **Implementation Steps**:
  1. Add minimal tsconfig for React + Vite with strict mode.
  2. Ensure Vite supports TS entry points (no code changes required if standard).
  3. Add any missing @types dependencies if needed.
- **Dependencies**: @types/react, @types/react-dom already present.
- **Implementation Notes**: Keep existing JS files intact; only new modules use TS.

#### **Step 3: Add Typed Priority Scoring Utility (Bulletproof 0-14)**
- **File**: scope/src/utils/priorityScore.ts (new)
- **Action**: Implement the 7-factor scoring algorithm with strict types.
- **Function/Component Signature**:
  - `type PriorityFactors = { blocking: 0 | 1 | 2; urgency: 0 | 1 | 2; impact: 0 | 1 | 2; omissionCost: 0 | 1 | 2; alignment: 0 | 1 | 2; mentalLoad: 0 | 1 | 2; quickWin: 0 | 1 | 2; }`
  - `export const calculatePriorityScore = (factors: PriorityFactors): number`
  - `export const getPriorityLevel = (score: number): PriorityLevel`
- **Implementation Steps**:
  1. Define strict types for factor values and level labels.
  2. Validate score boundaries and clamp if necessary.
  3. Map score to levels: Critical (12-14), High Velocity (9-11), Steady Flow (6-8), Low Friction (3-5), Backlog (0-2).
- **Dependencies**: None.
- **Implementation Notes**: This is the canonical calculation used by UI, store, and tests.

#### **Step 4: Gatekeeper Intake Modal (3-Step, TypeScript)**
- **File**: scope/src/components/GatekeeperModal.tsx (new)
- **Action**: Replace task creation flow with a 3-step modal.
- **Implementation Steps**:
  1. Step 1 (Context): Task name/subject and creator.
  2. Step 2 (Workstreams): Multi-select tags (Dev, Design, Marketing, CS).
  3. Step 3 (Algorithm): 7 sliders with live score + level display.
  4. Enforce step validation before progression.
  5. On submit, emit a typed payload for Redux.
- **Dependencies**: priorityScore.ts utility.
- **Implementation Notes**: Use monospace UI styling and neon accents for the priority score. Trigger the modal from the Navbar global action.

#### **Step 5: Convert Production Dashboard to TypeScript Module**
- **File**: scope/src/pages/ProductionTracking.tsx (rename from .jsx)
- **Action**: Targeted conversion for the dashboard with typed props and state.
- **Implementation Steps**:
  1. Add local type definitions for entries and filters.
  2. Replace status model with priority levels.
  3. Integrate GatekeeperModal for add/edit operations.
  4. Update filters and sorting for priority score and level.
- **Dependencies**: GatekeeperModal.tsx, priorityScore.ts.
- **Implementation Notes**: Preserve routing and existing permissions behavior.

#### **Step 6: Update Redux Slice for Priority Fields**
- **File**: scope/src/store/slices/productionSlice.js (or convert to .ts if scoped)
- **Action**: Add fields for priority factors, score, and level.
- **Implementation Steps**:
  1. Extend entry schema with priority fields.
  2. Compute priorityScore and priorityLevel on create and update.
  3. Provide defaults for legacy entries.
- **Dependencies**: priorityScore.ts utility.
- **Implementation Notes**: Keep changes minimal to avoid breaking other views.

#### **Step 7: Replace Status UI with Priority-Level UI**
- **File**: scope/src/pages/ProductionTracking.tsx
- **Action**: Replace status cards, badges, and filters with priority levels.
- **Implementation Steps**:
  1. Update stats cards to show counts by priority level.
  2. Update table columns to show priority level and score.
  3. Replace existing status badges with neon priority badges.
- **Dependencies**: priorityScore.ts for level mapping.

#### **Step 8: Engineering Dark Mode Styling**
- **Files**: scope/src/pages/ProductionTracking.css, scope/src/index.css, scope/src/components/Sidebar.css (new if needed)
- **Action**: Apply pitch black theme, monospace typography, neon priority accents.
- **Implementation Steps**:
  1. Define CSS variables for neon palette and dark surfaces.
  2. Update dashboard, modal, and table styles to dark theme.
  3. Apply monospace font stack globally or per module.
  4. Ensure focus states and contrast are accessible.
- **Implementation Notes**: Preserve layout spacing; only theme changes.

#### **Step 9: Update Dashboard Entry Points (If Applicable)**
- **File**: scope/src/pages/Dashboard.jsx (or .tsx if targeted)
- **Action**: Replace production status summaries with priority-level summaries if referenced.
- **Implementation Steps**:
  1. Update any production stats to use priority levels.
  2. Verify no legacy status labels remain.

#### **Step 10: Add Vitest and Unit Tests for Priority Scoring**
- **Files**: scope/vitest.config.ts (new), scope/src/utils/priorityScore.test.ts (new)
- **Action**: Add Vitest configuration and unit tests for the scoring algorithm.
- **Implementation Steps**:
  1. Add Vitest configuration and update package scripts.
  2. Write tests for exact score ranges and level mapping thresholds.
  3. Cover edge cases: all zeros, all twos, mixed inputs.
- **Dependencies**: Vitest, @testing-library/react (if needed for future).
- **Implementation Notes**: Priority is calculation logic; UI tests optional.

#### **Step 11: Update Technical Documentation**
- **Action**: Review and update technical documentation according to changes made.
- **Implementation Steps**:
  1. Review changes across UI, scoring, and TypeScript adoption.
  2. Update relevant docs in ai-specs-main/ai-specs/specs/ if needed.
  3. Ensure all updates are in English.
  4. Report updated files and changes.
- **Notes**: This step is mandatory before completion.

## 5. **Implementation Order**
1. Step 0: Create Feature Branch
2. Step 1: Locate/Extract Sidebar
3. Step 2: TypeScript Baseline for New Modules
4. Step 3: Typed Priority Scoring Utility
5. Step 4: Gatekeeper Intake Modal
6. Step 5: Convert Production Dashboard to TSX
7. Step 6: Update Redux Slice for Priority Fields
8. Step 7: Replace Status UI with Priority-Level UI
9. Step 8: Engineering Dark Mode Styling
10. Step 9: Update Dashboard Entry Points
11. Step 10: Vitest + Priority Scoring Tests
12. Step 11: Documentation Updates

## 6. **Testing Checklist**
- Priority score calculation unit tests (0-14 boundaries)
- Level mapping thresholds
- Modal validation sanity checks (manual)
- Regression checks for filtering and sorting

## 7. **Error Handling Patterns**
- Validation errors in modal steps (missing required fields)
- Safe defaults for legacy entries missing priority fields
- Defensive score clamp if invalid factor data is detected

## 8. **UI/UX Considerations**
- Monospace typography for dashboard and modal
- Neon accents for priority badges and highlights
- Accessibility: sufficient contrast on dark background
- Responsive layout for modal and dashboard table

## 9. **Dependencies**
- Vitest (unit testing)
- TypeScript (targeted module support)

## 10. **Notes**
- English-only content required across UI and documentation.
- Purge legacy lore terms; use only technical terminology.
- Do not introduce new routes unless necessary; refactor in place.

## 11. **Next Steps After Implementation**
- Validate priority scoring with stakeholder review
- Verify sidebar placement in all routes
- Confirm dark mode readability on small screens

## 12. **Implementation Verification**
- Code quality (lint)
- Priority scoring tests pass
- UI regression scan on dashboard and production views
- Documentation updates completed
