# Scope Structure Refactor Plan

Date: 2026-04-05
Status: Drafted and partially started

## Why
The project has grown fast and now mixes:
- Active product code
- Legacy files
- Cross-cutting modules without strict boundaries

This plan defines safe steps to improve structure without breaking runtime behavior.

## Current Issues
1. Legacy files live alongside active pages/components.
2. State logic is split between `scope/store` and `scope/src/store`.
3. Intelligence module is rich but broad, with many responsibilities under one tree.
4. Style system lacks global tokens, causing repeated hardcoded values.

## Phase 0 (Done)
1. Create `scope/src/pages/_archive`.
2. Move `_SettingsLegacy.jsx` from active pages root to archive.
3. Add archive README with handling rules.

## Phase 1 (Safe Organization)
1. Add module README files with ownership and boundaries:
   - `src/modules/intelligence`
   - `src/modules/actions`
   - `src/modules/sensors`
2. Add a single architecture map file:
   - `scope/docs/ARCHITECTURE_MAP.md`
3. Add naming conventions for pages/components/slices.

## Phase 2 (State Consolidation)
1. Define target boundary for `store` vs `src/store`.
2. Migrate one slice at a time with compatibility exports.
3. Add regression checks for selector and middleware behavior.

## Phase 3 (UI System Cleanup)
1. Create global design tokens file.
2. Replace top repeated hardcoded colors and spacing values.
3. Normalize page themes across Work/Personal/Finance/System pages.

## Phase 4 (Reliability)
1. Add smoke tests per hub:
   - Work
   - Personal
   - Finance
   - Calendar
   - Intelligence
2. Add adapter contract tests:
   - skill id -> redux action mapping
   - payload transformation and validation

## Acceptance Criteria
1. No runtime regressions on core routes.
2. Legacy files isolated from active entry points.
3. Clear module ownership docs exist.
4. Store boundary formally documented.
5. Visual consistency baseline defined with tokens.
