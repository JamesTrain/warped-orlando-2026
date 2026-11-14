# Orlando Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task.

**Goal:** Deploy a dual-view festival GPS PWA on GitHub Pages.
**Architecture:** Buildless browser ES modules, vendored Leaflet, local artwork and cacheable shell. Approximate art projection is distinct from geographic map.
**Tech Stack:** HTML, CSS, JavaScript, Leaflet, Node test runner, service worker, GitHub Pages.
**Spec:** docs/superpowers/specs/2026-11-14-orlando-map-design.md

## Global Constraints
- Relative URLs throughout; no server or build required.
- Location opt-in, no coordinates in shared links/storage.
- Official art position labeled approximate; tile map needs network.

## Review Focus
- Denied and timed-out GPS: helpful status with retry.
- Outside artwork: never clamp into a false festival location.
- Offline subpath reload: cache shell without cached location.
- Share cancellation: no spurious clipboard write.
- Background/stale fix: marker freshness communicated.

### Task 1: Map and GPS
- [x] Write failing projection tests: three sourced anchor matches, invalid input, outside detection, accuracy and freshness.
- [x] Run tests red, implement geo.js and config.js, run green.
- [x] Implement index.html, styles.css and app.js: dual Leaflet views, location state/accuracy, accessible controls, install and share fallbacks.

### Task 2: PWA shell (parallel asset worker)
- [x] Add manifest, icons, atomic offline cache and Pages workflow.
- [x] Test service worker install and offline fallback.

### Task 3: Review, verification and publishing
- [x] Run Node suite, validate static paths/manifest, browser smoke checks if available.
- [x] Fresh agent code review; repair material issues.
- [ ] Create own repo, push and enable GitHub Pages, verify deployment and HTTPS assets. Owner created the empty repository. Local source and checks complete, but Git push and file writes return HTTP 403: connected app is not installed/authorized for the owner account. Repository access requested.
- [x] Document install/use/source limits and deliver live URL.
