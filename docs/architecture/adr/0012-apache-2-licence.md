# 0012. Apache-2.0 licence

- **Status:** Accepted
- **Date:** 2026-10-24

## Context

DeskQuest is open source from day one (plan D14) and aims to be adopted by
companies that self-host it. The spec (§13.1) recommends evaluating
Apache-2.0, with MIT as a simpler alternative.

## Decision

License the source code under the **Apache License 2.0** (`LICENSE`).

## Consequences

- Permissive reuse, including commercially, with an explicit patent grant,
  which companies evaluating self-hosted software tend to look for.
- Contributions are accepted under the same licence (Apache-2.0 §5); no
  separate contributor agreement is required.
- The code licence does not automatically cover artwork, fonts or other
  assets (spec §13.2). Phase 4 adds an asset and dependency attribution
  inventory, and a `NOTICE` file if any dependency requires one.
- This is a project decision, not legal advice.
