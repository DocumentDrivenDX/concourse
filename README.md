# Novirhyza Concourse

Shared access and collaboration for published content: protected static sites,
comments and, later, structured interactions described by UMF.

Start with [the project index](docs/helix/README.md). The first implementation provides generic protected-publishing tooling and
a serverless inline section-comment service.

Status: 0.1.x. Tested in CI: Worker API (unit + Miniflare), browser widget and Hugo
integration (Playwright, Linux Chromium), Terraform validation. Not tested in CI: a live Cloudflare
deployment. Not built: UMF structured actions; Concourse is not integrated with the UMF stack.

Concourse builds on the Entropy Exchange playbooks pattern: static publication
with managed login and access control. The proposed split keeps reusable hosting
in the existing infrastructure estate, collaboration in Concourse, portable
models/action declarations in UMF, and content in the publishing repositories.

TypeScript with Bun development tooling, Cloudflare as the first hosting
candidate, managed provider login and Playwright verification are owner-accepted
planning assumptions. The first slice selects Cloudflare Worker/D1 storage and a native-DOM browser
component; Azure remains an architectural alternative. See CONTRACT-001 for the
qualified native comment protocol, which is independent of UMF action execution.

## Development

Use Bun 1.4.3 for development. Node 22+ runs the supported Miniflare harness.

```sh
bun install --frozen-lockfile
bun run check
bun run test:workerd
bunx playwright install chromium
bun run test:browser
```

`bun run build:browser` produces only the embeddable distribution and does not
require server dependencies. Install into any Hugo site with
`bun src/cli/install-hugo.ts /path/to/site`; call `concourse.html` in its base or
footer template and set `params.concourse` as documented in CONTRACT-001.
Documentor has matching opt-in installation through `publish.site.concourse`.

The API uses `/__concourse/` on the publication's own origin. Configure Access,
site membership, a migrated D1 database and a Worker route before enabling it.
There is no production debug-login option. Use the small [Terraform foundation](infra/cloudflare/README.md) and
[Wrangler release procedure](docs/helix/05-deploy/first-slices.md) for the
owner-selected `helix.synaptiq.tools` target. `cloudflare:prepare` works offline;
`cloudflare:deploy` requires a reviewed release digest and never runs migrations.

Install the repository pre-commit gate with `git config core.hooksPath .githooks`.
Use the installed HELIX catalog; methodology templates are not vendored here.

## License

Concourse is available under `MIT OR Apache-2.0`, at your option. See
[MIT](LICENSE-MIT) and [Apache-2.0](LICENSE-APACHE).

Bundled dependency attribution is retained in [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).
