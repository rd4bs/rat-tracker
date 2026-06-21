# Rat Tracker PWA Phone Testing Guide

This guide explains how to test the Rat Tracker app on desktop and phone, including the secure-context requirement for PWA install and offline behavior.

## Key Rule

Browsers require a secure context for service workers and PWA install prompts.

- Desktop `http://localhost` is treated as secure for local development.
- Phone access through `http://192.168.x.x` is useful for UI testing, but usually is not secure enough for service worker registration or install.
- Phone PWA install and true offline app-shell testing require `https://...` or a hosted HTTPS deployment.

## Current Local Network UI Test

Use this for responsive layout, forms, Dexie saves, and normal app behavior from a phone on the same Wi-Fi.

1. Build the latest app:

   ```powershell
   npm.cmd run build
   ```

2. Start the preview server on the network:

   ```powershell
   npm.cmd run preview:host -- --port 4173
   ```

3. Open the app from the phone:

   ```text
   http://<desktop-lan-ip>:4173/?v=manual-test
   ```

4. If the app loads slowly or not at all:

   - Confirm the desktop and phone are on the same Wi-Fi.
   - Confirm Windows Security / Windows Firewall allows the current `node.exe`.
   - Restart the preview server after Windows Security changes.
   - Try a fresh cache-busting URL such as `?v=2026-06-21-1`.
   - Confirm no VPN or guest Wi-Fi isolation is blocking phone-to-desktop access.

## Desktop PWA Test

Use desktop `localhost` for a quick secure-context PWA smoke test.

1. Start the app locally.
2. Open the app at `http://localhost:4173`.
3. Confirm the PWA status bar does not show `HTTPS Needed`.
4. Confirm the service worker reaches an offline-ready state.
5. Install the app from the browser install control if available.
6. Close the browser tab.
7. Launch the installed app.
8. Turn off network access and reload or relaunch.
9. Confirm the app shell still opens and existing IndexedDB data remains available.

## Phone PWA Install Options

Choose one of these before declaring phone PWA install/offline behavior confirmed.

### Option A: Hosted HTTPS

This is the simplest and most production-like test.

The current hosted HTTPS target is GitHub Pages:

```text
https://rd4bs.github.io/rat-tracker/
```

1. Commit and push changes to `main`.
2. Wait for the `Deploy Rat Tracker to GitHub Pages` workflow to pass.
3. Open the HTTPS URL on the phone.
4. Confirm service worker readiness.
5. Install the app.
6. Run the phone PWA retest checklist below.

### Option B: Local HTTPS

Use this when you want to keep testing against the desktop machine on the local network.

Requirements:

- A local HTTPS server for the Vite preview output.
- A certificate trusted by the phone.
- The phone must open the app with `https://<trusted-local-hostname-or-ip>`.

Notes:

- A self-signed certificate that is not trusted by the phone will still block reliable PWA testing.
- If the phone shows a certificate warning, fix trust first before testing install/offline behavior.
- Local HTTPS setup varies by tool, so keep the final command and certificate steps here after choosing the tool.

## Phone PWA Retest Checklist

Run this checklist only from a secure phone URL.

- Open the secure URL on the phone.
- Confirm the PWA status bar does not show `HTTPS Needed`.
- Confirm the app reports offline-ready after the service worker installs.
- Install the app from the browser.
- Launch the installed app.
- Create a planned workout.
- Add exercises and planned sets.
- Save the workout.
- Start the workout.
- Add actual set results.
- Save progress.
- Complete the workout.
- Export a backup.
- Turn on airplane mode.
- Relaunch or reload the installed app.
- Confirm the dashboard opens offline.
- Confirm existing workout data is still present.
- Create or edit a workout while offline.
- Turn network access back on.
- Confirm the offline-created or offline-edited data is still present.

## Service Worker Update Test

Use this after a new build has been deployed or served.

1. Open the existing app.
2. Confirm the PWA status bar detects an update when one is available.
3. Use the app update control.
4. Confirm the app reloads onto the new build.
5. Confirm existing IndexedDB workout data is still present.
6. Confirm export backup still works.

## Production Checklist

Before treating the app as production-ready outside local development:

- Host the app on HTTPS.
- Confirm `manifest.webmanifest` is reachable from the hosted URL.
- Confirm all app icons load from the hosted URL.
- Confirm the service worker loads without console errors.
- Confirm the app shell opens offline after install.
- Confirm backup export/import works from the hosted install.
- Confirm IndexedDB data remains after browser restart and installed-app relaunch.
- Keep a recent backup before testing service worker or data migrations.
