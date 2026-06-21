# Rat Tracker

Single-user workout-tracking PWA for desktop and mobile.

## Development

```powershell
npm.cmd install
npm.cmd run dev
```

## Local Network Preview

```powershell
npm.cmd run build
npm.cmd run preview:host -- --port 4173
```

## GitHub Pages

The app deploys through GitHub Actions to:

```text
https://rd4bs.github.io/rat-tracker/
```

In GitHub, set `Settings -> Pages -> Build and deployment -> Source` to `GitHub Actions`.

Then deploy with:

```powershell
git push
```

## Checks

```powershell
npm.cmd run lint
npm.cmd run check:data
npm.cmd run build
```
