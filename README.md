# Novirhyza Concourse

Shared access and collaboration for published content: protected static sites,
comments and, later, structured interactions described by UMF.

Start with [the project index](docs/helix/README.md). Discovery and initial framing
are recorded; application implementation and infrastructure deployment have not
started.

Concourse builds on the Entropy Exchange playbooks pattern: static publication
with managed login and access control. The proposed split keeps reusable hosting
in the existing infrastructure estate, collaboration in Concourse, portable
models/action declarations in UMF, and content in the publishing repositories.

TypeScript with Bun development tooling, Cloudflare as the first hosting
candidate, managed provider login and Playwright verification are owner-accepted
planning assumptions. Database, UI framework, hosting selection and exact
integration contracts remain design decisions. Azure remains an alternative.

## Development

No application dependencies, runtime commands or deployment credentials are
required for this documentation bootstrap. Use the installed HELIX plugin;
methodology templates and prompts are not vendored here.

## License

Source/package licensing requires an owner decision before code distribution.
Repository visibility alone does not grant a software license.
