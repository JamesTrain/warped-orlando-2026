# GitHub Pages deployment

GitHub access is authorized. Publication runs through the workflow below.

Repository: https://github.com/JamesTrain/warped-orlando-2026  
App: https://jamestrain.github.io/warped-orlando-2026/

The included GitHub Actions workflow publishes the `main` branch. It stages only public app files and assets; no build, API keys, or backend are required. Repository Settings → Pages → Source must be **GitHub Actions**.

The first deployment requires Pages to be enabled by a repository administrator. This is equivalent to:

```sh
gh api --method POST repos/JamesTrain/warped-orlando-2026/pages -f build_type=workflow
```

After editing app files or the map, increment the cache version in `sw.js`, run `npm test`, and push to `main`. Wait for the Pages workflow to succeed. Existing installed apps show an update notice; open map info (ⓘ) and tap **Load app update**.

Browser verification should cover the HTTPS Pages URL and offline reload under its `/warped-orlando-2026/` path. Real phone GPS and OS installation require a phone check.
