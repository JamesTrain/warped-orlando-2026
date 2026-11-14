# Warped Orlando 2026

Build a shareable, home-screen installable static PWA for the November 14–15, 2026 festival at Camping World Stadium. User selected official artwork plus geographic view. Hosting: new JamesTrain/warped-orlando-2026 repository, GitHub Pages.

The official 1080×1350 artwork comes from the festival's Hours & Info page. It is an illustration, so GPS placement must always be labeled approximate. Use sourced street intersection control points; show accuracy radius, stale state and outside-artwork state. Geographic view uses OpenStreetMap with attribution and online tile loading; official artwork and app shell work offline after successful initial cache. No background location, backend, analytics, or location transmission; share only canonical app URL.

Approaches: artwork only cannot provide geographic verification; geographic-only loses festival information. Selected dual view preserves both. Use vendored Leaflet 1.9.4, vanilla ES modules, CSS and a service worker to minimize hosting/dependency requirements. Local asset URLs and manifest scope support GitHub Pages subdirectories.

Mobile-first bright cream/orange/forest design with dominant map, segmented views, accessible controls, location status card, share and installation controls. Location starts only after user taps Locate me, can be stopped, and restarts only explicitly. Errors are actionable. GPS watching pauses when hidden; old coordinates become stale. Install guidance covers iOS and Android, with native install prompt when available. Share has native, clipboard, and selectable-link fallbacks.

Acceptance: correct artwork, usable pan/zoom, tested projection, denied/unavailable/outside/stale location states, offline reload under repository path, manifest/icons, privacy-preserving share, install instructions and deployed HTTPS verification. GPS hardware behavior requires phone validation; artwork projection is approximate and not turn-by-turn navigation.
