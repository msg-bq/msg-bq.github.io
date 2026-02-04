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

## Structure

- `docs/zh/` — Chinese docs (root locale)
- `docs/en/` — English docs
- `docs/.vitepress/` — VitePress config/theme
- `scripts/prepare-docs.mjs` — generates `docs/zh/advanced_example.md` from `.del_md`
