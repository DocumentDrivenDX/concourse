# Working in Concourse

This repository uses HELIX. Read `.helix.yml`, engage the installed `helix`
skill and start with `docs/helix/README.md`.

- Keep governed artifacts under the matching `docs/helix/` activity.
- Resolve the graph, templates and prompts from the installed HELIX plugin;
  do not vendor the methodology catalog.
- Read governing upstream artifacts before authoring downstream documents.
  Preserve artifact IDs, frontmatter and deliberate `ddx.links` traceability.
- Separate owner decisions, planning assumptions, source evidence and unknowns.
  Configuration inspection does not prove live service behavior.
- Respect the ownership split: Concourse owns collaboration runtime and UI;
  UMF owns portable models and action declarations; site repositories own
  content; existing infrastructure owns shared hosting and access resources.
- Serverless is an owner constraint. TypeScript/Bun, Cloudflare as the first
  candidate, managed provider login and Playwright are accepted planning
  assumptions, not qualified deployment claims. Database and UI remain open.
- Authorize reads and writes on the server against authenticated identity.
  Protect alternate origins, preview hosts, indexes and downloads. Never derive
  authority from a client-provided author, role or site identifier alone.
- Keep signed publication bytes separate from mutable discussion. Preserve
  resource/revision identity and unknown UMF content; refuse unqualified action
  execution. Do not imply D1 or another backend satisfies UMF transaction
  profiles without exact evidence.
- The owner authorized implementation on 2026-10-29: first remove Entropy Exchange
  special cases, then add inline comments to HELIX microsites for signed-in users.
  Complete affected design/contracts/test allocation before feature work.
  Prepare cross-repository changes without touching unrelated working files.
  Production applies, secret access and migrations need their own authorization.
