# Warped Orlando 2026 · Pocket Map

A mobile-first, installable PWA for **Vans Warped Tour Orlando, November 14–15, 2026**, at Camping World Stadium Campus.

**GitHub Pages: https://jamestrain.github.io/warped-orlando-2026/**

The link is available after the first successful Pages deployment.

- Official festival artwork with pan, pinch/scroll zoom, fit and save-image controls.
- Opt-in live GPS dot, reported accuracy, stale/paused states, and geographic OpenStreetMap view.
- Local offline festival artwork and app shell after the indicator says **Offline map ready**.
- Home-screen installation on iOS, Android and desktop; native Share or copy-link fallback.
- No login, backend, analytics, stored locations, or location in shared links.

## On your phone

Open the live link in Safari or Chrome. Tap **Locate me** (or the map crosshair) and allow location access. Use **Festival map / Street map** to change views.

**iPhone:** Safari → Share → Add to Home Screen → Add.  
**Android:** Chrome → Install app, or ⋮ → Add to Home screen.  
**Desktop:** Chrome/Edge address-bar install icon, when available.

Wait for **Offline map ready** before leaving coverage. Street map tiles need internet. Your phone may still obtain GPS fixes offline. Browsers can evict cached files; check readiness before the event.

**The artwork dot is approximate.** The official image distorts distances and landmark shapes; its placement error is separate from the GPS accuracy number. Street map shows geographic coordinates. Neither view provides walking routes. [Map sources and control points](docs/map-sources.md).

Location watches pause when the page is hidden. Tap Resume location when you return. Stop using my location clears the dot. Street map requests OpenStreetMap tiles for the viewed area, disclosing the map area and IP address to that provider. The app itself does not send GPS coordinates to a server.

## Develop

No build, API keys, or production dependencies. Serve the repository on localhost (not `file://`):

```sh
python3 -m http.server 3000
# Open http://localhost:3000
npm test
```

Unit tests use Node 22+ and cover projection anchors, outside/invalid coordinates, freshness, location-free sharing, offline shell, scoped caches and coherent updates.

Optional browser tests need Playwright and Chromium:

```sh
npm install --no-save playwright
npx playwright install chromium
npm run test:browser
```

Set `CHROMIUM_PATH` to use a system Chromium, or `PLAYWRIGHT_MODULE` to an installed Playwright module. Browser tests run a local server at port 4173, emulate GPS, stub external tiles, check mobile layout and offline reloads, and save screenshots to `test-results/`. Real phone GPS and OS installation still require a device check.

## Publish and update

GitHub Actions deploys `main` to GitHub Pages. The workflow stages only public app files, excluding tests and documentation. Pages uses the **GitHub Actions** source.

**For every app or map change, increment `CACHE_NAME`'s version in `sw.js`.** The service worker installs a complete atomic shell and retains that shell's matching HTML/scripts until the update is accepted. Existing visitors see an update notice; open map info (ⓘ) and tap **Load app update**. Shared links contain no coordinates. All app paths, manifest scope, and service worker paths are relative to support project Pages URLs.

## Credits

Unofficial fan companion; no affiliation with Vans, Warped Tour, Insomniac, or venue operators. Festival artwork and branding remain the property of their respective owners. [Official map source](https://www.vanswarpedtourorlando.com/hoursandinfo). Leaflet 1.9.4 is vendored under its [BSD 2-Clause license](assets/leaflet-LICENSE.txt). Geographic maps © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
