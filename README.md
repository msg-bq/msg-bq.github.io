# msg-bq.github.io

KELE documentation site built with VitePress (Chinese default, English at `/en/`).

## Development

```bash
npm install
npm run docs:dev
```

## Build

```bash
npm run docs:build
npm run docs:preview
```

## Versioned Tutorials

- `latest` stays on `/` and `/en/`
- Archived snapshots live under `/<version>/` and `/en/<version>/`
- Create a new snapshot with `npm run docs:version -- v1.1`

After creating a snapshot, add the new version key to `docs/.vitepress/versioning.mjs` so it appears in the version switcher and sidebar routing.

## Structure

- `docs/zh/` — Chinese docs (root locale)
- `docs/en/` — English docs
- `docs/versions/<version>/` — archived documentation snapshots
- `docs/.vitepress/` — VitePress config/theme
- `scripts/prepare-docs.mjs` — generates `docs/zh/advanced_example.md` from `.del_md`
- `scripts/version-docs.mjs` — snapshots the current docs into a versioned archive
