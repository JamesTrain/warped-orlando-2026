# Publish this ready-to-run app

The app has been built and tested locally. It is **not yet live**: the connected GitHub integration returned 403 when asked to create a repository.

1. Create an empty public repository named **warped-orlando-2026** under **JamesTrain**: https://github.com/new?name=warped-orlando-2026&visibility=public . Do not initialize with a README, .gitignore or license.
2. Send the repository URL back in this conversation. The prepared source can then be pushed and GitHub Pages enabled, provided the GitHub connection has write access to the new repository.

For manual deployment, run from the app directory:

```sh
git remote add origin https://github.com/JamesTrain/warped-orlando-2026.git
git push -u origin HEAD:main
gh api --method POST repos/JamesTrain/warped-orlando-2026/pages -f build_type=workflow
```

If `origin` already exists, use it. You need a GitHub login authorized to write contents, workflows and Pages settings. Alternatively set Settings → Pages → Source to **GitHub Actions** in the repository and push the `main` branch. The included workflow publishes the app without a build step. Wait for the Pages deployment workflow to succeed before opening https://jamestrain.github.io/warped-orlando-2026/ .
