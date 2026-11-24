# Maintainer workspace screenshots

These images show the actual Concourse admin application using isolated synthetic
records and a synthetic reviewer. They contain no production feedback, account
identifiers, credentials or browser chrome.

Reproduce from the checkout with the pinned dependencies and Chromium installed:

```sh
bun run build
bun run screenshots:site
```

Set `CHROMIUM_PATH` when using an existing Chromium executable. The generator in
`scripts/site-screenshots.ts` serves the real build-embedded admin assets through
the test-only signed identity adapter. It never contacts production or provides
a production authentication bypass. Screenshots are curated public documentation
assets; diagnostic test output remains in ignored `test-results/`.
