# Changelog

All notable changes in this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

## [1.0.4] - 2026-04-21

### Fixed

- Fixed Omnibar "Briefing" launch so the Daily Briefing modal opens reliably from the quick action.
- Ensured Daily Briefing visibility above Omnibar overlays.

### Changed

- Updated app version to `1.0.4`.
- Updated Android `versionCode` to `4` and `versionName` to `1.0.4`.

## [1.0.2] - 2026-04-18

### Changed

- Removed the top command strip from Dashboard ("Que quieres optimizar hoy?", "Ejecutar", and Ollama sync status).
- Cleaned unused dashboard styles related to the removed command strip in `src/pages/Dashboard.css`.

### Fixed

- Prevented stale UI styles from being kept after removing the dashboard command section.
