# GitHub Pages Deployment

Rat Tracker deploys to GitHub Pages through GitHub Actions.

## One-Time GitHub Setup

1. Open the repository on GitHub:

   ```text
   https://github.com/rd4bs/rat-tracker
   ```

2. Go to `Settings`.
3. In the left sidebar, open `Pages`.
4. Under `Build and deployment`, set `Source` to `GitHub Actions`.
5. Save if GitHub shows a save control.

## Deploy

Deploys run automatically whenever changes are pushed to `main`.

```powershell
git add .
git commit -m "Describe the change"
git push
```

The workflow builds with the GitHub Pages base path:

```text
/rat-tracker/
```

## Production URL

After the workflow finishes, the app should be available at:

```text
https://rd4bs.github.io/rat-tracker/
```

Deployment confirmed on desktop and phone on 2026-06-21.

## Check Deployment Status

1. Open the repository on GitHub.
2. Go to the `Actions` tab.
3. Open the latest `Deploy Rat Tracker to GitHub Pages` run.
4. Confirm both jobs pass:
   - `build`
   - `deploy`

## Phone PWA Test

Use the GitHub Pages URL for secure-context phone testing:

```text
https://rd4bs.github.io/rat-tracker/
```

Confirm:

- The app loads over HTTPS.
- The header says `Rat Tracker`.
- The PWA status does not show `HTTPS Needed`.
- The app reaches offline-ready status.
- The phone can install the app.
- The installed app launches offline.
- Offline create/edit/save persists after reconnect.

## Troubleshooting

- If the app shows a blank page, confirm the workflow used `GITHUB_PAGES=true` during `npm run build`.
- If icons or the manifest fail to load, confirm URLs include `/rat-tracker/`.
- If the service worker fails to register, confirm the app was opened at `https://rd4bs.github.io/rat-tracker/` and not a local HTTP URL.
- If the workflow fails, open the failed step in the `Actions` tab and review the log.
