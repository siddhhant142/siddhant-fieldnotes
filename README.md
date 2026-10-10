# Siddhant Fieldnotes

A browser-based CSV viewer with column filters, full-table search, and sortable columns. CSV files are parsed locally in the browser and are not uploaded to a server.

## Run locally

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Deploy

Pushing to `main` runs the GitHub Actions workflow in `.github/workflows/deploy.yml` and publishes the `dist` build to GitHub Pages.